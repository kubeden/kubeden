#!/bin/bash

# Compress macOS screen recordings (from Cmd+Ctrl+Shift+5) using H.265/HEVC
# Watches for new .mov files and automatically compresses them

WATCH_DIR="${1:-$HOME/Desktop}"
OUTPUT_DIR="${2:-$HOME/Desktop/Compressed}"
CRF="${3:-23}"  # Lower = better quality/bigger file (try 20-28)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Screen Recording Compressor${NC}"
echo "Watching: $WATCH_DIR"
echo "Output:   $OUTPUT_DIR"
echo "CRF:      $CRF (lower = better quality)"
echo ""

# Check dependencies
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg not found. Install with: brew install ffmpeg${NC}"
    exit 1
fi

if ! command -v fswatch &> /dev/null; then
    echo -e "${RED}Error: fswatch not found. Install with: brew install fswatch${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to wait for file to finish writing
wait_for_file() {
    local file="$1"
    local prev_size=0
    local curr_size=1

    echo -e "${YELLOW}Waiting for recording to finish...${NC}"

    while [ "$prev_size" != "$curr_size" ]; do
        prev_size=$curr_size
        sleep 2
        curr_size=$(stat -f%z "$file" 2>/dev/null || echo "0")
    done

    # Extra wait to ensure file is fully written
    sleep 1
}

# Function to compress a file
compress_file() {
    local input="$1"
    local filename=$(basename "$input" .mov)
    local output="$OUTPUT_DIR/${filename}.mp4"

    echo -e "${GREEN}Compressing:${NC} $filename"

    # Get original size
    local orig_size=$(stat -f%z "$input")
    local orig_mb=$(echo "scale=2; $orig_size / 1048576" | bc)

    # Compress with H.265/HEVC
    if ffmpeg -i "$input" \
        -c:v libx265 \
        -crf "$CRF" \
        -preset medium \
        -tag:v hvc1 \
        -c:a aac \
        -b:a 128k \
        -y \
        "$output" 2>/dev/null; then

        # Get compressed size
        local new_size=$(stat -f%z "$output")
        local new_mb=$(echo "scale=2; $new_size / 1048576" | bc)
        local savings=$(echo "scale=0; (1 - $new_size / $orig_size) * 100" | bc)

        echo -e "${GREEN}Done!${NC} ${orig_mb}MB -> ${new_mb}MB (${savings}% smaller)"

        # Delete original
        rm "$input"
        echo -e "Original deleted. Compressed file: $output"
        echo ""

        # macOS notification
        osascript -e "display notification \"${filename} compressed (${savings}% smaller)\" with title \"Screen Recording Compressor\""
    else
        echo -e "${RED}Compression failed for: $input${NC}"
    fi
}

# Watch for new files
echo "Watching for new screen recordings... (Ctrl+C to stop)"
echo ""

fswatch -0 --event Created "$WATCH_DIR" | while IFS= read -r -d '' file; do
    # Only process .mov files that look like screen recordings
    if [[ "$file" == *"Screen Recording"*.mov ]] || [[ "$file" == *"screen recording"*.mov ]]; then
        # Wait for file to finish writing
        wait_for_file "$file"

        # Compress it
        compress_file "$file"
    fi
done
