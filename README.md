# THEXRA AI Solution Architect V1 — Live

An enterprise-grade, AI-driven proposal generation engine and sales management platform built to capture operational requirements, analyze spatial/immersive technology needs via Gemini AI, automate workflow processing through n8n, and sync live CRM leads to an executive dashboard.

---

## 1. Live URLs & Deployment
* **Intake Form (Live Production):** `https://hidayu-bit.github.io/thexra-ai-architect/docs/wireframe.html`
* **Sales Operations Dashboard:** `https://hidayu-bit.github.io/thexra-ai-architect/docs/admin.html`
* **GitHub Repository:** `https://github.com/hidayu-bit/thexra-ai-architect`

---

## 2. System Architecture
[ Client / User ]
│ (HTTP Submit)
▼
[ Enterprise Intake Form (wireframe.html) ]
│
▼ (Webhook POST / JSON Payload)
[ n8n Automation Engine ]
├──► [ Gemini AI Engine (Prompt Structuring & Solution Scoping) ]
└──► [ Google Sheets CRM (Live Database Sync) ]
│
▼ (GViz CSV Fetch / REST)
[ Sales Dashboard (admin.html) ]
│
▼ (Interactive Overlay)
[ Client Lifecycle History Modal ]

---

## 3. Environment Variables & Credentials Configuration

Configure the following environment variables inside your n8n workspace / deployment environment:

| Variable Name            | Description                                                                    | Target Service                |
| :----------------------- | :----------------------------------------------------------------------------- | :---------------------------- |
| `GEMINI_API_KEY`         | Google Gemini AI Studio API Key for qualification prompts                      | Gemini 1.5 / 2.0 Flash API    |
| `N8N_WEBHOOK_URL`        | Production Webhook endpoint listening for form submissions                     | n8n Webhook Node              |
| `GOOGLE_SHEET_ID`        | Google Sheets CRM document ID (`1AFjgWSm9TTcuXzT9Eo9qrADEGhzGY_9zIb22A-acuJU`) | Google Sheets Node / GViz API |
| `GOOGLE_DRIVE_FOLDER_ID` | Target folder ID storing generated proposal PDFs                               | Google Drive API              |

---

## 4. Setup & Local Installation Instructions

### Prerequisites
* Web Browser (Google Chrome / Microsoft Edge)
* Local Web Server (VS Code Live Server or python `-m http.server 5500`)
* Active n8n Instance (Cloud or Docker)

### Installation Steps
1. **Clone Repository:**
   ```bash
   git clone [https://github.com/hidayu-bit/thexra-ai-architect.git](https://github.com/hidayu-bit/thexra-ai-architect.git)
   cd thexra-ai-architect