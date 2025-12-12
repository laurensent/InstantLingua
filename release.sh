#!/bin/bash

# InstantLingua Release Script

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Dialog app..."
"$SCRIPT_DIR/InstantLinguaDialog/build.sh" > /dev/null

echo "Packaging extension..."
rm -rf "$SCRIPT_DIR/InstantLingua.popclipext/InstantLingua Dialog.app"
cp -R "$SCRIPT_DIR/InstantLinguaDialog/InstantLingua Dialog.app" "$SCRIPT_DIR/InstantLingua.popclipext/"
rm -f "$SCRIPT_DIR/InstantLingua.popclipextz"
zip -rq InstantLingua.popclipextz InstantLingua.popclipext -x "*.DS_Store"

echo "Done: InstantLingua.popclipextz ($(du -h InstantLingua.popclipextz | cut -f1))"
