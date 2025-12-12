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
}

package_dev() {
    echo "Packaging InstantLingua-Dev..."
    rm -rf "$SCRIPT_DIR/InstantLingua-Dev.popclipext/InstantLingua Dialog.app"
    cp -R "$SCRIPT_DIR/InstantLinguaDialog/InstantLingua Dialog.app" "$SCRIPT_DIR/InstantLingua-Dev.popclipext/"
    rm -f "$SCRIPT_DIR/InstantLingua-Dev.popclipextz"
    zip -rq InstantLingua-Dev.popclipextz InstantLingua-Dev.popclipext -x "*.DS_Store"
    echo "Created: InstantLingua-Dev.popclipextz ($(du -h InstantLingua-Dev.popclipextz | cut -f1))"
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
