#!/bin/bash

# Kill any existing processes on the required ports
./utils/kill_ports.sh

# Start emulators

echo "Starting emulators..."
cd frontend
# run in the background
firebase emulators:start --project=selo-b7d60 &
# Start frontend with environment variables for hot reloading
echo "Starting frontend..."
WATCHPACK_POLLING=true FAST_REFRESH=true npm start

# This will keep the script running
wait
