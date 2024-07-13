#!/bin/bash

# Set the directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTICLES_DIR="$SCRIPT_DIR/../articles"
OUTPUT_DIR="$SCRIPT_DIR/../images"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to sanitize the title
sanitize_title() {
    echo "$1" | sed -e 's/[^A-Za-z0-9._-]/_/g' | tr -s '_' | tr '[:upper:]' '[:lower:]'
}

# Function to wrap text
wrap_text() {
    local text="$1"
    local max_width=30  # Adjust this value to change the wrapping width
    echo "$text" | fold -s -w $max_width | sed ':a;N;$!ba;s/\n/\\n/g'
}

# Loop through all Markdown files in the articles directory
for article in "$ARTICLES_DIR"/*.md; do
    # Extract the filename without extension
    filename=$(basename "$article" .md)
    
    # Extract the title from the first line that starts with a single #
    title=$(awk '/^# / {print substr($0, 3); exit}' "$article")
    
    # If no title found, use the filename as title
    if [ -z "$title" ]; then
        title=$filename
    fi
    
    # Sanitize the title for use in the output filename
    sanitized_title=$(sanitize_title "$title")
    
    # Wrap and escape the title for ffmpeg
    wrapped_title=$(wrap_text "$title")
    escaped_title=$(echo "$wrapped_title" | sed 's/[\\:*?"<>|]//g' | sed "s/'/'\\\\\\''/g")
    
    # Create the image using ffmpeg with wrapped text
    ffmpeg -y -f lavfi -i color=c=black:s=1920x1080 -vf \
    "drawtext=fontfile=/RobotoMono-Regular.ttf:fontsize=90:fontcolor=white:x=(w-tw)/2:y=(h-th)/2:text='$escaped_title':box=1:boxcolor=black@0.5:boxborderw=5,\
    drawtext=fontfile=/RobotoMono-Regular.ttf:fontsize=40:fontcolor=white:x=(w-tw)/2:y=h-th-50:text='x.com/kubeden'" \
    "$OUTPUT_DIR/${sanitized_title}.png"
    
    if [ $? -eq 0 ]; then
        echo "Generated image for: $title"
    else
        echo "Failed to generate image for: $title"
    fi
done

echo "All images have been generated."