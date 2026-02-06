#!/bin/bash

# Function to fetch and download
fetch_image() {
    name=$1
    url=$2
    target_dir="frontend/public/assets/shinchan"
    
    echo "Fetching $name..."
    # Fetch page, look for the main infobox image or gallery image which usually has /images/ path
    # We look for .png and sort by length to hopefully get a good resolution one, or just take the first specific one
    img_url=$(curl -L -s "$url" | grep -o 'https://static.wikia.nocookie.net/crayonshinchan/images/[^"]*\.png' | grep -v "scale-to-width" | head -n 1)
    
    # If standard png not found, try jpg
    if [ -z "$img_url" ]; then
        img_url=$(curl -L -s "$url" | grep -o 'https://static.wikia.nocookie.net/crayonshinchan/images/[^"]*\.jpg' | grep -v "scale-to-width" | head -n 1)
        ext="jpg"
    else
        ext="png"
    fi

    if [ -n "$img_url" ]; then
        # Clean up URL (remove /revision/... stuff if present, usually not needed for main image but let's just use what we found)
        echo "Found URL: $img_url"
        curl -s -L "$img_url" -o "$target_dir/$name.png" # Force save as png for code consistency if possible, or we'll convert/rename
        # Check if it's actually a valid image
        if file "$target_dir/$name.png" | grep -q "image"; then
            echo "Downloaded $name.png"
        else
            echo "Failed to download valid image for $name"
            rm "$target_dir/$name.png"
        fi
    else
        echo "No image found for $name"
    fi
}

fetch_image "shinchan" "https://crayonshinchan.fandom.com/wiki/Shinnosuke_Nohara"
fetch_image "kazama" "https://crayonshinchan.fandom.com/wiki/Toru_Kazama"
fetch_image "nene" "https://crayonshinchan.fandom.com/wiki/Nene_Sakurada"
fetch_image "masao" "https://crayonshinchan.fandom.com/wiki/Masao_Sato"
fetch_image "bo-chan" "https://crayonshinchan.fandom.com/wiki/Bo_Suzuki"
fetch_image "shiro" "https://crayonshinchan.fandom.com/wiki/Shiro"
fetch_image "action-mask" "https://crayonshinchan.fandom.com/wiki/Action_Mask_(Character)"
fetch_image "buriburizaemon" "https://crayonshinchan.fandom.com/wiki/Buriburizaemon"
