#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

#API_URL="https://api.kubeden.io"
API_URL="http://localhost:8080"

echo -e "${YELLOW}Testing Rate Limiting...${NC}\n"

# Function to make request and show rate limit headers
make_request() {
    local endpoint=$1
    local attempt=$2
    
    echo -e "\n${YELLOW}Request #${attempt} to ${endpoint}${NC}"
    
    # Make the request and capture both headers and body
    response=$(curl -s -i \
        -H "Accept: application/json" \
        -H "X-Forwarded-For: 192.168.1.1" \
        "${API_URL}${endpoint}")
    
    # Parse status code from response
    status_code=$(echo "$response" | grep "HTTP/" | awk '{print $2}')
    
    # Extract rate limit headers (using grep -i for case-insensitive matching)
    remaining=$(echo "$response" | grep -i "x-ratelimit-remaining" | awk '{print $2}' | tr -d '\r')
    limit=$(echo "$response" | grep -i "x-ratelimit-limit" | awk '{print $2}' | tr -d '\r')
    
    if [ "$status_code" == "429" ]; then
        echo -e "${RED}Rate limit exceeded (HTTP 429)${NC}"
        retry_after=$(echo "$response" | grep -i "retry-after" | awk '{print $2}' | tr -d '\r')
        echo -e "Retry after: ${retry_after} seconds"
    else
        echo -e "${GREEN}Request successful (HTTP ${status_code})${NC}"
    fi
    
    if [ -n "$remaining" ] && [ -n "$limit" ]; then
        echo "Rate limit remaining: $remaining/$limit"
    else
        echo "Rate limit headers not found"
    fi
    echo "----------------------------------------"
    
    # Add a small delay to ensure request output is readable
    sleep 0.2
}

# Test 1: Make requests within rate limit
echo -e "${YELLOW}Test 1: Making 10 requests with 1 second delay${NC}"
for i in {1..10}; do
    make_request "/articles" $i
    sleep 1
done

# Test 2: Burst requests to trigger rate limit
echo -e "\n${YELLOW}Test 2: Burst 20 requests rapidly${NC}"
for i in {1..20}; do
    make_request "/articles" $i
    sleep 0.1
done

# Test 3: Wait for rate limit reset
echo -e "\n${YELLOW}Test 3: Waiting 60 seconds for rate limit reset...${NC}"
sleep 60

# Make one more request to verify reset
echo -e "\n${YELLOW}Test 4: Verifying rate limit reset${NC}"
make_request "/articles" 1
