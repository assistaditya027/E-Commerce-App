# Clovo E-Commerce Platform

A comprehensive, full-stack e-commerce solution featuring a customer-facing storefront, administrative dashboard, and RESTful API backend. Built with modern web technologies for scalability, performance, and maintainability.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Project Architecture](#project-architecture)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Security Guidelines](#security-guidelines)
- [Deployment](#deployment)

---

## 🎯 Overview

Clovo is a complete e-commerce platform consisting of three integrated applications:

| Application | Purpose | Port |
|------------|---------|------|
| **Frontend** | Customer-facing web storefront | `5173` |
| **Admin Dashboard** | Business administration & inventory management | `5174` |
| **Backend API** | RESTful API server & business logic | `8000` |

---

## ✨ Key Features

### Frontend (Customer Portal)
- 🛒 Product browsing and search functionality
- 💳 Secure checkout with multiple payment gateways (Stripe, Razorpay)
- 👤 User authentication (OAuth & JWT)
- 📦 Order tracking and history
- 🎨 Dark mode support
- 📱 Fully responsive design
- 🔐 Social login integration (Google, GitHub)
- 📧 Newsletter subscription
- ⭐ Wishlist management

### Admin Dashboard
- 📊 Order management & fulfillment
- 📦 Product management & inventory control
- 👥 User management
- 📈 Business analytics
- 🖼️ Image management with Cloudinary integration
- 🎯 Status tracking and order lifecycle management

### Backend API
- 🔐 JWT-based authentication
- 🛡️ Role-based access control (Admin/User)
- 💰 Payment gateway integration (Stripe, Razorpay)
- 📧 Email notifications (Nodemailer)
- 🌩️ Cloud storage (Cloudinary)
- ✅ Data validation & error handling
- 📝 Comprehensive logging

---

## 🛠️ Technology Stack

### Frontend & Admin
- **Runtime**: Node.js v18+
- **Framework**: React 19.x with Hooks
- **Build Tool**: Vite 8.x
- **Styling**: Tailwind CSS v4.x
- **HTTP Client**: Axios
- **Routing**: React Router v7.x
- **UI Notifications**: React Toastify
- **PWA Support**: vite-plugin-pwa

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express 5.x
- **Database**: MongoDB 9.x
- **ODM**: Mongoose
- **Authentication**: JWT, Passport.js
- **Payment**: Stripe SDK, Razorpay SDK
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **Email**: Nodemailer
- **Security**: Bcrypt, CORS, Helmet (recommended)
- **Development**: Nodemon, ESLint

---

## 💻 System Requirements

- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **MongoDB**: v5.0 or higher (local or Atlas)
- **Git**: Latest version
- **Operating System**: Windows, macOS, or Linux

---

## 🏗️ Project Architecture

```
Clovo E-Commerce Platform
│
├── Frontend (React + Vite)
│   ├── Customer Storefront
│   ├── User Authentication
│   └── Order Management
│
├── Admin (React + Vite)
│   ├── Product Management
│   ├── Order Fulfillment
│   └── Analytics Dashboard
│
└── Backend (Node + Express)
    ├── Authentication Service
    ├── Product Service
    ├── Order Service
    ├── Payment Processing
    └── User Management
```

---

## 📥 Installation Guide

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd E-Commerce\ App
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Create .env file (see Configuration section)
cp .env.example .env  # if available, or create manually
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../Frontend

# Install dependencies
npm install

# Create .env file (see Configuration section)
```

### 4. Admin Dashboard Setup

```bash
# Navigate to admin directory
cd ../admin

# Install dependencies
npm install

# Create .env file (see Configuration section)
```

---

## ⚙️ Configuration

### Backend Configuration (`Backend/.env`)

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_key_here

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/user/oauth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/user/oauth/github/callback

# Payment Gateways
STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration (Gmail recommended)
NODEMAILER_USER=your_email@gmail.com
NODEMAILER_PASSWORD=your_app_specific_password

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174

# Application
PORT=8000
DELIVERY_CHARGE=10
```

### Frontend Configuration (`Frontend/.env`)

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_DELIVERY_FEE=10
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Admin Configuration (`admin/.env`)

```env
VITE_BACKEND_URL=http://localhost:8000
```

---

## 🚀 Running the Application

### Development Mode

#### Terminal 1 - Backend API Server
```bash
cd Backend
npm run server
# Server runs at http://localhost:8000
```

#### Terminal 2 - Frontend Application
```bash
cd Frontend
npm run dev
# Frontend runs at http://localhost:5173
```

#### Terminal 3 - Admin Dashboard
```bash
cd admin
npm run dev
# Admin runs at http://localhost:5174
```

### Production Build

```bash
# Frontend
cd Frontend
npm run build
npm run preview

# Admin
cd admin
npm run build
npm run preview

# Backend
cd Backend
npm start
```

---

## 📁 Project Structure

```
Backend/
├── config/           # Configuration (MongoDB, Cloudinary, Passport)
├── controllers/      # Business logic handlers
├── middleware/       # Authentication, authorization, file upload
├── models/          # Mongoose schemas (User, Product, Order, Newsletter)
├── routes/          # API endpoints
├── services/        # Utility services (pricing, order lifecycle)
├── utils/           # Helper functions (JWT, logging)
├── validation/      # Input validation schemas
├── scripts/         # Database migrations & utilities
└── tests/           # Unit tests

Frontend/
├── src/
│   ├── components/   # Reusable React components
│   ├── pages/        # Page components (Home, Cart, Login, etc.)
│   ├── context/      # React Context (ShopContext, ThemeContext)
│   ├── assets/       # Images, icons, static files
│   └── index.css     # Global styles
├── public/           # Static files
└── package.json      # Dependencies

admin/
├── src/
│   ├── components/   # Admin UI components
│   ├── pages/        # Admin pages (Products, Orders, etc.)
│   ├── assets/       # Admin assets
│   └── index.css     # Styles
├── public/           # Static files
└── package.json      # Dependencies
```

---

## 🔐 Security Guidelines

### Environment Variables
- ⚠️ **Never commit `.env` files to version control**
- Store sensitive credentials in environment variables
- Use `.env.example` for documentation without secrets
- Use different credentials for development, staging, and production

### Authentication
- JWT tokens are securely hashed and validated
- OAuth tokens are exchanged server-side
- Passwords are bcrypt-hashed with salt rounds
- CORS is configured to allow only trusted origins

### Best Practices
- Validate all user inputs on frontend and backend
- Use HTTPS in production
- Implement rate limiting on API endpoints
- Keep dependencies updated regularly
- Use Content Security Policy (CSP) headers
- Enable HSTS (HTTP Strict Transport Security)
- Use secure session cookies (httpOnly, secure, sameSite)

---

## 🌐 OAuth Setup Guide

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/user/oauth/google/callback` (local)
   - `https://your-domain.com/api/user/oauth/google/callback` (production)
6. Copy Client ID and Secret to `Backend/.env`

### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:8000/api/user/oauth/github/callback` (local)
   - `https://your-domain.com/api/user/oauth/github/callback` (production)
4. Copy Client ID and Secret to `Backend/.env`

---

## 📦 Payment Gateway Setup

### Stripe
1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy your Secret Key to `STRIPE_SECRET_KEY`
3. Configure webhook endpoints in Stripe dashboard
4. Webhook URL: `https://your-domain.com/api/order/webhook/stripe`

### Razorpay
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Copy Key ID and Key Secret to `Backend/.env`
3. Configure webhook endpoints
4. Webhook URL: `https://your-domain.com/api/order/webhook/razorpay`

---

## 🚢 Deployment

### Backend Deployment (Recommended Platforms)
- **Heroku**: Add `Procfile` and deploy via Git
- **Railway.app**: Connect GitHub repo for auto-deployment
- **Render**: Node.js deployment with free tier
- **AWS EC2/EB**: Enterprise-grade hosting
- **DigitalOcean**: Affordable VPS option

### Frontend/Admin Deployment (CDN Recommended)
- **Vercel**: Optimal for Vite apps, auto-deployment
- **Netlify**: Excellent CI/CD integration
- **AWS S3 + CloudFront**: Cost-effective for scale
- **GitHub Pages**: Free static hosting

### Database Deployment
- **MongoDB Atlas**: Cloud-hosted MongoDB (recommended)
- **AWS RDS**: Managed MongoDB service
- **DigitalOcean**: Managed databases

---

## 📝 Available Scripts

### Backend
```bash
npm start              # Run production server
npm run server         # Run with nodemon (development)
npm run lint           # Lint code
npm run lint:fix       # Fix linting issues
npm run format         # Format code with Prettier
npm run test           # Run tests
npm run migrate:order-dates  # Run database migrations
```

### Frontend & Admin
```bash
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Lint code
npm run lint:fix       # Fix linting issues
npm run format         # Format code with Prettier
```

---

## 📧 Support & Documentation

For detailed component documentation, API endpoints, and troubleshooting:
- Check individual `README.md` files in `Backend/`, `Frontend/`, and `admin/` directories
- Review code comments in critical sections
- Check configuration files for additional settings

---

## 📄 License

Repository License: [Specify Your License - MIT, Apache 2.0, etc.]

---

## 👥 Contributors

- Project Lead: [Your Name]
- Development Team: [Team Members]

---

**Last Updated**: March 2026  
**Node.js Version**: 18.0+  
**npm Version**: 9.0+
