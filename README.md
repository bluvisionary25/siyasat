# SIYASAT

A full-stack thesis and research repository for the **Department of Agricultural and Biosystems Engineering**. SIYASAT lets students browse published theses, while advisers and administrators upload PDF documents, manage accounts, and run AI-powered research gap analysis.

**Repository:** https://github.com/bluvisionary25/siyasat

## Features

- **Thesis repository** — Search, filter, and browse uploaded research papers
- **PDF upload** — Advisers and admins can upload thesis PDFs (max 25 MB)
- **Duplicate detection** — Warns when a similar title or abstract already exists
- **User roles** — Student, Adviser, and Admin with role-based access
- **Account management** — Admins can activate, block, and change user roles
- **AI research gap analysis** — Powered by Groq (falls back to built-in suggestions if no API key is set)
- **Secure authentication** — JWT login with 5-attempt lockout protection

## Tech Stack

| Layer    | Technologies                          |
| -------- | ------------------------------------- |
| Frontend | React, Tailwind CSS, Lucide React     |
| Backend  | Node.js, Express                      |
| Database | PostgreSQL                            |
| Auth     | JWT, bcrypt                           |
| AI       | Groq API (optional)                   |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [PostgreSQL](https://www.postgresql.org/download/)
- (Optional) [Groq API key](https://console.groq.com/) for live AI gap analysis

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bluvisionary25/siyasat.git
cd siyasat
```

### 2. Set up the database

Create a PostgreSQL database:

```sql
CREATE DATABASE siyasat_db;
```

Then run the schema:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'STUDENT',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  failed_login_attempts INTEGER DEFAULT 0,
  lockout_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE theses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT,
  author TEXT,
  year INTEGER,
  keywords TEXT,
  department TEXT DEFAULT 'Department of Agricultural and Biosystems Engineering',
  file_path TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your local settings:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=siyasat_db
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
```

Start the API server:

```bash
npm run dev
```

The backend runs at **http://localhost:5000**.

### 4. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The app opens at **http://localhost:3000**.

## User Roles

| Role     | Permissions                                              |
| -------- | -------------------------------------------------------- |
| Student  | Browse and search theses, view paper details             |
| Adviser  | Upload theses, run AI gap analysis                       |
| Admin    | All adviser permissions plus user and account management |

Register accounts through the in-app auth modal, or via the API:

```bash
POST http://localhost:5000/api/auth/register
```

## Project Structure

```
siyasat/
├── backend/
│   ├── server.js          # Express API server
│   ├── .env.example       # Environment variable template
│   └── uploads/           # Uploaded PDF files (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main app and routing
│   │   └── components/    # Pages and UI components
│   └── public/
└── README.md
```

## API Endpoints

| Method | Endpoint                        | Description                    |
| ------ | ------------------------------- | ------------------------------ |
| GET    | `/api/health`                   | Server health check            |
| POST   | `/api/auth/register`            | Register a new user            |
| POST   | `/api/auth/login`               | Log in and receive JWT         |
| GET    | `/api/theses`                   | List/search theses             |
| POST   | `/api/theses`                   | Upload a thesis (auth required)|
| DELETE | `/api/theses/:id`               | Delete a thesis (admin only)   |
| GET    | `/api/theses/:id/download`      | Download thesis PDF            |
| POST   | `/api/analyze-gaps`             | AI research gap analysis       |
| GET    | `/api/admin/users`              | List users (admin only)        |

## Contributing

1. Clone the repo and create a branch for your changes
2. Make your changes and test locally
3. Push to your branch and open a pull request

## License

This project was developed as part of an academic group project for the Department of Agricultural and Biosystems Engineering.
