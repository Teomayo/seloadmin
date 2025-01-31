#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to display usage
usage() {
    echo -e "${YELLOW}Usage: $0 [start|stop|restart|status|logs|clean]${NC}"
    echo "Commands:"
    echo "  start   - Start the application containers"
    echo "  stop    - Stop the application containers"
    echo "  restart - Restart the application containers"
    echo "  status  - Show status of containers"
    echo "  logs    - Show logs (use -f flag to follow)"
    echo "  clean   - Stop containers and remove volumes"
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
        echo -e "Frontend available at: ${YELLOW}http://localhost:3000${NC}"
        echo -e "Backend available at:  ${YELLOW}http://localhost:8080${NC}"
    else
        echo -e "${RED}Failed to start containers${NC}"
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
*)
    usage
    exit 1
    ;;
esac

exit 0
