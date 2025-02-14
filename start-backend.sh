# Kill any existing process on port 8080
echo "Cleaning up any existing processes..."
lsof -ti:8080 | xargs -r kill -9

# Start backend server in the background
echo "Uploading to Firebase..."
cd backend
python scripts/setup_firestore.py --emulator

echo "Starting backend server..."
go run main.go &

