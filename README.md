# Issue Tracker Application

A full-stack web application for managing issues with CRUD operations, user authentication, and advanced filtering capabilities.

**Tech Stack:**
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + Zustand
- Backend: Express.js + TypeScript + MongoDB + Mongoose
- Authentication: JWT + bcrypt

## Features

### Core Features
- ✅ User registration and login with secure password hashing
- ✅ Create, read, update, and delete issues
- ✅ View issues with status, priority, and severity indicators
- ✅ Display issue counts by status (Open, In Progress, Resolved)
- ✅ Search and filter issues by title, priority, severity, and status
- ✅ Pagination support
- ✅ Update issue status directly from the list
- ✅ Responsive design with Tailwind CSS

### Advanced Features
- ✅ JWT-based authentication
- ✅ Protected routes
- ✅ Real-time status counts
- ✅ Error handling and validation
- ✅ TypeScript for type safety
- ✅ Zustand for state management
- ✅ Confirmation dialogs for destructive actions

## Project Structure

```
issue-tracker/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Login, Register, Dashboard
│   │   ├── components/   # IssueForm, IssueList
│   │   ├── store/        # Zustand stores
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── backend/               # Express backend
│   ├── src/
│   │   ├── models/       # User, Issue schemas
│   │   ├── routes/       # Auth, Issues routes
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   └── server.ts
│   └── package.json
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your MongoDB URI and JWT_SECRET
npm install
```

Update `.env` with your values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/issue-tracker
JWT_SECRET=your-super-secret-key-here
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# .env should have:
# VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Start MongoDB
```bash
# If using local MongoDB
mongod
```

### Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Start Frontend Development Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Issues
- `POST /api/issues` - Create issue (protected)
- `GET /api/issues` - Get all issues with filters (protected)
- `GET /api/issues/:id` - Get issue detail (protected)
- `PUT /api/issues/:id` - Update issue (protected)
- `DELETE /api/issues/:id` - Delete issue (protected)
- `PATCH /api/issues/:id/status` - Update issue status (protected)

### Query Parameters for GET /api/issues
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in title and description
- `status` - Filter by status (Open, In Progress, Resolved)
- `priority` - Filter by priority (Low, Medium, High)
- `severity` - Filter by severity (Low, Medium, High, Critical)

## Usage Guide

### 1. Register Account
- Navigate to `/register`
- Fill in name, email, and password (min 6 characters)
- Click "Create account"

### 2. Login
- Navigate to `/login`
- Enter your email and password
- Click "Sign in"

### 3. Create Issue
- Click "New Issue" button
- Fill in title, description
- Select priority, severity, and status
- Click "Create Issue"

### 4. Manage Issues
- **View:** Issues are listed in a table format
- **Edit:** Click "Edit" button to modify an issue
- **Delete:** Click "Delete" button (with confirmation)
- **Change Status:** Use the status dropdown directly in the table

### 5. Search & Filter
- Use the search box to find issues by title or description
- Use dropdowns to filter by status, priority, or severity
- Navigate pages using pagination controls

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# dist/ folder contains production-ready files
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://your-connection-string
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```
VITE_API_URL=http://your-api-url/api
```

## Database Schema

### User Collection
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password": "hashed_password",
  "name": "User Name",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Issue Collection
```json
{
  "_id": ObjectId,
  "title": "Issue Title",
  "description": "Issue Description",
  "status": "Open | In Progress | Resolved",
  "priority": "Low | Medium | High",
  "severity": "Low | Medium | High | Critical",
  "createdBy": ObjectId (ref: User),
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Error Handling

The application includes comprehensive error handling:
- Validation errors with detailed messages
- Authentication errors with proper HTTP status codes
- Database operation errors with user-friendly messages
- Network error handling on the frontend

## Testing

### Recommended Test Cases
1. **Registration**: Valid data, duplicate email, weak password
2. **Login**: Valid credentials, invalid credentials, missing fields
3. **Create Issue**: Valid data, missing fields, long descriptions
4. **Update Issue**: Valid updates, status changes
5. **Delete Issue**: Successful deletion, confirmation dialog
6. **Search/Filter**: Single filters, multiple filters combined
7. **Pagination**: Navigate between pages
8. **Authentication**: Token expiration, invalid tokens

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

### CORS Error
- Ensure backend has CORS enabled
- Check that API URL in frontend matches backend

### Port Already in Use
- Change PORT in backend `.env`
- Change Vite port: `npm run dev -- --port 3000`

## Deployment

### Vercel (Frontend)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variable `VITE_API_URL`
4. Deploy

### Render/Heroku (Backend)
1. Push code to GitHub
2. Create new service on Render/Heroku
3. Set environment variables
4. Deploy

## License

MIT

## Author

Created for interview assignment - Issue Tracker with CRUD Operations
