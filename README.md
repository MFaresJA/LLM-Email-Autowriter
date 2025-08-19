# ✉️ LLM Email Autowriter

This project is a full-stack web application that allows users to generate professional emails from short prompts using a large language model (LLM) served locally via vLLM. The app supports tone and length customization, user authentication, history saving, and frontend/backend separation.

---

## 🚀 Features

- ✅ Email generation from short prompt + tone + length
- ✅ Signature customization and prevention of duplication
- ✅ User authentication (JWT access/refresh tokens)
- ✅ Email saving and viewing history per user
- ✅ Angular frontend connected to FastAPI backend
- ✅ Docker support for LLM inference using vLLM (e.g., Qwen2.5)
- ✅ Frontend styling + form validation

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|------------|
| **Frontend** | Angular |
| **Backend**  | FastAPI |
| **Auth**     | JWT (access & refresh tokens) |
| **Database** | SQLite (SQLAlchemy ORM) |
| **LLM Inference** | vLLM + Qwen2.5 models |
| **Deployment** | Docker |

---

## 🔧 Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/MFaresJA/LLM-Email-Autowriter.git
cd LLM-Email-Autowriter
