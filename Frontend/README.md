# 🌐 Frontend - LLM Email Autowriter

This is the frontend interface of the LLM Email Autowriter project, built using Angular. It allows users to input prompts, select tone and length, manage authentication, and interact with the LLM-powered backend in real time.

🧪 **Try the Live Demo**  
👉 [Heroku Deployment Link](https://llm-email-autowriter-demo-e615d6f6162e.herokuapp.com/generate)  

## 📚 Table of Contents
- [Features](#features)
- [UI Screenshots](#ui-screenshots)
- [Setup & Run](#setup--run)
- [Tech](#tech)

![Homepage](../assets/homepage.jpg)
*Landing page with feature highlights*

## 🧠 Features

- Prompt input with real-time tone and length customization
- Signature and recipient input fields
- Secure user authentication with JWT, profile management
- Real-time email generation
- History view with search and filtering
- Responsive and clean UI

## 🖼️ UI Screenshots

### Prompt Input & Generation

![Prompt UI](../assets/PromptWithMoreSpecification.jpg)
- *Generate email with tone & length selection*

![Tone Options](../assets/ShowingTone.jpg)
- *Tone options dropdown*

![Length Options](../assets/ShowingLength.jpg)
- *Length options dropdown*

### Generated Output

![Generated Email](../assets/generatedEmail.jpg)
- *Email generated from prompt*

![Copy & Clear](../assets/CopyandClearbuttons.jpg)
- *Buttons to copy or clear the output*

### History and Search

![History Page](../assets/HistoryPage.jpg)
- *Full email generation history*

![Search History](../assets/searchingusingsearchbarinHistory.jpg)
- *Search by keyword in history*

### Profile and Auth

![Profile Dropdown](../assets/ProfileTap.jpg)
- *Authenticated profile menu*

![Profile Page](../assets/ProfilePage.jpg)
- *User profile info (name, email, verification)*

![Register Page](../assets/registerpage.jpg)
- *Account creation form*

![Login Page](../assets/loginpage.jpg)
- *User login page*

---

## 🛠️ Setup & Run

```bash
cd Frontend
npm install
ng serve
```

Visit: [http://localhost:4200](http://localhost:4200)

---

## 🧰 Tech Stack

- Angular 20.1.6
- TypeScript, HTML, CSS
- Angular Forms, Routing
- JWT Token Storage (HttpOnly Cookie)
