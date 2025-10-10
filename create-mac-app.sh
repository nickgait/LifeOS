#!/bin/bash

# Script to create a macOS .app bundle for LifeOS
# Run this once to create LifeOS.app

APP_NAME="LifeOS"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/$APP_NAME.app"

echo "Creating $APP_NAME.app..."

# Create app bundle structure
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>LifeOS</string>
    <key>CFBundleDisplayName</key>
    <string>LifeOS</string>
    <key>CFBundleIdentifier</key>
    <string>com.lifeos.app</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>LifeOS</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# Create launcher script
cat > "$APP_DIR/Contents/MacOS/$APP_NAME" << 'EOF'
#!/bin/bash

# Get the directory where LifeOS.app is located (same directory as the project)
APP_PATH="$0"
while [ -L "$APP_PATH" ]; do
    APP_PATH=$(readlink "$APP_PATH")
done
APP_DIR="$(dirname "$APP_PATH")"
PROJECT_DIR="$(cd "$APP_DIR/../../.." && pwd)"

# Open Terminal and run the launcher
osascript <<APPLESCRIPT
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && bash START_LIFEOS.command"
end tell
APPLESCRIPT
EOF

# Make launcher executable
chmod +x "$APP_DIR/Contents/MacOS/$APP_NAME"

# Try to create an icon (requires iconutil, optional)
if command -v sips &> /dev/null && command -v iconutil &> /dev/null; then
    # Create a simple colored icon
    ICONSET="$APP_DIR/Contents/Resources/AppIcon.iconset"
    mkdir -p "$ICONSET"

    # Create a gradient image using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 512x512 gradient:'#667eea'-'#764ba2' "$ICONSET/icon_512x512.png"
        sips -z 256 256 "$ICONSET/icon_512x512.png" --out "$ICONSET/icon_256x256.png" > /dev/null 2>&1
        sips -z 128 128 "$ICONSET/icon_512x512.png" --out "$ICONSET/icon_128x128.png" > /dev/null 2>&1
        sips -z 64 64 "$ICONSET/icon_512x512.png" --out "$ICONSET/icon_64x64.png" > /dev/null 2>&1
        sips -z 32 32 "$ICONSET/icon_512x512.png" --out "$ICONSET/icon_32x32.png" > /dev/null 2>&1
        sips -z 16 16 "$ICONSET/icon_512x512.png" --out "$ICONSET/icon_16x16.png" > /dev/null 2>&1

        iconutil -c icns "$ICONSET" -o "$APP_DIR/Contents/Resources/AppIcon.icns"
        rm -rf "$ICONSET"

        echo "✓ Created app icon"
    fi
fi

echo ""
echo "✓ $APP_NAME.app created successfully!"
echo ""
echo "You can now:"
echo "  1. Double-click $APP_NAME.app to start LifeOS"
echo "  2. Drag it to your Applications folder"
echo "  3. Add it to your Dock"
echo ""
