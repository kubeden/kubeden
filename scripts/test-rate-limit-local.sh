#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8080"

echo -e "${YELLOW}Testing Rate Limiting on localhost...${NC}\n"

# Function to make request and show rate limit headers
make_request() {
    echo -e "\n${YELLOW}Making request to /articles${NC}"
    
    response=$(curl -s -i "${API_URL}/articles")
    
    # Parse status code
    status_code=$(echo "$response" | grep "HTTP/" | awk '{print $2}')
    
    # Show full response headers for debugging
    echo -e "${YELLOW}Response Headers:${NC}"
    echo "$response" | grep "HTTP/"
    echo "$response" | grep -i "x-ratelimit"
    
    if [ "$status_code" == "429" ]; then
        echo -e "${RED}Rate limit exceeded (HTTP 429)${NC}"
    else
        echo -e "${GREEN}Request successful (HTTP ${status_code})${NC}"
    fi
    echo "----------------------------------------"
}

echo "Making 10 rapid requests..."
for i in {1..10}; do
    make_request
    sleep 0.1
done
