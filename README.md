# Siyasat

## Project Overview
Siyasat is a centralized thesis repository and AI analysis platform tailored for the Central Luzon State University (CLSU) - Bachelor of Science in Agricultural and Biosystems Engineering (BSABE) department. The platform streamlines the management of academic research by offering automated AI thematic clustering using Groq, robust PDF management and storage via Cloudinary, and secure database hosting through Supabase.

## Tech Stack
- **Frontend:** React, Vite, Vercel
- **Backend:** Node.js, Express, Render
- **Database:** Supabase (PostgreSQL)
- **External APIs:** Cloudinary (PDF Management), Groq (AI Clustering and Analysis)

## Features
- **Automated Department Categorization:** Intelligently categorizes uploaded theses into relevant sub-disciplines.
- **Secure Institutional Upload Portal:** A dedicated, secure gateway for students and faculty to submit research documents.
- **AI-Driven Research Gap Analysis:** Utilizes Groq's AI capabilities to analyze existing literature and identify potential research gaps.
- **PDF Management:** Seamless uploading, storage, and retrieval of thesis documents.

## Prerequisites
Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Git](https://git-scm.com/)

## Environment Variables
To run this project locally, you will need to set up environment variables for both the frontend and backend.

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend` directory with the following structure:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Backend (`backend/.env`)
Create a `.env` file in the `backend` directory with the following structure:
```env
PORT=5000
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
GROQ_API_KEY=your_groq_api_key_here
```

> **CRITICAL NOTE:** The database tables (e.g., `theses`) and Row Level Security (RLS) policies are not automatically generated. You must manually configure your tables and RLS policies in the Supabase dashboard for the application to function correctly.

## Local Installation

Follow these steps to set up the project locally.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/siyasatdabe/Siyasat.git
   cd Siyasat
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the Development Servers:**
   - **Start the Backend:** (In a terminal window from the `backend` directory)
     ```bash
     npm start # or npm run dev
     ```
   - **Start the Frontend:** (In a separate terminal window from the `frontend` directory)
     ```bash
     npm run dev
     ```

## Deployment
- **Frontend (Vercel):** The React frontend is configured for deployment on Vercel. Ensure your build command is set to `npm run build` and the output directory is `dist`. Add your frontend environment variables in the Vercel project settings.
- **Backend (Render):** The Node.js Express backend is deployed on Render as a Web Service. Specify the root directory as `backend`, set the build command to `npm install`, and the start command to `node server.js` (or your specific start script). Configure your environment variables in the Render dashboard.
