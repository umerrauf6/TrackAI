# TrackrAI 🚀

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Groq](https://img.shields.io/badge/AI_Model-Llama_3-f59e0b?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**TrackrAI** is an automated, multi-user **Job Application Tracker SaaS** designed to eliminate manual data entry. By linking their Gmail inbox, TrackrAI automatically scans incoming emails, uses the **Groq API (Llama 3)** to parse details (company, role, salary, status), and populates a sleek, responsive Kanban tracking board.

---

## 🌟 Key Features

*   **Google & GitHub OAuth:** Multi-user secure login out of the box. Users can sign in securely and keep their data isolated.
*   **Gmail Auto-Sync & Detection:** Scans subjects and content for confirmation, interview, and offer letters.
*   **Llama 3 AI Email Parsing:** Connects directly to the **Groq API** (utilizing `llama3-8b-8192` in JSON Mode) to instantly parse unstructured email bodies into structured JSON job schema properties.
*   **Interactive Kanban Board:** Built with **native HTML5 drag-and-drop** handlers for smooth status changes (`Bookmarked`, `Applied`, `Interviewing`, `Offer`, `Rejected`).
*   **Slo-mo GSAP & Framer Motion Transitions:** Dark cosmic layout with glassmorphic cards, glowing headers, and interactive staggered animations.
*   **Dynamic SVG Analytics:** Live metrics tracking application response rates, funnel conversion ratios, and stage distribution charts.
*   **Task Checklist & Status Timeline:** Status changes dynamically auto-generate interview check-lists (e.g. mock screens, recruiter follow-ups).
*   **Gmail Simulator (Developer Sandbox):** A built-in side drawer mock inbox to test and witness the Groq AI parser work instantly without configuring live Google Cloud Developer Console credentials!

---

## 🛠️ Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Database ORM:** Prisma Client
*   **Development DB:** SQLite (local `dev.db` file)
*   **Production DB:** PostgreSQL (Neon / Supabase ready)
*   **Animations:** Framer Motion & GSAP (GreenSock)
*   **AI Engine:** Groq API (Llama 3)
*   **Styles:** Vanilla CSS Custom Property Design Tokens

---

## ⚡ Quickstart & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/TrackrAI.git
cd TrackrAI
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and define your API keys:

```ini
# Groq API Key (Enables Llama 3 email parsing. If omitted, falls back to regex parsing)
GROQ_API_KEY=your_groq_api_key_here

# JWT Secret Key (Used to encrypt user session cookies)
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth Credentials (Enable login & Gmail Sync integration)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# GitHub OAuth Credentials (Enable login)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback

# Database Connection URL (Set to SQLite file locally, swap to PostgreSQL for Vercel)
DATABASE_URL="file:./dev.db"
```

### 3. Install Packages
```bash
npm install
```

### 4. Initialize the Database
Generate the local SQLite database and run the migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Launch the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser to view the application.

---

## 🔮 Gmail Parser Details & Fallback

If you don't have a `GROQ_API_KEY` configured, TrackrAI uses a smart local **Regex Heuristics Fallback Engine** to inspect subjects and bodies for company names, positions, and details. Adding a Groq key instantly unlocks full Llama 3 parsing, extracting salaries, recruiter next steps, and generating custom checklist items.

---

## 🚀 Deploying to Production (Vercel + PostgreSQL)

1.  **Switch to PostgreSQL:** In [prisma/schema.prisma](file:///d:/project/Job-Tracker/prisma/schema.prisma), change the provider to `postgresql`:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  **Provision a DB:** Create a database on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/) and update `DATABASE_URL` in your env settings. Push migrations using:
    ```bash
    npx prisma db push
    ```
3.  **Deploy on Vercel:** Link your GitHub repo to Vercel, copy your Environment Variables, and ensure a `"postinstall": "prisma generate"` script is inside your `package.json` so Vercel builds the Prisma Client during deployment.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
