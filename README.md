# BR Transport

BR Transport is a full-stack enterprise application consisting of a React SPA frontend and a Spring Boot backend, utilizing Firebase Firestore as its database.

## Architecture

This is a mono-repo structure clearly separated into two domains:

- `frontend/`: A modern React Single Page Application built with Vite, Tailwind CSS, TanStack Router, and Shadcn UI components.
- `backend/`: A robust Java 21 Spring Boot REST API providing endpoints for the frontend, secured via JWT and backed by Firebase Admin SDK (Firestore).

## Prerequisites

- **Node.js**: v18+ (for frontend)
- **Java**: 21 (for backend)
- **Maven**: 3.8+ (or use the included wrapper in `backend/`)
- **Firebase**: A Firebase Service Account JSON key is required to connect to Firestore.

## Getting Started

### 1. Backend Setup

Navigate to the `backend/` directory:
```bash
cd backend
```

**Environment Variables**:
Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the absolute path of your Firebase service account JSON file.

On Windows (PowerShell):
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\firebase-service-account.json"
```
On macOS/Linux:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/firebase-service-account.json"
```

**Run the Backend**:
```bash
mvn spring-boot:run
```
The backend will start on `http://localhost:8080`.

### 2. Frontend Setup

Navigate to the `frontend/` directory:
```bash
cd frontend
```

**Install Dependencies**:
```bash
npm install
```

**Run the Frontend**:
```bash
npm run dev
```
The frontend will start on `http://localhost:3000` (or `5173` depending on port availability).

## API Contract

The API contract is located at `API_CONTRACT.md` in the root of the project. The frontend expects the backend to adhere to this contract.

- **Authentication**: JWT Bearer token required for all protected endpoints.
- **Base URL**: Defaults to `http://localhost:8080` for local development.

## Technologies Used

- **Frontend**: React 19, Vite, Tailwind CSS 4, TanStack Router, TanStack Query, Radix UI.
- **Backend**: Java 21, Spring Boot 3.4+, Spring Security, Firebase Admin SDK (Firestore), Lombok.
