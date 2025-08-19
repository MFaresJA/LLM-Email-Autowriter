
from database import SessionLocal
from models import User, EmailRequest

db = SessionLocal()

users = db.query(User).all()
for user in users:
    print(f"\nUser: {user.name} ({user.email})")
    print(f"Created at: {user.created_at}")
    print(f"Verified: {user.is_verified}")
    print("Generated Emails:")
    for email in user.emails:
        print(f"  - Prompt: {email.prompt}")
        print(f"    → Generated: {email.generated_email}")
        print(f"    Created at: {email.created_at}")
