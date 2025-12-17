# 🎯 Habit Tracker Web Application

A full-stack web application for tracking personal habits, monitoring progress, and staying accountable through social features. Built with React, Node.js, Express, and PostgreSQL.

## 🚀 Features

### Core Features

- **User Authentication**: Secure signup, login, and logout with JWT-based authentication
- **Habit Management**: Create, edit, and delete habits with daily or weekly frequencies
- **Progress Tracking**: Mark habits as complete and track your streaks
- **Statistics**: View completion rates, current streaks, and total completions for each habit
- **Social Accountability**: Search for and follow friends to see their habit progress
- **Activity Feed**: View recent completions and streaks from followed users
- **Categories & Filtering**: Organize habits by categories (Health, Fitness, Productivity, etc.)

### Edge Cases Handled

- ✅ Prevents duplicate habit names per user
- ✅ Prevents checking in more than once per day/week
- ✅ Users cannot follow themselves
- ✅ Form validation on all inputs
- ✅ Proper error handling and user feedback

## 🛠️ Tech Stack

### Frontend

- **React 18** with Vite for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **date-fns** for date formatting
- **lucide-react** for icons

### Backend

- **Node.js** with Express
- **PostgreSQL** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### DevOps

- **Docker** & **Docker Compose** for containerization
- **Nginx** for serving the frontend in production

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Docker & Docker Compose (optional, for containerized deployment)
- npm or yarn

## 🔧 Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/anuragparashar26/habit-flow.git
cd habit-flow
```

### 2. Set Up the Database

#### Option A: Using Docker (Recommended)
- The database (`habit_tracker`) is created automatically by Docker using the `POSTGRES_DB` variable in `docker-compose.yml`.
- **No manual database creation is needed.**
- The schema is loaded automatically from `server/database/schema.sql`.

#### Option B: Manual Setup

Install PostgreSQL and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE habit_tracker;

# Exit psql
\q

# Run the schema
psql -U postgres -d habit_tracker -f server/database/schema.sql
```

> **Note:**  
> The `CREATE DATABASE` line in `schema.sql` is commented out to avoid errors with Docker.  
> Manual users must create the database first, as shown above.

### 3. Set Up the Backend

```bash
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/habit_tracker

# Start the server
npm run dev
```

The backend API will be running on `http://localhost:5000`

### 4. Set Up the Frontend

```bash
cd client

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start the development server
npm run dev
```

The frontend will be running on `http://localhost:5173`

### 5. Access the Application

Open your browser and navigate to `http://localhost:5173`

## 🐳 Docker Setup

To run the entire application with Docker:

```bash
# Build and start all services
docker-compose up --build

# Access the application at http://localhost:3000
```

To stop the services:

```bash
docker-compose down
```

To stop and remove volumes (clears database):

```bash
docker-compose down -v
```

## 📁 Project Structure

```
habit-tracker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components (Layout)
│   │   ├── context/       # Auth context for state management
│   │   ├── pages/         # Page components (Login, Dashboard, etc.)
│   │   ├── services/      # API service layer
│   │   ├── App.jsx        # Main app component with routing
│   │   └── main.jsx       # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── server/                # Backend Node.js/Express application
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── database/         # Database schema
│   ├── middleware/       # Authentication middleware
│   ├── routes/           # API routes
│   ├── index.js          # Server entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml    # Docker compose configuration
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Habits

- `GET /api/habits` - Get all habits for current user
- `GET /api/habits/:id` - Get a single habit
- `POST /api/habits` - Create a new habit
- `PUT /api/habits/:id` - Update a habit
- `DELETE /api/habits/:id` - Delete a habit
- `POST /api/habits/:id/complete` - Mark habit as complete
- `GET /api/habits/:id/stats` - Get habit statistics

### Social

- `GET /api/social/users/search?q=query` - Search for users
- `POST /api/social/follow/:userId` - Follow a user
- `DELETE /api/social/follow/:userId` - Unfollow a user
- `GET /api/social/following` - Get list of following
- `GET /api/social/followers` - Get list of followers
- `GET /api/social/feed` - Get activity feed

### Users

- `GET /api/users/:id` - Get user profile

### Environment Variables

#### Backend (.env)

```
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/habit_tracker
JWT_SECRET=your-secure-secret-key
JWT_EXPIRE=7d
CLIENT_URL=https://your-frontend-url.vercel.app
```

#### Frontend (.env)

```
VITE_API_URL=https://your-backend-url.com/api
```

## 🧪 Testing the Application

1. **Register a new account** at `/register`
2. **Login** with your credentials
3. **Create habits** on the Dashboard
4. **Mark habits as complete** by clicking the button
5. **Search for users** in the Friends tab
6. **Follow friends** to see their activity
7. **View the activity feed** to see friends' progress

## 📝 Database Schema

### Users Table

- id, username, email, password_hash, full_name, created_at, updated_at

### Habits Table

- id, user_id, name, description, frequency, category, created_at, updated_at
- Unique constraint: (user_id, name)

### Habit Completions Table

- id, habit_id, user_id, completed_at, date
- Unique constraint: (habit_id, date)

### Follows Table

- id, follower_id, following_id, created_at
- Unique constraint: (follower_id, following_id)
- Check constraint: follower_id != following_id

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🔗 Live Demo

**Live URL**: [To be deployed]

**Demo Credentials**:

- Email: demo@example.com
- Password: demo123

---

Built with ❤️ using React, Node.js, and PostgreSQL
