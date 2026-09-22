<div align="center">

# 🌾 SIYASAT
### Agricultural and Biosystems Engineering Research Repository

> **Automated Academic Thesis Ingestion, Thematic Folder Clustering, and AI-Driven Gap Discovery System**  
> Central Luzon State University (CLSU) — Department of Agricultural and Biosystems Engineering (DABE)

[![Branch](https://img.shields.io/badge/branch-prototype--4-800000?style=for-the-badge&logo=git&logoColor=white)](https://github.com/bluvisionary25/siyasat)
[![Version](https://img.shields.io/badge/version-v1.0--ReleaseCandidate-228b22?style=for-the-badge)](https://github.com/bluvisionary25/siyasat)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-0070f3?style=for-the-badge)](https://github.com/bluvisionary25/siyasat)
[![License](https://img.shields.io/badge/license-Academic%20Use-orange?style=for-the-badge)](https://github.com/bluvisionary25/siyasat)

</div>

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Key Architectural Modules](#-key-architectural-modules)
3. [CLSU DABE Specialization Tracks](#-clsu-dabe-specialization-tracks)
4. [Tech Stack](#-tech-stack)
5. [Setup & Installation](#-setup--installation)
6. [Environment Configuration](#-environment-configuration)
7. [Running the Application](#-running-the-application)
8. [API Reference](#-api-reference)
9. [User Roles & Permissions](#-user-roles--permissions)
10. [Project Structure](#-project-structure)
11. [Defense Deliverables](#-defense-deliverables)
12. [Contributing](#-contributing)

---

## 🌐 System Overview

**SIYASAT** *(Sistema ng Impormasyon para sa Yaman at Agham ng Agrikultura at Teknolohiya)* is a full-stack institutional research repository purpose-built for the **CLSU Department of Agricultural and Biosystems Engineering (DABE)**. It addresses three core operational problems historically present in departmental research management:

| Problem | SIYASAT Solution |
|---------|------------------|
| **Manual cataloging** — Faculty investing disproportionate effort filing and cross-referencing paper manuscripts without a metadata standard | Standardized digital ingestion with enforced CLSU DABE specialization track taxonomy |
| **Thematic silos** — Related research across land, water, machinery, and informatics tracks fragmented across disconnected storage | Automated Szymkiewicz-Simpson overlap clustering groups thematically similar papers into visual "Thematic Folders" |
| **Fragmented gap discovery** — Students starting literature surveys from scratch, missing internal departmental work | On-demand Groq LLM-powered AI Gap Analysis surfaces structured research gaps per paper, enriched with live OpenAlex DOI references |

### Current Release

| Property | Value |
|----------|-------|
| **Branch** | `prototype-4` |
| **Version** | `v1.0-ReleaseCandidate` |
| **Institution** | Central Luzon State University (CLSU) |
| **Department** | Agricultural and Biosystems Engineering (DABE) |
| **Target Date** | September 2026 |

---

## 🏗️ Key Architectural Modules

### 1. 🔬 Szymkiewicz-Simpson Overlap Clustering Engine

The core similarity engine uses the **Szymkiewicz-Simpson containment coefficient** — not cosine or Jaccard similarity — applied over morphologically stemmed, stopword-filtered token sets extracted from curated metadata fields only (never raw PDF content).

**Why Szymkiewicz-Simpson?**

Unlike Jaccard (divides by union) or cosine (divides by both vector norms), Simpson divides by the **minimum** of the two set sizes. This means a small, highly-specific paper that is fully contained within the thematic scope of a broader paper correctly scores near 1.0 — enabling accurate subset clustering that cosine-based methods would penalize.

**Token Weight Configuration:**

| Metadata Field | Weight | Rationale |
|---------------|--------|-----------|
| `title` | **1.5×** | High discriminating power — encodes research subject concisely |
| `keywords` | **1.5×** | Author-curated domain tags — highest precision signal |
| `abstract` | **1.0×** | Broader vocabulary — lower weight to reduce false-positive clustering |

**Clustering Threshold:**

```
overlap_score ≥ 0.50 (≥ 50%)  →  Paper joins the matched paper's cluster group (Thematic Folder)
overlap_score < 0.50           →  Paper becomes a new thematic anchor; first keyword → folder name
```

**Performance:** Sub-millisecond per pair using pure JavaScript `Set` operations — zero external API cost, fully deterministic, fully offline-capable.

**Morphological Suffix Stemmer:**

```js
// Applied before token set construction — improves recall across inflected vocabulary
const suffix_strip = /(ing|ed|ion|s|es|or|ator|ated|ation|er|ive|al|e)$/;
stem(w) = w.replace(suffix_strip, '') if result.length >= 3 else w
```

---

### 2. 🔍 Multi-Attribute Repository Indexing

Fast case-insensitive, multi-field search across the full thesis corpus:

```
GET /api/theses?q=solar+dryer&sort=year_desc&year=2025
```

- **Search fields:** `title`, `abstract`, `keywords`, `author` (all ILIKE matched)
- **Sort options:** `created_at DESC` (default), `year_desc`, `title_asc`
- **Client-side layer:** Real-time token matching for instant search feedback without API round trips

---

### 3. 🔐 Role-Based Access Control (RBAC)

Three distinct access tiers with hardcoded server-side enforcement:

#### 🌍 Public / Guest
- Unrestricted repository browsing, paper viewing, and PDF download
- Full access to AI Gap Analysis on any paper
- Zero registration required for read-only access

#### 🎓 Faculty Adviser
- **2-second visual loading gateway** on dashboard entry — prevents flash-of-unauthorized-content during JWT hydration
- Specialized paper ingestion via **ABE branch dropdown** enforcing CLSU DABE taxonomy
- Isolated **"WORKS" tab** showing only self-uploaded papers (`uploaded_by = req.user.id`)
- **Manuscript deletion is strictly locked out** at the API level (HTTP 403 for ADVISER role on DELETE routes)

#### 🛡️ System Administrator
- **Sole authority** to delete manuscripts — DELETE route enforces ADMIN-only role check + relational file cleanup (`fs.unlinkSync` on associated PDF)
- **AI Gap Analysis explicitly restricted** for ADMIN tokens to conserve institutional Groq API quota budget
- Full account management: activate, block, and reassign user roles via the Accounts Management panel

---

### 4. 🛡️ Route Hardening & Browser Navigation

The React SPA implements multi-layer protection against zombie hydration states and blank screens:

- **JWT expiry check on startup** — `getValidSessionUser()` decodes the stored token, reads `exp`, and clears `localStorage` if expired before any component mounts
- **`popstate` listener** — Intercepts browser back/forward navigation and re-resolves the application route from `window.location.pathname`, preventing blank screen rendering
- **`ProtectedRoute` component** — Triggers `onDenied()` callback immediately when `isAllowed` is `false`
- **URL state sync** — Every navigation calls `window.history.pushState()` to maintain bookmark and direct-link correctness

---

### 5. 🔒 Parameterized Data Integrity (SQL Injection Prevention)

All database writes use **PostgreSQL parameterized queries** via the `node-postgres` driver, completely preventing SQL injection and runtime 500 errors from special characters in thesis metadata:

```js
// PUT /api/theses/:id — Safe parameterized update
const values = [title, author, year, keywords, abstract, dept, cluster, score, matchId, thesisId];
pool.query(
  'UPDATE theses SET title=$1, author=$2, year=$3, keywords=$4, abstract=$5, department=$6, ' +
  'cluster_group=$7, similarity_score=$8, matched_thesis_id=$9 WHERE id=$10',
  values
);
// Apostrophes, quotes, and SQL metacharacters in abstracts are safely handled at the wire protocol level.
```

---

### 6. 🤖 Ethical AI Integration — Groq Gap Analysis

| Property | Value |
|----------|-------|
| **Provider** | Groq API (`openai/gpt-oss-120b`) |
| **Temperature** | `0.2` — low for deterministic, structured academic output |
| **Response Format** | `json_object` — enforces strict JSON schema compliance |
| **RAG Context** | 5 most recent departmental theses injected into each prompt |
| **Reference Enrichment** | OpenAlex REST API — live DOI-linked peer-reviewed papers per gap |
| **Caching** | PostgreSQL response caching — prevents duplicate billable Groq API calls |
| **ADMIN Restriction** | ADMIN-role tokens return HTTP 403 on gap analysis routes — conserves quota |

> ⚠️ **Academic AI Advisory**  
> AI-generated research gaps are intended as a starting point for literature exploration only. Verify all findings against peer-reviewed journal articles and institutional thesis archives. Do not cite AI output as a primary source.

---

## 🌾 CLSU DABE Specialization Tracks

The upload form enforces selection from standardized CLSU DABE academic specialization tracks, preventing free-text category pollution in the database:

| Code | Track Name | Research Domain |
|------|-----------|-----------------|
| **LWRE** | Land and Water Resources Engineering | Irrigation, watershed management, drainage systems, hydrology |
| **FPME** | Farm Power and Machinery Engineering | Mechanization, tractor systems, harvesting and planting equipment |
| **ABSE** | Agricultural and Biosystems Structures & Environmental Control | Greenhouse design, animal housing, ventilation and climate control |
| **PHBE** | Post-Harvest and Bioprocess Engineering | Grain drying, storage technology, milling, postharvest loss reduction |
| **IAA** | Informatics and Automation in Agriculture | IoT sensors, precision agriculture software, data systems, automation |

---

## 💻 Tech Stack

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **Frontend** | React 18, Tailwind CSS, Lucide Icons | Single-page application — all repository views, auth modals, AI result panels |
| **Build Tool** | Create React App / PostCSS | Frontend build pipeline |
| **Backend** | Node.js 18, Express 4 | REST API server — auth, upload, clustering, AI routes |
| **Database** | PostgreSQL 16 | Persistent storage: users, theses, cluster metadata |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | 8-hour access tokens, bcrypt-hashed passwords, 5-attempt lockout |
| **File Upload** | Multer | PDF ingestion (25 MB max), image upload (5 MB max) |
| **AI Inference** | Groq API | LLM-powered research gap extraction |
| **Reference API** | OpenAlex REST API | Live scholarly reference linking per identified gap |
| **Environment** | dotenv | Secure environment variable management |

---

## ⚙️ Setup & Installation

### Prerequisites

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| [Node.js](https://nodejs.org/) | v18+ | LTS recommended |
| [PostgreSQL](https://www.postgresql.org/) | v14+ | Local or hosted instance |
| [Git](https://git-scm.com/) | v2.30+ | For repository management |
| [Groq API Key](https://console.groq.com/) | — | Optional — enables live AI gap analysis |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/bluvisionary25/siyasat.git
cd siyasat
git checkout prototype-4
```

---

### Step 2 — Set Up the PostgreSQL Database

Create the database:

```sql
CREATE DATABASE siyasat_db;
```

Run the schema (the server auto-migrates columns on first start, but the base tables must exist):

```sql
CREATE TABLE users (
  id                    SERIAL PRIMARY KEY,
  full_name             VARCHAR(255) NOT NULL,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  role                  VARCHAR(20)  DEFAULT 'STUDENT',
  status                VARCHAR(20)  DEFAULT 'ACTIVE',
  failed_login_attempts INTEGER      DEFAULT 0,
  lockout_until         TIMESTAMP,
  profile_image         TEXT,
  created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE theses (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  abstract          TEXT,
  author            TEXT,
  year              INTEGER,
  keywords          TEXT,
  department        TEXT DEFAULT 'Department of Agricultural and Biosystems Engineering',
  file_path         TEXT,
  uploaded_by       INTEGER REFERENCES users(id),
  cluster_group     VARCHAR(120) DEFAULT 'Independent Studies',
  similarity_score  INTEGER      DEFAULT 0,
  matched_thesis_id INTEGER      DEFAULT NULL,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

> **Note:** The server performs `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` on startup for `cluster_group`, `similarity_score`, `matched_thesis_id`, `created_at`, and `profile_image` — existing databases are automatically upgraded without data loss.

---

### Step 3 — Configure the Backend

```bash
cd backend
npm install
cp .env.example .env
```

---

### Step 4 — Configure the Frontend

```bash
cd ../frontend
npm install
```

---

## 🔑 Environment Configuration

Edit `backend/.env` with your local settings:

```env
# Server
PORT=5000

# PostgreSQL Connection
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=siyasat_db
DB_HOST=localhost
DB_PORT=5432

# Authentication
JWT_SECRET=your_jwt_secret_key_minimum_32_chars

# AI Inference (optional — system degrades gracefully without it)
GROQ_API_KEY=your_groq_api_key

# AI Model (optional override)
GROQ_MODEL=openai/gpt-oss-120b
```

> ⚠️ **Security Notice:** Never commit your `.env` file. It is listed in `.gitignore`. Store production secrets in a secure vault or environment variable manager.

---

## 🚀 Running the Application

### Development Mode (Recommended)

**Terminal 1 — Start the Backend API:**
```bash
cd backend
npm run dev
```
> Backend runs at: **http://localhost:5000**  
> Uses `nodemon` for hot-reload on file changes.

**Terminal 2 — Start the Frontend SPA:**
```bash
cd frontend
npm start
```
> Frontend runs at: **http://localhost:3000**

---

### Production Build (Frontend)

```bash
cd frontend
npm run build
```
> Outputs to `frontend/build/` — serve via nginx, Apache, or any static hosting provider.

---

## 📡 API Reference

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/health` | No | Public | Server health check |
| `POST` | `/api/auth/login` | No | Public | Login; returns JWT + user object |
| `GET` | `/api/theses` | No | Public | List/search theses (`q`, `year`, `sort`, `uploaded_by`) |
| `POST` | `/api/theses/check-duplicate` | No | Public | Pre-upload duplicate detection (Jaccard, 30% threshold) |
| `POST` | `/api/theses` | ✅ | ADMIN/ADVISER | Upload new thesis PDF (25 MB max) + run clustering |
| `PUT` | `/api/theses/:id` | ✅ | ADMIN/ADVISER | Update thesis metadata + re-run clustering engine |
| `DELETE` | `/api/theses/:id` | ✅ | **ADMIN only** | Delete record + unlink associated PDF from disk |
| `POST` | `/api/theses/recluster-all` | ✅ | **ADMIN only** | Re-run clustering engine across entire repository |
| `GET` | `/api/theses/:id/download` | No | Public | Download thesis PDF (or generate synthetic fallback) |
| `POST` | `/api/theses/:id/analyze-gap` | ✅ | Non-ADMIN | Per-thesis AI gap analysis; caches result to DB |
| `POST` | `/api/analyze-single-gap` | Optional | Non-ADMIN | Gap analysis (any payload); blocks ADMIN tokens |
| `POST` | `/api/analyze-global-gaps` | No | Open | Repository-wide gap synthesis (top 30 theses) |
| `POST` | `/api/users/profile-picture` | ✅ | Any | Upload user profile picture (5 MB max) |
| `GET` | `/api/admin/users` | ✅ | **ADMIN only** | List all registered accounts |
| `PUT` | `/api/admin/users/:id/status` | ✅ | **ADMIN only** | Set user status: `ACTIVE` or `BLOCKED` |
| `PUT` | `/api/admin/users/:id/role` | ✅ | **ADMIN only** | Change user role: `STUDENT` / `ADVISER` / `ADMIN` |

---

## 👥 User Roles & Permissions

| Capability | Public | Adviser | Admin |
|-----------|--------|---------|-------|
| Browse & search repository | ✅ | ✅ | ✅ |
| View paper details & download PDF | ✅ | ✅ | ✅ |
| Run AI Gap Analysis | ✅ | ✅ | 🚫 *(quota conservation)* |
| Upload / ingest new thesis | 🚫 | ✅ | ✅ |
| Edit thesis metadata | 🚫 | ✅ *(own uploads)* | ✅ *(all records)* |
| Delete thesis record | 🚫 | 🚫 *(locked)* | ✅ *(sole authority)* |
| Recluster entire repository | 🚫 | 🚫 | ✅ |
| View & manage user accounts | 🚫 | 🚫 | ✅ |
| Block / unblock user accounts | 🚫 | 🚫 | ✅ |
| Change user roles | 🚫 | 🚫 | ✅ |

> **Account Provisioning:** Public self-registration is disabled in production. All accounts are provisioned by the System Administrator through the in-app Accounts Management panel.

---

## 📁 Project Structure

```
siyasat/
├── backend/
│   ├── server.js               # Express API server (1,124 lines) — all routes, clustering engine, AI integration
│   ├── package.json            # Node.js dependencies
│   ├── .env.example            # Environment variable template
│   ├── .gitignore              # Backend-level gitignore (node_modules, uploads, .env)
│   └── uploads/                # Uploaded PDF storage (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root app, routing, session management, auth state
│   │   ├── App.js              # Legacy routing (maintained for compatibility)
│   │   └── components/
│   │       ├── HomePage.jsx         # Landing page with featured research
│   │       ├── RepositoryPage.jsx   # Main thesis browser — search, cluster view, AI panel
│   │       ├── PaperDetailsPage.jsx # Individual paper view + AI gap analysis modal
│   │       ├── UploadPage.jsx       # Thesis ingestion form with duplicate detection
│   │       ├── EditPaperPage.jsx    # Metadata editing with live re-clustering
│   │       ├── AccountsPage.jsx     # Admin user management panel
│   │       ├── AuthModal.jsx        # Login modal with JWT session handling
│   │       ├── Navbar.jsx           # Navigation bar with role-aware menu items
│   │       ├── ProfilePage.jsx      # Adviser profile + uploaded works
│   │       ├── StudentProfilePage.jsx # Student view profile
│   │       ├── AboutUsPage.jsx      # Department and team information
│   │       └── SiyasatLogo.jsx      # Logo component
│   ├── public/                 # Static assets
│   └── package.json            # Frontend dependencies
│
├── README.md                            # This file
├── .gitignore                           # Root-level gitignore
├── CLASS_DIAGRAM.md                     # System class diagram (Mermaid)
├── SIYASAT_10_Sprint_Product_Backlog.docx  # Defense deliverable: Sprint backlog
├── SIYASAT_System_Summary_Defense.docx    # Defense deliverable: Architecture briefing
├── generate_backlog.js                  # Backlog document generator script
└── generate_defense_doc.js              # Defense document generator script
```

---

## 📦 Defense Deliverables

The following formal documents were generated directly from codebase inspection and are included in the repository root:

| Document | Description |
|---------|-------------|
| [`SIYASAT_10_Sprint_Product_Backlog.docx`](./SIYASAT_10_Sprint_Product_Backlog.docx) | 10-sprint Agile product backlog with user stories, acceptance criteria, and story point estimates |
| [`SIYASAT_System_Summary_Defense.docx`](./SIYASAT_System_Summary_Defense.docx) | Formal system architecture & defense panel briefing — includes the Szymkiewicz-Simpson mathematical defense, RBAC matrix, API reference, database schema, and formulated Q&A for panel inquiries |

---

## 🔬 Mathematical Defense Summary

For the panel, the clustering engine's formal properties are:

```
Algorithm:    Szymkiewicz-Simpson Overlap Coefficient
              overlap(A,B) = |A ∩ B| / min(|A|, |B|)   [unweighted form]
              
Weighted:     W_overlap = Σ w(t) for t ∈ (A∩B) / min(Σw(A), Σw(B))

Threshold:    score ≥ 0.50 → cluster assignment
              score < 0.50 → new anchor folder

Complexity:   O(n²) over repository size — acceptable for institutional scale (<5,000 papers)
Space:        O(|V|) per paper where V = vocabulary of stemmed tokens

vs. Cosine:   Simpson handles subset containment; cosine penalizes asymmetric set sizes
vs. Jaccard:  Simpson divides by min(|A|,|B|); Jaccard divides by |A∪B| — harsher for small papers
vs. Vectors:  No embedding model, no API quota, no GPU — runs entirely in-process on server startup
```

---

## 🤝 Contributing

1. Fork the repository and clone it locally
2. Checkout the latest working branch: `git checkout prototype-4`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes and test locally
5. Commit with a descriptive message following the `feat/fix/docs/chore` convention
6. Push and open a Pull Request against `prototype-4`

---

## 📜 License

This project was developed as an academic group project for the **Department of Agricultural and Biosystems Engineering, Central Luzon State University (CLSU-DABE)**. All rights reserved for institutional use.

---

<div align="center">

**SIYASAT** — *Sistema ng Impormasyon para sa Yaman at Agham ng Agrikultura at Teknolohiya*  
Central Luzon State University · College of Engineering · Department of Agricultural and Biosystems Engineering  
📍 Science City of Muñoz, Nueva Ecija, Philippines

</div>
