# HOMA - Japanese Skincare E-Commerce Platform

A production-ready MERN stack for the HOMA Japanese Skincare project targeting the Nepal market.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend  | React 18, Vite, React Router, Tailwind CSS, React Query |
| Backend   | Node.js, Express, MongoDB with Mongoose |
| Auth      | JWT (access + refresh tokens) |
| File Storage | MongoDB GridFS image storage |
| Email     | Nodemailer |

## Prerequisites

- Node.js v20 or higher
- MongoDB Atlas account (free tier available)
- Local MongoDB instance for development image storage

## Quick Start

### 1. Clone and Setup

```bash
# Install server dependencies
cd server
npm install
copy .env.example .env
# Fill in .env with your credentials

# Install client dependencies
cd ../client
npm install
copy .env.example .env
# VITE_API_URL should point to your server
```

### 2. Configure Environment Variables

**Server** (.env):
```
MONGO_URI=mongodb://127.0.0.1:27017/homa
ALLOW_LOCAL_MONGO=true
JWT_SECRET=your_long_random_string
JWT_REFRESH_SECRET=your_another_random_string
CLIENT_URL=http://localhost:5173
PUBLIC_IMAGE_BASE_URL=http://localhost:5000/api/v1/uploads
IMAGE_UPLOAD_MAX_MB=10
```

To generate random JWT secrets for development:

```bash
cd server
npm run secrets
```

**Client** (.env):
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_IMAGE_UPLOAD_MAX_MB=10
```

### 3. Run Locally

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

Visit `http://localhost:5173` — The Home page will display "API Connected ✅" when frontend-backend connection works.

## Project Structure

```
homa/
├── client/                 ← React + Vite frontend
│   ├── src/
│   │   ├── components/     ← UI and layout components
│   │   ├── context/        ← Auth and Cart contexts
│   │   ├── pages/          ← Route pages
│   │   ├── services/       ← API client (axios)
│   │   └── utils/          ← Helper functions
│   └── package.json
├── server/                 ← Express.js backend
│   ├── src/
│   │   ├── config/         ← Database, Cloudinary, Email
│   │   ├── models/         ← Mongoose schemas
│   │   ├── controllers/    ← Route handlers
│   │   ├── routes/         ← API routes
│   │   ├── middleware/     ← Auth, validation, error handling
│   │   └── utils/          ← Tax calculation, PDF generation
│   ├── server.js
│   └── package.json
└── README.md
```

## Available Scripts

### Server

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with nodemon (development) |
| `npm start` | Start server (production) |

### Client

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## API Routes

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token

### Products (Stub Routes)
- `GET /products` - Get all products
- `GET /products/:id` - Get single product
- `POST /products` - Create product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

### Orders (Stub Routes)
- `POST /orders` - Create order
- `GET /orders/my` - Get user's orders
- `GET /orders/:id` - Get single order
- `PUT /orders/:id/status` - Update order status (admin only)

### Health Check
- `GET /health` - API status check

## Key Features Implemented

✅ Full authentication system (register, login, refresh tokens)
✅ JWT with access + refresh token pattern
✅ Protected routes (admin-only middleware)
✅ Rate limiting on auth endpoints
✅ CORS configured
✅ MongoDB schemas for all entities
✅ Request validation (Joi)
✅ Global error handling
✅ React Context for Auth and Cart
✅ API interceptors for token management
✅ Responsive Navbar with mobile menu
✅ Form validation with React Hook Form + Zod
✅ Toast notifications (react-hot-toast)

## Deployment

### Server (Vercel, Railway, Heroku)
1. Push to GitHub
2. Connect repository to deployment platform
3. Set environment variables
4. Deploy

### Client (Vercel, Netlify)
1. Build: `npm run build`
2. Deploy dist/ folder
3. Set environment variables

## Notes

- The database connection requires a MongoDB URI (MongoDB Atlas recommended)
- Image uploads are stored in MongoDB GridFS; product/order records store image URLs and IDs
- Email functionality requires SMTP credentials
- Payment integration (eSewa, FonePay) is configured but not fully implemented
- All stub routes should be replaced with actual implementations
