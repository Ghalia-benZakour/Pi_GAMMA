import base64
import json
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from database import get_db, DamageAnalysis
from auth_service import get_current_user
from damage_service import analyze_damage_roboflow

router = APIRouter()


@router.post("/analyze")
async def analyze_damage(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = await file.read()
    image_b64 = base64.b64encode(content).decode("utf-8")

    result = await analyze_damage_roboflow(image_b64, filename=file.filename)

    record = DamageAnalysis(
        user_id=current_user.id if current_user else None,
        filename=file.filename,
        detected_parts=json.dumps(result["detected_parts"], ensure_ascii=False),
        damage_level=result["damage_level"],
        damage_type=result["damage_type"],
        cost_estimate_min=result["cost_estimate_min"],
        cost_estimate_max=result["cost_estimate_max"],
        confidence=result["confidence"],
        raw_predictions=json.dumps(result.get("raw_predictions", []), ensure_ascii=False),
    )
    db.add(record)
    db.commit()
    result["analysis_id"] = record.id
    return result


@router.get("/history")
def damage_history(limit: int = 20, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    q = db.query(DamageAnalysis)
    if current_user and current_user.role == "assure":
        q = q.filter(DamageAnalysis.user_id == current_user.id)
    records = q.order_by(DamageAnalysis.created_at.desc()).limit(limit).all()
    return {"data": [
        {
            "id":              r.id,
            "filename":        r.filename,
            "detected_parts":  json.loads(r.detected_parts or "[]"),
            "damage_level":    r.damage_level,
            "damage_type":     r.damage_type,
            "cost_estimate_min": r.cost_estimate_min,
            "cost_estimate_max": r.cost_estimate_max,
            "confidence":      r.confidence,
            "created_at":      str(r.created_at),
        }
        for r in records
    ]}


@router.get("/status")
def damage_status():
    from config import ROBOFLOW_API_KEY, ROBOFLOW_PROJECT, ROBOFLOW_VERSION
    return {
        "roboflow_configured": bool(ROBOFLOW_API_KEY),
        "project":  ROBOFLOW_PROJECT,
        "version":  ROBOFLOW_VERSION,
        "mode":     "live" if ROBOFLOW_API_KEY else "demo",
    }
