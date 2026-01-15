#!/bin/bash

# InstantLingua Release Script
# Usage: ./release.sh [all|main|dev]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

build_dialog() {
    echo "Building Dialog app..."
    "$SCRIPT_DIR/InstantLinguaDialog/build.sh" > /dev/null
}

package_main() {
    echo "Packaging InstantLingua..."
    rm -rf "$SCRIPT_DIR/InstantLingua.popclipext/InstantLingua Dialog.app"
    cp -R "$SCRIPT_DIR/InstantLinguaDialog/InstantLingua Dialog.app" "$SCRIPT_DIR/InstantLingua.popclipext/"

    rm -f "$SCRIPT_DIR/InstantLingua.popclipextz"
    zip -rq InstantLingua.popclipextz InstantLingua.popclipext -x "*.DS_Store"
    echo "Created: InstantLingua.popclipextz ($(du -h InstantLingua.popclipextz | cut -f1))"

    # Generate setup command file
    cat > "$SCRIPT_DIR/InstantLingua.command" << 'EOF'
#!/bin/bash
# InstantLingua Dialog Setup
# This script copies the Dialog app to /Applications and opens Privacy settings

APP_SRC="$HOME/Library/Application Support/PopClip/Extensions/InstantLingua.popclipext/InstantLingua Dialog.app"
APP_DEST="/Applications/InstantLingua Dialog.app"

echo "Setting up InstantLingua Dialog..."

if [ ! -d "$APP_SRC" ]; then
    echo "Error: Please install InstantLingua.popclipextz first."
    exit 1
fi

# Copy to /Applications
cp -R "$APP_SRC" "$APP_DEST" 2>/dev/null || {
    echo "Error: Cannot copy to /Applications. Please check permissions."
    exit 1
}

echo "Copied to /Applications"

# Open Privacy & Security settings
open "x-apple.systempreferences:com.apple.preference.security?Privacy"

echo "Done! Please allow InstantLingua Dialog in Privacy settings if prompted."
EOF
    chmod +x "$SCRIPT_DIR/InstantLingua.command"
    echo "Created: InstantLingua.command"
}

package_dev() {
    echo "Packaging InstantLingua-Dev..."
    rm -rf "$SCRIPT_DIR/InstantLingua-Dev.popclipext/InstantLingua Dialog.app"
    cp -R "$SCRIPT_DIR/InstantLinguaDialog/InstantLingua Dialog.app" "$SCRIPT_DIR/InstantLingua-Dev.popclipext/"

    rm -f "$SCRIPT_DIR/InstantLingua-Dev.popclipextz"
    zip -rq InstantLingua-Dev.popclipextz InstantLingua-Dev.popclipext -x "*.DS_Store"
    echo "Created: InstantLingua-Dev.popclipextz ($(du -h InstantLingua-Dev.popclipextz | cut -f1))"

    # Generate setup command file for dev
    cat > "$SCRIPT_DIR/InstantLingua-Dev.command" << 'EOF'
#!/bin/bash
# InstantLingua Dialog Setup (Dev)
# This script copies the Dialog app to /Applications and opens Privacy settings

APP_SRC="$HOME/Library/Application Support/PopClip/Extensions/InstantLingua-Dev.popclipext/InstantLingua Dialog.app"
APP_DEST="/Applications/InstantLingua Dialog.app"

echo "Setting up InstantLingua Dialog (Dev)..."

if [ ! -d "$APP_SRC" ]; then
    echo "Error: Please install InstantLingua-Dev.popclipextz first."
    exit 1
fi

# Copy to /Applications
cp -R "$APP_SRC" "$APP_DEST" 2>/dev/null || {
    echo "Error: Cannot copy to /Applications. Please check permissions."
    exit 1
}

echo "Copied to /Applications"

# Open Privacy & Security settings
open "x-apple.systempreferences:com.apple.preference.security?Privacy"

echo "Done! Please allow InstantLingua Dialog in Privacy settings if prompted."
EOF
    chmod +x "$SCRIPT_DIR/InstantLingua-Dev.command"
    echo "Created: InstantLingua-Dev.command"
}

case "${1:-all}" in
    main)
        build_dialog
        package_main
        ;;
    dev)
        build_dialog
        package_dev
        ;;
    all|*)
        build_dialog
        package_main
        package_dev
        echo "Done!"
        ;;
esac
