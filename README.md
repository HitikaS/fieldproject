# Sustainable Lifestyle Companion (Extended Edition)

A full-stack MERN application to help users live sustainably through tracking, awareness, and community collaboration.

## Features
- User authentication (JWT, role-based)
- Carbon footprint and water usage tracking
- Recyclable item exchange marketplace
- Donation board with location mapping
- Awareness hub for eco-education
- Real-time leaderboard with eco-points (Socket.io)

## Tech Stack
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Socket.io
- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router, Socket.io-client
- **DevOps:** Docker, Docker Compose, GitHub Actions, Vercel, Render

## Project Structure
```
sustainable-lifestyle-companion/
├── backend/
├── frontend/
├── docker-compose.yml
├── .github/workflows/deploy.yml
└── README.md
```

## Getting Started

### 1. Clone the repository
```
git clone <repo-url>
cd sustainable-lifestyle-companion
```

### 2. Environment Setup
- Copy `backend/.env.example` to `backend/.env` and fill in your values.

### 3. Install dependencies
```
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run locally (development)
- Start MongoDB (local or Docker)
- Start backend: `npm run dev` in `backend`
- Start frontend: `npm run dev` in `frontend`

### 5. Docker Compose
```
docker-compose up --build
```

### 6. CI/CD
- GitHub Actions workflow in `.github/workflows/deploy.yml`
- Frontend auto-deploys to Vercel
- Backend auto-deploys to Render

## Demo Flow
- Register/login
- Add travel/water log
- List item in Recyclable Exchange
- Post donation (food, etc.)
- Read Awareness Hub posts
- See eco-points and live leaderboard

## License
MIT