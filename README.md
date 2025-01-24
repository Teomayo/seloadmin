# SELOADMIN

A polling application built with a Go backend (using GORM) and React frontend. The application allows users to create and vote on polls, with authentication and dark/light theme support.

## Project Structure

- `backend/`: Go backend code
- `frontend/`: React frontend code
- `db/`: SQLite database
- `docker-compose.yaml`: Docker compose file for running the application as containers
 


## Development Setup

### Prerequisites
- Go 1.21+
- Node.js 18+
- Python 3.x
- SQLite3

### Initial Setup
1. Clone the repository
2. Set up the database and users:
   ```bash
   # Copy the users template and edit with your credentials
   cp backend/scripts/users_template.yaml backend/scripts/users.yaml
   # Edit users.yaml with your desired user credentials
   
   # Run the database setup scripts
   cd backend/scripts
   python add_users.py
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   go mod download
   ```

4. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running in Development Mode
1. Start the backend server:
   ```bash
   cd backend
   # The backend will use the development database path
   go run main.go
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```


Alternatively, you can run the application using the `start.sh` script:
```bash
sh ./start.sh
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## Production Deployment

### Using Docker
1. Configure users:
   ```bash
   cp backend/scripts/users_template.yaml backend/scripts/users.yaml
   # Edit users.yaml with production credentials
   ```

2. Build and run containers:
   ```bash
   docker compose up --build
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Environment Variables
Create a `.env` file in the root directory:
```
# Backend settings
DB_PATH=/app/poll.db
JWT_SECRET=
SERVER_PORT=8080

# Frontend settings
SERVER_HOST=localhost
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8080/api/
BASE_URL=http://localhost:8080/
BIBLE_API_KEY=
ENV_MODE=development

```

## Database Management
- Development database location: `./poll.db`
- Production database location: `/app/poll.db` (inside container)
- Database initialization scripts are in `backend/scripts/`

## Authentication
- Login endpoint: `POST /api-token-auth/`
- Token-based authentication using JWT
- User management through `users.yaml` configuration

## Additional Features
- Dark/Light theme toggle
- Real-time vote updates
- User vote tracking
- Member count display

## Development Notes
- The backend uses environment mode (`ENV_MODE`) to determine database paths
- Frontend API URLs are configured through environment variables
- SQLite database is used for both development and production
- User data is managed through an untracked YAML file for security

## References
- [Go Documentation](https://golang.org/doc/)
- [React Documentation](https://react.dev/)
- [GORM Documentation](https://gorm.io/)
- [Docker Documentation](https://docs.docker.com/)

