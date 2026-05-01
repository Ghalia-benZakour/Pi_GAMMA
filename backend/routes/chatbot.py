from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db, ChatMessage
from auth_service import get_current_user
from gemini_service import ask_gemini
from config import GEMINI_API_KEY

router = APIRouter()


class ChatInput(BaseModel):
    message: str
    role:    str = "assureur"
    page:    str = "dashboard"
    context: Optional[dict] = None


@router.post("/ask")
async def ask(payload: ChatInput, db: Session = Depends(get_db),
              current_user=Depends(get_current_user)):
    reply = await ask_gemini(
        message=payload.message,
        role=payload.role,
        page=payload.page,
        context=payload.context,
    )
    record = ChatMessage(
        user_id=current_user.id if current_user else None,
        role_ctx=payload.role,
        user_msg=payload.message,
        bot_reply=reply,
        page_ctx=payload.page,
    )
    db.add(record)
    db.commit()
    return {
        "answer": reply,
        "configured": bool(GEMINI_API_KEY),
        "role": payload.role,
    }


@router.get("/status")
def chatbot_status():
    return {"provider": "Gemini 1.5 Flash", "configured": bool(GEMINI_API_KEY)}


@router.get("/history")
def chat_history(limit: int = 30, db: Session = Depends(get_db),
                 current_user=Depends(get_current_user)):
    q = db.query(ChatMessage)
    if current_user and current_user.role == "assure":
        q = q.filter(ChatMessage.user_id == current_user.id)
    msgs = q.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    return {"data": [
        {"id": m.id, "user_msg": m.user_msg, "bot_reply": m.bot_reply,
         "page_ctx": m.page_ctx, "created_at": str(m.created_at)}
        for m in reversed(msgs)
    ]}
