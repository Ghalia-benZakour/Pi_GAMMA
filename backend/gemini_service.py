import json
import httpx
from config import GEMINI_API_KEY

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

SYSTEM_PROMPT = """Tu es un assistant expert en assurance automobile et actuariat.
Tu travailles sur la plateforme PI Assurance Analytics.
Tu aides les actuaires, assurés et développeurs à comprendre les données, modèles et résultats.

Règles :
- Réponds toujours en français
- Sois concis et précis (3-5 phrases maximum sauf si plus est nécessaire)
- Utilise le vocabulaire actuariel approprié
- Contextualise tes réponses selon le rôle et la page de l'utilisateur
- Ne mentionne jamais de données personnelles réelles
"""

PAGE_CONTEXTS = {
    "dashboard":   "L'utilisateur consulte le tableau de bord général du portefeuille assurance auto.",
    "portfolio":   "L'utilisateur analyse le portefeuille de contrats assurance auto.",
    "eda":         "L'utilisateur réalise une analyse exploratoire des données (EDA) actuarielles.",
    "temporal":    "L'utilisateur analyse l'évolution temporelle de la sinistralité.",
    "simulation":  "L'utilisateur vient de réaliser une simulation de prime.",
    "damage":      "L'utilisateur a uploadé une photo de véhicule endommagé pour estimation.",
    "developer":   "L'utilisateur est un développeur consultant les modèles et métriques.",
    "home":        "L'assuré consulte son espace personnel.",
}

ROLE_CONTEXTS = {
    "assureur":  "Tu parles à un actuaire/assureur qui maîtrise les concepts techniques.",
    "assure":    "Tu parles à un assuré particulier. Simplifie le vocabulaire technique.",
    "developer": "Tu parles à un développeur. Tu peux être très technique.",
}


async def ask_gemini(message: str, role: str = "assureur", page: str = "dashboard",
                     context: dict = None) -> str:
    if not GEMINI_API_KEY:
        return _fallback_response(message, role, page, context)

    role_ctx = ROLE_CONTEXTS.get(role, ROLE_CONTEXTS["assureur"])
    page_ctx = PAGE_CONTEXTS.get(page, "")
    ctx_str = ""
    if context:
        ctx_str = f"\nContexte actuel : {json.dumps(context, ensure_ascii=False)}"

    full_prompt = f"""{SYSTEM_PROMPT}

{role_ctx}
{page_ctx}{ctx_str}

Question de l'utilisateur : {message}"""

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"maxOutputTokens": 512, "temperature": 0.3},
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
        if resp.status_code == 200:
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            return _fallback_response(message, role, page, context)
    except Exception as e:
        return _fallback_response(message, role, page, context)


def _fallback_response(message: str, role: str, page: str, context: dict) -> str:
    msg = message.lower()
    if "prime" in msg or "tarif" in msg:
        return ("La prime pure est calculée selon la formule actuarielle : "
                "Prime Pure = Fréquence × Sévérité. La fréquence représente la probabilité de sinistre "
                "et la sévérité le coût moyen par sinistre. Configurez GEMINI_API_KEY pour des réponses enrichies.")
    if "dommage" in msg or "pièce" in msg or "réparation" in msg:
        return ("Le coût de réparation dépend des pièces touchées, de la gravité du dommage "
                "et du type de carrosserie. Notre modèle YOLO détecte les zones endommagées "
                "pour estimer la fourchette de coût. Configurez GEMINI_API_KEY pour plus de détails.")
    if "fréquence" in msg:
        return ("La fréquence actuarielle = Nombre de sinistres / Exposition. "
                "Elle mesure la probabilité qu'un contrat génère un sinistre sur la période d'observation.")
    if "sévérité" in msg:
        return ("La sévérité = Coût total des sinistres / Nombre de sinistres. "
                "Elle représente le coût moyen par sinistre déclaré.")
    if "risque" in msg:
        return ("Le niveau de risque est déterminé par la prime pure calculée : "
                "Faible (<150€), Modéré (150-250€), Élevé (250-400€), Très élevé (>400€).")
    if role == "assure":
        return ("Je suis votre assistant assurance. Je peux vous aider à comprendre votre prime, "
                "vos garanties ou déclarer un sinistre. Configurez GEMINI_API_KEY pour des réponses personnalisées.")
    return ("Assistant PI Assurance prêt. Configurez la variable GEMINI_API_KEY dans votre fichier .env "
            "pour activer les réponses enrichies par intelligence artificielle.")
