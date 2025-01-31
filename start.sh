#!/bin/bash

# Kill any existing processes on the required ports
./utils/kill_ports.sh

# Start backend server in the background
echo "Starting backend server..."
cd backend
go run main.go &

# Wait a moment for backend to initialize
sleep 2

# Start frontend with environment variables for hot reloading
echo "Starting frontend..."
cd ../frontend
WATCHPACK_POLLING=true FAST_REFRESH=true npm start

# This will keep the script running
wait
