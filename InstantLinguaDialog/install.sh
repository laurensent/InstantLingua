#!/bin/bash

# InstantLingua Dialog Installer

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="InstantLingua Dialog.app"
SOURCE="$SCRIPT_DIR/$APP_NAME"
DEST="/Applications/$APP_NAME"

echo "Installing InstantLingua Dialog..."

# Build if not exists
if [ ! -d "$SOURCE" ]; then
    echo "Building app..."
    "$SCRIPT_DIR/build.sh"
fi

# Remove old version
if [ -d "$DEST" ]; then
    echo "Removing old version..."
    rm -rf "$DEST"
fi

# Copy to Applications
echo "Copying to /Applications..."
cp -R "$SOURCE" "$DEST"

# Register URL scheme by launching once
echo "Registering URL scheme..."
open "$DEST"
sleep 1
osascript -e 'tell application "InstantLingua Dialog" to quit' 2>/dev/null || true

echo ""
echo "Installation complete!"
echo "The app is now installed at: $DEST"
echo ""
echo "Enable 'Show in Dialog' in PopClip extension settings to use it."
