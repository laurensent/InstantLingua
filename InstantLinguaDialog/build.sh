#!/bin/bash

# Build script for InstantLingua Dialog

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="InstantLingua Dialog"
APP_BUNDLE="$SCRIPT_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "Building $APP_NAME..."

# Clean previous build
rm -rf "$APP_BUNDLE"

# Create app bundle structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Compile Swift code
swiftc -o "$MACOS_DIR/InstantLinguaDialog" \
    -target arm64-apple-macosx12.0 \
    -target x86_64-apple-macosx12.0 \
    -framework Cocoa \
    -framework SwiftUI \
    "$SCRIPT_DIR/InstantLinguaDialog/main.swift" \
    2>/dev/null || \
swiftc -o "$MACOS_DIR/InstantLinguaDialog" \
    -framework Cocoa \
    -framework SwiftUI \
    "$SCRIPT_DIR/InstantLinguaDialog/main.swift"

# Copy Info.plist
cp "$SCRIPT_DIR/InstantLinguaDialog/Info.plist" "$CONTENTS_DIR/"

echo "Build complete: $APP_BUNDLE"
echo ""
echo "To install:"
echo "  1. Move '$APP_NAME.app' to /Applications"
echo "  2. Run it once to register the URL scheme"
echo ""
echo "Or run: open '$APP_BUNDLE'"
