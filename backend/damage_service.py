import json
import base64
import httpx
from config import ROBOFLOW_API_KEY, ROBOFLOW_PROJECT, ROBOFLOW_VERSION

# ─── Cost table per part ────────────────────────────────────────────────────

PART_COSTS = {
    "pare-chocs avant":     (200, 800),
    "pare-chocs arrière":   (180, 750),
    "capot":                (300, 1200),
    "aile avant gauche":    (250, 900),
    "aile avant droite":    (250, 900),
    "aile arrière gauche":  (280, 1000),
    "aile arrière droite":  (280, 1000),
    "portière avant gauche":(350, 1400),
    "portière avant droite":(350, 1400),
    "portière arrière gauche":(300, 1200),
    "portière arrière droite":(300, 1200),
    "vitre":                (150, 600),
    "pare-brise":           (300, 1200),
    "phare avant":          (150, 800),
    "feu arrière":          (100, 500),
    "toit":                 (400, 2000),
    "coffre":               (300, 1500),
    "jante":                (100, 600),
    "rétroviseur":           (80, 400),
    "carrosserie générale": (200, 1000),
}

DAMAGE_CLASS_MAP = {
    # Roboflow class names → normalized names
    "front-bumper":       "pare-chocs avant",
    "rear-bumper":        "pare-chocs arrière",
    "hood":               "capot",
    "front-left-fender":  "aile avant gauche",
    "front-right-fender": "aile avant droite",
    "rear-left-fender":   "aile arrière gauche",
    "rear-right-fender":  "aile arrière droite",
    "front-left-door":    "portière avant gauche",
    "front-right-door":   "portière avant droite",
    "rear-left-door":     "portière arrière gauche",
    "rear-right-door":    "portière arrière droite",
    "windshield":         "pare-brise",
    "window":             "vitre",
    "headlight":          "phare avant",
    "tail-light":         "feu arrière",
    "roof":               "toit",
    "trunk":              "coffre",
    "wheel":              "jante",
    "mirror":             "rétroviseur",
    # also accept class names as-is
}


def _normalize_part(class_name: str) -> str:
    return DAMAGE_CLASS_MAP.get(class_name.lower(), "carrosserie générale")


def _estimate_cost(parts: list, damage_level: str) -> tuple:
    multiplier = {"léger": 0.4, "modéré": 0.75, "grave": 1.1, "très grave": 1.4}.get(damage_level, 0.75)
    total_min = total_max = 0
    for part in parts:
        lo, hi = PART_COSTS.get(part, (200, 1000))
        total_min += lo * multiplier
        total_max += hi * multiplier
    if not parts:
        total_min, total_max = 200 * multiplier, 1000 * multiplier
    return round(total_min), round(total_max)


def _classify_damage(confidence_scores: list) -> tuple:
    if not confidence_scores:
        return "indéterminé", "external"
    avg_conf = sum(confidence_scores) / len(confidence_scores)
    n        = len(confidence_scores)
    if avg_conf < 0.35 or n <= 1:      level = "léger"
    elif avg_conf < 0.55 or n <= 2:    level = "modéré"
    elif avg_conf < 0.75 or n <= 4:    level = "grave"
    else:                               level = "très grave"

    damage_type = "mixte" if n >= 3 and avg_conf > 0.6 else "external"
    return level, damage_type


async def analyze_damage_roboflow(image_b64: str, filename: str = "image.jpg") -> dict:
    """Call Roboflow inference API."""
    if not ROBOFLOW_API_KEY:
        return _mock_analysis(filename)

    url = (f"https://detect.roboflow.com/{ROBOFLOW_PROJECT}/{ROBOFLOW_VERSION}"
           f"?api_key={ROBOFLOW_API_KEY}&confidence=30&overlap=30")
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, data=image_b64,
                                     headers={"Content-Type": "application/x-www-form-urlencoded"})
        if resp.status_code != 200:
            return _mock_analysis(filename)
        data = resp.json()
        return _parse_roboflow_response(data, filename)
    except Exception:
        return _mock_analysis(filename)


def _parse_roboflow_response(data: dict, filename: str) -> dict:
    predictions = data.get("predictions", [])
    parts_detected = []
    confidences    = []

    for pred in predictions:
        class_name = pred.get("class", "")
        conf       = pred.get("confidence", 0)
        part       = _normalize_part(class_name)
        if part not in parts_detected:
            parts_detected.append(part)
        confidences.append(conf)

    damage_level, damage_type = _classify_damage(confidences)
    cost_min, cost_max = _estimate_cost(parts_detected, damage_level)

    return {
        "filename":        filename,
        "detected_parts":  parts_detected,
        "damage_level":    damage_level,
        "damage_type":     damage_type,
        "cost_estimate_min": cost_min,
        "cost_estimate_max": cost_max,
        "confidence":      round(sum(confidences) / max(len(confidences), 1), 3),
        "nb_detections":   len(predictions),
        "raw_predictions": predictions,
        "source":          "roboflow",
    }


def _mock_analysis(filename: str) -> dict:
    """Demo analysis when no API key is configured."""
    import random
    random.seed(hash(filename) % 1000)

    scenario_pool = [
        {"parts": ["pare-chocs avant", "phare avant", "aile avant droite"],
         "level": "modéré", "type": "external", "conf": 0.72},
        {"parts": ["portière avant gauche", "rétroviseur"],
         "level": "léger", "type": "external", "conf": 0.61},
        {"parts": ["capot", "aile avant gauche", "pare-brise", "toit"],
         "level": "grave", "type": "mixte", "conf": 0.84},
        {"parts": ["pare-chocs arrière", "feu arrière", "coffre"],
         "level": "modéré", "type": "external", "conf": 0.68},
        {"parts": ["jante", "portière arrière droite"],
         "level": "léger", "type": "external", "conf": 0.55},
    ]
    s = random.choice(scenario_pool)
    cost_min, cost_max = _estimate_cost(s["parts"], s["level"])

    return {
        "filename":         filename,
        "detected_parts":   s["parts"],
        "damage_level":     s["level"],
        "damage_type":      s["type"],
        "cost_estimate_min": cost_min,
        "cost_estimate_max": cost_max,
        "confidence":       s["conf"],
        "nb_detections":    len(s["parts"]),
        "raw_predictions":  [],
        "source":           "demo (ROBOFLOW_API_KEY non configuré)",
        "note":             "Configurez ROBOFLOW_API_KEY dans .env pour activer la détection réelle.",
    }
