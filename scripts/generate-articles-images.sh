#!/bin/bash

# Set the directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTICLES_DIR="$SCRIPT_DIR/../articles"
OUTPUT_DIR="$SCRIPT_DIR/../images"
FONT_PATH="$SCRIPT_DIR/RobotoMono-Regular.ttf"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if the font file exists
if [ ! -f "$FONT_PATH" ]; then
    echo "Error: Font file not found at $FONT_PATH"
    exit 1
fi

# Function to wrap text
wrap_text() {
    local text="$1"
    local max_width=30  # Adjust this value to change the wrapping width
    echo "$text" | fold -s -w $max_width
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
    
    # Wrap the title
    wrapped_title=$(wrap_text "$title")
    
    # Prepare the drawtext filters
    drawtext_filters=""
    line_count=$(echo "$wrapped_title" | wc -l)
    current_line=1
    while IFS= read -r line; do
        escaped_line=$(echo "$line" | sed 's/[\\:*?"<>|]//g' | sed "s/'/'\\\\\\''/g")
        y_position=$(awk "BEGIN {print 540 - ($line_count - 1) * 40 + ($current_line - 1) * 80}")
        drawtext_filters="${drawtext_filters}drawtext=fontfile='$FONT_PATH':fontsize=80:fontcolor=white:x=(w-tw)/2:y=$y_position:text='$escaped_line',"
        ((current_line++))
    done <<< "$wrapped_title"
    
    # Add the website text
    drawtext_filters="${drawtext_filters}drawtext=fontfile='$FONT_PATH':fontsize=40:fontcolor=white:x=(w-tw)/2:y=h-th-50:text='x.com/kubeden'"
    
    # Remove the trailing comma
    drawtext_filters=${drawtext_filters%,}
    
    # Create the image using ffmpeg with wrapped text
    ffmpeg -y -f lavfi -i color=c=black:s=1920x1080 -vf "$drawtext_filters" -frames:v 1 "$OUTPUT_DIR/${filename}.png"
    
    if [ $? -eq 0 ]; then
        echo "Generated image for: $title (File: ${filename}.png)"
    else
        echo "Failed to generate image for: $title (File: ${filename}.png)"
    fi
done

echo "All images have been generated."