# College Management System with QR Code Authentication

A comprehensive college management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring QR code authentication for students, teachers, and administrators.

## Features

- User registration and authentication
- QR code generation for secure login
- Role-based access control (Student, Teacher, Admin)
- Responsive dashboard for different user roles
- Profile management
- QR code regeneration

## Tech Stack

- **Frontend**: React.js, React Router, Axios, React QR Reader
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, QR Code
- **Styling**: CSS

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd college-management-system
```

### Backend Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the server directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/college-management
JWT_SECRET=your_jwt_secret_key_here
```

4. Start the server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Register a new account with one of the available roles (Student, Teacher, Admin)
3. After registration, you'll be redirected to the dashboard
4. You can view and regenerate your QR code from the QR Code page
5. Use the QR code to log in by scanning it with the QR Login feature

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/login/qr` - Login with QR code
- `GET /api/auth/me` - Get current user
- `GET /api/auth/qrcode` - Get user's QR code
- `POST /api/auth/qrcode/regenerate` - Regenerate QR code

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `GET /api/users/role/:role` - Get users by role (Admin and Teacher)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

## License

This project is licensed under the MIT License.
#   m a j o r p r o j e c t  
 "# majorproject" 
"# ssec" 
"# gpd" 
"# gpd" 
"# gpd" 
