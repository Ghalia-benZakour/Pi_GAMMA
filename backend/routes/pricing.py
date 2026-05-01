from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Simulation
from auth_service import get_current_user
from actuarial_models import pricing_engine

router = APIRouter()


class ProfileInput(BaseModel):
    age:                  str = "36-50"
    experience:           str = "6-10"
    type_vehicule:        str = "berline"
    puissance:            str = "76-110cv"
    region:               str = "sud"
    historique_sinistres: str = "0"
    anciennete_contrat:   str = "2-5"
    modele:               str = "glm_poisson_gamma"


@router.post("/simulate")
def simulate(profile: ProfileInput, db: Session = Depends(get_db),
             current_user=Depends(get_current_user)):
    result = pricing_engine.calculate(profile.model_dump(exclude={"modele"}), model=profile.modele)
    # Persist simulation
    sim = Simulation(
        user_id=current_user.id if current_user else None,
        age=profile.age,
        experience=profile.experience,
        type_vehicule=profile.type_vehicule,
        puissance=profile.puissance,
        region=profile.region,
        historique_sinistres=profile.historique_sinistres,
        anciennete_contrat=profile.anciennete_contrat,
        frequence_estimee=result["frequence_estimee"],
        severite_estimee=result["severite_estimee"],
        prime_pure=result["prime_pure"],
        niveau_risque=result["niveau_risque"],
    )
    db.add(sim)
    db.commit()
    result["simulation_id"] = sim.id
    return result


@router.get("/models")
def list_models():
    return {"models": pricing_engine.get_models_info()}


@router.get("/options")
def simulation_options():
    """Return all selectable values for simulation form."""
    from actuarial_models import FrequencyModel, SeverityModel
    fm = FrequencyModel()
    sm = SeverityModel()
    return {
        "age":                  list(fm.COEFFICIENTS["age"].keys()),
        "experience":           list(fm.COEFFICIENTS["experience"].keys()),
        "type_vehicule":        list(fm.COEFFICIENTS["type_vehicule"].keys()),
        "puissance":            list(fm.COEFFICIENTS["puissance"].keys()),
        "region":               list(fm.COEFFICIENTS["region"].keys()),
        "historique_sinistres": list(fm.COEFFICIENTS["historique_sinistres"].keys()),
        "anciennete_contrat":   list(fm.COEFFICIENTS["anciennete_contrat"].keys()),
    }


@router.get("/history")
def simulation_history(limit: int = 20, db: Session = Depends(get_db),
                       current_user=Depends(get_current_user)):
    q = db.query(Simulation)
    if current_user and current_user.role == "assure":
        q = q.filter(Simulation.user_id == current_user.id)
    sims = q.order_by(Simulation.created_at.desc()).limit(limit).all()
    return {"data": [
        {"id": s.id, "age": s.age, "type_vehicule": s.type_vehicule,
         "region": s.region, "prime_pure": s.prime_pure,
         "niveau_risque": s.niveau_risque, "created_at": str(s.created_at)}
        for s in sims
    ]}
