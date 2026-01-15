<p align="center">
  <img src="docs/banner.png" alt="PinQuest Banner" width="100%">
</p>

# 📍 PinQuest

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Now-emerald?style=for-the-badge&logo=render&logoColor=white)](https://pinquest-app.onrender.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-darkgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

**PinQuest** is a premium social mapping platform designed for modern explorers. Discover hidden gems, share your favorite landmarks, and connect with a global community through an interactive, real-time map interface.

---

## ✨ Key Features

-   **🌐 Interactive Exploration**: A high-performance map built with **React-Leaflet**, featuring clustering, custom markers, and smooth animations.
-   **🔥 Real-time Interaction**: Instant notifications and live updates powered by **Socket.io**.
-   **📸 Rich Content Sharing**: Multi-image posts with Cloudinary/Firebase integration, featuring beautiful glassmorphic UI components.
-   **🇪🇹 Ethiopian Landmarks**: Curated high-fidelity content focusing on **Addis Ababa**, featuring authentic coordinates and cultural landmarks.
-   **🔐 Secure Authentication**: Robust auth system with **JWT**, **OTP-based password reset**, and secure email verification.
-   **🛡️ Admin Power**: Comprehensive dashboard for user management, content moderation, and platform analytics.
-   **🧭 Smart Navigation**: Integrated routing and direction services (Leaflet Routing Machine).

---

## 🚀 Tech Stack

### Frontend
-   **Framework**: React 19 (Vite)
-   **Styling**: Tailwind CSS 4.0 & Vanilla CSS
-   **Animation**: Framer Motion
-   **State Management**: React Context API
-   **Map Engine**: Leaflet (with React-Leaflet)
-   **Icons**: Lucide React

### Backend
-   **Runtime**: Node.js (Express 5.0)
-   **Database**: MongoDB (Mongoose)
-   **Real-time**: Socket.io
-   **Auth**: Passport.js (Local & Google OAuth), JWT, Bcrypt
-   **Security**: Helmet, XSS-Clean, Express Rate Limit
-   **Storage**: Cloudinary & Firebase

---

## 🛠️ Getting Started

### Prerequisites
-   Node.js (v18+)
-   MongoDB Atlas account
-   Cloudinary account (for image uploads)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/PinQuest.git
    cd PinQuest
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` folder:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_uri
    JWT_SECRET=your_secret
    CLOUDINARY_CLOUD_NAME=your_name
    CLOUDINARY_API_KEY=your_key
    CLOUDINARY_API_SECRET=your_secret
    SMTP_HOST=your_smtp_host
    SMTP_PORT=587
    SMTP_USER=your_email
    SMTP_PASS=your_password
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```
    Create a `.env` file in the `frontend` folder:
    ```env
    VITE_API_BASE_URL=http://localhost:5000/api/v1
    ```

4.  **Run Dev Servers**
    -   **Backend**: `npm run dev` (from /backend)
    -   **Frontend**: `npm run dev` (from /frontend)

---

## 📊 Project Structure

```text
PinQuest/
├── backend/             # Node.js + Express server
│   ├── controllers/     # Route logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   └── socket/          # Socket.io handlers
└── frontend/            # React + Vite application
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── contexts/    # Auth & Modal states
    │   ├── pages/       # Route pages
    │   └── services/    # API & Socket services
```

---

## 🔗 Links

-   **Demo**: [https://pinquest-app.onrender.com/](https://pinquest-app.onrender.com/)
-   **Documentation**: [API Docs (v1)](https://pinquest-app.onrender.com/api/v1/docs)

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Made with ❤️ for Explorers everywhere.</p>
