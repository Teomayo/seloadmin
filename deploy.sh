#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
PROJECT_ID="temporal-clover-445820-d6"

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to display usage
usage() {
    echo -e "${YELLOW}Usage: $0 [start|stop|restart|status|logs|clean|frontend|backend|cloud]${NC}"
    echo "Commands:"
    echo "  start   - Start the application containers"
    echo "  stop    - Stop the application containers"
    echo "  restart - Restart the application containers"
    echo "  status  - Show status of containers"
    echo "  logs    - Show logs (use -f flag to follow)"
    echo "  clean   - Stop containers and remove volumes"
    echo "  frontend - Build and deploy frontend"
    echo "  cloud   - Build and deploy to Google Cloud Run"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        echo -e "${RED}Error: .env file not found${NC}"
        echo "Please create .env file with required environment variables"
        exit 1
    fi
}

# Function to start containers
start() {
    echo -e "${GREEN}Starting containers...${NC}"
    docker compose up -d --build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Containers started successfully${NC}"
        echo -e "Backend available at:  ${YELLOW}http://localhost:8080${NC}"
    else
        echo -e "${RED}Failed to start containers${NC}"
        exit 1
    fi
}

frontend() {
    echo -e "${GREEN}building and deploying frontend...${NC}"
    cd frontend
    npm run deploy
    cd ..
}

cloud() {
    echo -e "${GREEN}building and deploying to cloud...${NC}"
    # ask user if they set the environment to production
    read -p "Did you set the environment to production? (y/n): " PROD
    if [ "$PROD" == "y" ]; then
        # Configure Docker to use gcloud as a credential helper
        echo -e "${GREEN}Configuring Docker authentication...${NC}"
        gcloud auth configure-docker gcr.io
        
        # Get the latest commit hash
        COMMIT_HASH=$(git rev-parse --short HEAD)
        
        echo -e "${GREEN}Building with docker buildx for linux/amd64...${NC}"
        docker buildx build -t gcr.io/$PROJECT_ID/selo-admin:$COMMIT_HASH --platform linux/amd64 .
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to build image${NC}"
            exit 1
        fi

        echo -e "${GREEN}Pushing to Artifact Registry...${NC}"
        docker push gcr.io/$PROJECT_ID/selo-admin:$COMMIT_HASH
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to push image${NC}"
            exit 1
        fi

        echo -e "${GREEN}Deploying to Cloud Run...${NC}"
        gcloud run deploy selo-admin \
            --image gcr.io/$PROJECT_ID/selo-admin:$COMMIT_HASH \
            --project=$PROJECT_ID \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --timeout=300 \
            --set-env-vars="FIRESTORE_TIMEOUT=60" \
            --memory=1Gi
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Successfully deployed to Cloud Run${NC}"
        else
            echo -e "${RED}Failed to deploy${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Please set the environment to production${NC}"
        exit 1
    fi
}

# Function to stop containers
stop() {
    echo -e "${YELLOW}Stopping containers...${NC}"
    docker compose down
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Containers stopped successfully${NC}"
    else
        echo -e "${RED}Failed to stop containers${NC}"
        exit 1
    fi
}

# Function to show container status
status() {
    echo -e "${YELLOW}Container Status:${NC}"
    docker compose ps
}

# Function to show logs
logs() {
    if [ "$1" == "-f" ]; then
        docker compose logs -f
    else
        docker compose logs
    fi
}

# Function to clean up
clean() {
    echo -e "${YELLOW}Stopping containers and removing volumes...${NC}"
    docker compose down -v
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Cleanup completed successfully${NC}"
    else
        echo -e "${RED}Cleanup failed${NC}"
        exit 1
    fi
}

# Main script logic
check_docker
check_env

case "$1" in
start)
    start
    ;;
stop)
    stop
    ;;
restart)
    stop
    start
    ;;
status)
    status
    ;;
logs)
    logs $2
    ;;
clean)
    clean
    ;;
frontend)
    frontend
    ;;
backend)
    backend
    ;;
cloud)
    cloud
    ;;
*)
    usage
    exit 1
    ;;
esac

exit 0
