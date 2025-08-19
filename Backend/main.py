# main.py
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, EmailRequest, User
import logging, os
from typing import List
import httpx

from openai import OpenAI

from auth_router import router as auth_router
from user_router import router as user_router
from schemas import PromptRequest, EmailResponse, TokenData
from auth import get_current_token

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

VLLM_BASE_URL = os.getenv("VLLM_BASE_URL", "").rstrip("/")
VLLM_MODEL    = os.getenv("VLLM_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
HF_TOKEN      = os.getenv("HF_TOKEN")
ANGULAR_ORIGIN = os.getenv("ANGULAR_ORIGIN", "http://localhost:4200")

if VLLM_BASE_URL:
    base_url = f"{VLLM_BASE_URL}/v1"
    client = OpenAI(base_url=base_url, api_key="dummy", timeout=60)
    MODEL_NAME = VLLM_MODEL
    BACKEND = "vllm"
    logger.info(f"🔌 Using vLLM at {base_url} with model '{MODEL_NAME}'")
else:
    base_url = "https://router.huggingface.co/v1"
    client = OpenAI(base_url=base_url, api_key=HF_TOKEN, timeout=60)
    MODEL_NAME = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")
    BACKEND = "huggingface_router"
    logger.info(f"🔌 Using Hugging Face Router with model '{MODEL_NAME}'")

app = FastAPI(
    title="LLM Email AutoWriter",
    description="Generate professional emails with AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", ANGULAR_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Backend is running. Open /docs for Swagger.",
        "docs": "/docs",
        "llm_backend": BACKEND,
        "model": MODEL_NAME,
        "llm_url": base_url,
    }

@app.get("/api/llm/health")
async def llm_health():
    url = f"{VLLM_BASE_URL}/v1/models" if BACKEND == "vllm" else f"{base_url}/models"
    try:
        async with httpx.AsyncClient(timeout=10.0) as hx:
            r = await hx.get(url)
        return {"ok": r.status_code == 200, "status": r.status_code, "url": url, "json": r.json()}
    except Exception as e:
        return {"ok": False, "url": url, "error": str(e)}

app.include_router(auth_router, prefix="/api/auth")
app.include_router(user_router, prefix="/api/user")

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables ensured.")

@app.post("/api/generate", response_model=EmailResponse)
async def generate_email(
    req: PromptRequest,
    db: Session = Depends(get_db),
    token: TokenData = Depends(get_current_token),
):
    tone_str   = getattr(req.tone, "value", str(req.tone))
    length_str = getattr(req.length, "value", str(req.length))
    user_msg = f"Write a {tone_str} {length_str} email: {req.prompt}"

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": user_msg}],
            temperature=0.7,
            max_tokens=500,
        )
        result = completion.choices[0].message.content
    except Exception as e:
        logger.error(f"[LLM ERROR] url={base_url} model={MODEL_NAME} backend={BACKEND} :: {e}")
        raise HTTPException(status_code=503, detail="Email generation service unavailable")

    user = db.query(User).filter(User.email == token.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        email_record = EmailRequest(
            prompt=req.prompt,
            tone=tone_str,
            length=length_str,
            generated_email=result,
            user_id=user.id,
        )
        db.add(email_record)
        db.commit()
        db.refresh(email_record)

        
        return EmailResponse.from_orm(email_record)

    except Exception as e:
        db.rollback()
        logger.error(f"[DB ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to save email")

@app.get("/api/emails", response_model=List[EmailResponse])
async def get_emails(
    db: Session = Depends(get_db),
    token: TokenData = Depends(get_current_token),
):
    user = db.query(User).filter(User.email == token.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        email_records = (
            db.query(EmailRequest)
            .filter(EmailRequest.user_id == user.id)
            .order_by(EmailRequest.created_at.desc())
            .all()
        )
        return [EmailResponse.from_orm(email) for email in email_records]
    except Exception as e:
        logger.error(f"[DB ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve emails")
