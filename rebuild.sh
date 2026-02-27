#!/bin/bash

# Font Browser Extension - Quick Rebuild Script
# Compiles, packages, installs, and restarts extension host without closing VS Code windows

set -e  # Exit on any error

echo "🔨 Compiling TypeScript..."
pnpm run compile

echo "📦 Packaging extension..."
npx @vscode/vsce package

echo "🔄 Installing extension..."
# Find the most recently created VSIX file
LATEST_VSIX=$(ls -t font-browser-*.vsix | head -1)
echo "Installing: $LATEST_VSIX"
code --install-extension "$LATEST_VSIX" --force

echo "♻️  Restarting extension host..."
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "    Press: Cmd+Shift+P"
echo "    Type: Developer: Restart Extension Host"
echo "    Press: Enter"
echo ""
echo "✅ Build complete! Check footer for build ID in sidebar"
