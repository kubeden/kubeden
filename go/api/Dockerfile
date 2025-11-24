# Start from the official golang image
FROM golang:1.18-alpine AS builder

WORKDIR /app

# Copy module files
COPY go.mod ./
COPY go.sum ./

# Download dependencies
RUN go mod download

# Copy source plus local content
COPY . .
COPY articles ./articles
COPY images ./images

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy the pre-built binary and local assets
COPY --from=builder /app/main .
COPY --from=builder /app/articles ./articles
COPY --from=builder /app/images ./images

CMD ["./main"]
