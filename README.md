# CampusHub — One Platform for Everything College

A full-stack college management system combining modern web technology with Web3/blockchain features.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Web3 | Ethers.js v6, Solidity 0.8.20, Hardhat |
| Auth | JWT + bcrypt |
| File Upload | Multer |

## Features

### 📢 Smart Notice Board
- Department-wise notices with category filters (exam/event/internship/urgent)
- Pin important notices, seen/unseen tracking
- Admins and faculty can post and manage notices

### 📚 Study Hub
- Upload/download study materials (PDF, DOCX, PPT, ZIP — up to 20MB)
- Semester-wise and subject-wise organization
- Like counter, download counter, sort by popularity

### 🗓️ Timetable Manager
- Personal weekly timetable with visual grid view
- Add/edit/delete class slots with color coding
- Conflict detection for overlapping times

### 🎉 Events & Clubs
- Event listing with RSVP (Going / Interested)
- Club pages with join/leave functionality
- Contribution score increases on club activities

### 💬 Discussion Board
- StackOverflow-style Q&A forum
- Upvote/downvote questions and answers
- Accept answer, tag system, view count tracking

### 🧑‍🎓 Profile & Leaderboard
- Contribution score system (+5 upload, +3 discussion, +2 answer/club)
- Badge system: Top Contributor, Active Member, Event Enthusiast, Helpful Soul, Club Leader
- Contribution leaderboard

### 🔗 Web3 / Blockchain (Bonus)
- Connect MetaMask wallet
- Mint achievement badges as Soulbound NFTs (ERC-721, non-transferable)
- On-chain credential verification via `CampusCredential.sol`

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MetaMask (optional, for Web3 features)

### 1. Clone & Install
```bash
git clone <repo>
cd campushub
npm run install:all
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

### 3. Setup Database
```bash
createdb campushub
cd server && npm run db:setup
```

### 4. Start Development Servers
```bash
# From root directory — starts both server (port 5000) and client (port 5173)
npm run dev
```

### 5. (Optional) Deploy Smart Contracts
```bash
cd contracts && npm install
npx hardhat node          # Start local blockchain
npm run deploy:local      # Deploy contracts
```

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campushub.edu | admin123 |
| Student | alex@campushub.edu | student123 |

## Project Structure

```
campushub/
├── server/                    # Express.js backend
│   ├── db/
│   │   ├── schema.sql         # PostgreSQL schema
│   │   └── setup.js           # Database setup + seed
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/                # API route handlers
│   │   ├── auth.js
│   │   ├── notices.js
│   │   ├── studyHub.js
│   │   ├── timetable.js
│   │   ├── events.js
│   │   ├── clubs.js
│   │   ├── discussions.js
│   │   └── profile.js
│   └── index.js               # Express app entry
│
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── context/
│       │   ├── AuthContext.jsx    # Auth state + API helper
│       │   └── Web3Context.jsx    # MetaMask + ethers.js
│       ├── pages/             # One page per module
│       ├── components/        # Sidebar, Navbar, PrivateRoute
│       └── utils/api.js       # Shared utilities
│
└── contracts/                 # Hardhat + Solidity
    └── contracts/
        ├── CampusBadge.sol        # Soulbound ERC-721 badges
        └── CampusCredential.sol   # On-chain credential registry
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/notices | Get notices (filterable) |
| POST | /api/notices | Post notice (admin/faculty) |
| GET | /api/study-hub | Get study materials |
| POST | /api/study-hub | Upload material |
| GET | /api/timetable | Get user timetable |
| POST | /api/timetable | Add class |
| GET | /api/events | Get events |
| POST | /api/events/:id/rsvp | RSVP to event |
| GET | /api/clubs | Get clubs |
| POST | /api/clubs/:id/join | Join club |
| GET | /api/discussions | Get discussions |
| POST | /api/discussions/:id/vote | Vote on discussion |
| GET | /api/profile | Get my profile + stats |
| GET | /api/profile/leaderboard | Contribution leaderboard |
