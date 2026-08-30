# Enterprise Event Management System (EMS)

A production-grade, highly scalable, real-time Event Management System designed for high-concurrency ticket sales, live gate check-ins with offline PWA support, and asynchronous PDF ticket generation.

---

## 🏗 Architecture & Tech Stack

### **Backend (`/backend`)**
* **Runtime**: Node.js, Express.js
* **Database & ODM**: MongoDB with Mongoose (`User`, `Event`, `Ticket` models)
* **Caching & Distributed Locks**: Redis (`ioredis`) for high-concurrency seat locking (`NX` locks with Lua script release)
* **Background Queue Processing**: `BullMQ` for asynchronous PDF ticket rendering and email dispatch
* **Real-Time Communication**: `Socket.io` for instant gate check-in broadcasting and attendee counter synchronization
* **Security & Validation**: JWT authentication, `bcryptjs`, Helmet, Express Rate Limiter, and Zod schema validation
* **Document Generation**: `pdfkit` and `qrcode`

### **Frontend (`/frontend`)**
* **Framework**: React 18 with Vite
* **Styling**: Tailwind CSS & Lucide Icons
* **Real-time**: Socket.io client
* **Offline Support**: PWA Service Worker (`sw.js`) and IndexedDB utility (`indexedDB.js`) for offline scan caching and automatic synchronization upon reconnection

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* Node.js (v18+ recommended)
* Docker & Docker Compose

### 1. Start Infrastructure (MongoDB & Redis)
```bash
docker-compose up -d
```

### 2. Configure Backend Environment
Create a `.env` file inside `/backend` based on `.env.example`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ems_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_jwt_key
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
```

### 3. Run Backend Server
```bash
cd backend
npm install
npm run dev
```

### 4. Run Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Production Deployment

### Backend Build & Start
```bash
cd backend
npm ci --production
npm start
```

### Frontend Build
```bash
cd frontend
npm ci
npm run build
```
The production bundle will be generated in `frontend/dist`.
