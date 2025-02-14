# Use the official Golang image to create a build artifact.
FROM golang:latest AS builder

ARG TARGETOS
ARG TARGETARCH

# Set up root app directory
WORKDIR /app

# Copy .env file first (from project root)
COPY .env .env

# Copy backend files
COPY backend/ ./

# Copy Firebase service account JSON
COPY selo-b7d60-firebase-adminsdk-fbsvc-ddd5d5cb4c.json ./

# Install dependencies and tidy up the go.mod and go.sum files
RUN go mod tidy

# Build the binary
RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -mod=readonly -v -o server

# Use debian slim for runtime
FROM debian:bookworm-slim

# Install CA certificates for HTTPS connections
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory in the final stage
WORKDIR /app

# Copy the binary to the production image from the builder stage
COPY --from=builder /app/server ./server
RUN chmod +x ./server

# Copy the .env file to the production image
COPY --from=builder /app/.env ./.env

# Copy the Firebase service account JSON
COPY --from=builder /app/selo-b7d60-firebase-adminsdk-fbsvc-ddd5d5cb4c.json ./

# Expose the port
EXPOSE 8080

# Run the web service on container startup
CMD ["./server"]