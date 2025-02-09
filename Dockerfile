# Use the official Golang image to create a build artifact.
# This is based on Debian and sets the GOPATH to /go.
FROM golang:latest AS builder

ARG TARGETOS
ARG TARGETARCH

# Set up root app directory first
WORKDIR /app

# Copy .env file first (from project root)
COPY .env .env

# Copy backend files
COPY backend/ ./

# Copy the database file (assuming it's at project root/db)
COPY db/poll.db ./poll.db

# Install dependencies and tidy up the go.mod and go.sum files.
RUN go mod tidy

# Build the binary with CGO enabled
RUN CGO_ENABLED=1 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -mod=readonly -v -o server

# Use debian bookworm (newer version) for runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory in the final stage
WORKDIR /app

# Copy the binary to the production image from the builder stage.
COPY --from=builder /app/server ./server
RUN chmod +x ./server

# Copy the .env file to the production image
COPY --from=builder /app/.env ./.env

# Copy the database file
COPY --from=builder /app/poll.db ./poll.db

# Expose the port
EXPOSE 8080

# Run the web service on container startup.
CMD ["./server"]