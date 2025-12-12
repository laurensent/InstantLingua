#!/bin/bash

# InstantLingua Dev Release Script

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Dialog app..."
"$SCRIPT_DIR/InstantLinguaDialog/build.sh" > /dev/null

echo "Packaging dev extension..."
rm -rf "$SCRIPT_DIR/InstantLingua-Dev.popclipext/InstantLingua Dialog.app"
cp -R "$SCRIPT_DIR/InstantLinguaDialog/InstantLingua Dialog.app" "$SCRIPT_DIR/InstantLingua-Dev.popclipext/"
rm -f "$SCRIPT_DIR/InstantLingua-Dev.popclipextz"
zip -rq InstantLingua-Dev.popclipextz InstantLingua-Dev.popclipext -x "*.DS_Store"

echo "Done: InstantLingua-Dev.popclipextz ($(du -h InstantLingua-Dev.popclipextz | cut -f1))"
