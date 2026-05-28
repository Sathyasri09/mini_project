# MP TEXTILES - Setup Instructions

This repository contains the source code for MP TEXTILES, a MERN stack e-commerce website. 

## Prerequisites
Make sure you have the following installed on your computer:
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) (Or a MongoDB Atlas account)
- Git

## Getting Started

Follow these steps to set up the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/Sathyasri09/mini_project.git
cd mini_project/MPTEX
```

### 2. Backend Setup
The backend runs on Node.js and Express.

```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` directory and add the following required keys:
```env
PORT=5000
DB_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Run the backend server:**
```bash
npm run dev
```

### 3. Frontend Setup
The frontend runs on React.js (Vite) and Tailwind CSS.

Open a new terminal window:
```bash
cd frontend
npm install
```

**Environment Variables:**
Create a `.env` file in the `frontend` directory and configure your backend endpoint:
```env
VITE_API_URL=http://localhost:5000
```

**Run the frontend development server:**
```bash
npm run dev
```

### 4. Running the Application
Once both servers are running, the frontend should be accessible at `http://localhost:5173` and the backend API at `http://localhost:5000`.

## Contact
For inquiries or feedback, reach out at **gsathyasri369@gmail.com**.
