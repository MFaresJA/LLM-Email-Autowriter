# 🧠 Backend - LLM Email Autowriter

This is the FastAPI backend of the LLM Email Autowriter system. It handles user authentication, email generation, saving history, and communicating with the LLM (vLLM or Hugging Face) for inference.

## 🔧 Features

- User Registration & Login (JWT Auth)
- Email Verification Simulation
- Access & Refresh Token System (Secure HttpOnly cookies)
- Email Prompt → LLM → Streamed Response
- SQLite DB with SQLAlchemy ORM
- Swagger Docs for API exploration

## 🧪 API Documentation (Swagger)

![Swagger](../assets/swaggerpage.jpg)
- *API endpoints overview*

### Email Verification Logic

![Email Verification](../assets/emailverification.jpg)
- *Simulated email verification message*

## 🔐 Auth Flow

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/me` (JWT-protected)
- `/api/auth/refresh` (via refresh token cookie)
- `/api/auth/verify-email`

---

## 🧱 System Architecture

![System Diagram](../assets/Systemoverview.png)
- *Architecture & flow overview*

---

## ⚙️ Setup

```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Visit: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🤖 LLM Inference

You can choose between:

- ✅ **vLLM (local on GPU)**: `http://localhost:8000/generate`
- 🌐 **Hugging Face Router (Heroku demo)**

---

## 🗃️ Database

- SQLite (local)
- Stores: users, prompts, email responses, tokens

---

## 🧪 Development Notes

- `.env.example` included — configure model endpoints and secrets.
- Docker support coming soon (compose-ready).
