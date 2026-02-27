#!/bin/bash

# Font Browser Extension - Quick Rebuild Script
# Compiles, packages, installs, and restarts extension host without closing VS Code windows

set -e  # Exit on any error

# Auto-bump build number so VS Code detects a new version on each install
BUILD_NUM_FILE=".buildnum"
if [ -f "$BUILD_NUM_FILE" ]; then
  BUILD_NUM=$(($(cat "$BUILD_NUM_FILE") + 1))
else
  BUILD_NUM=1
fi
echo "$BUILD_NUM" > "$BUILD_NUM_FILE"

# Generate a random build ID (adjective-scientist)
ADJECTIVES=("bold" "calm" "cool" "dark" "deft" "fair" "fast" "free" "glad" "gold" "hazy" "keen" "kind" "lush" "neat" "pale" "pure" "rare" "rich" "rosy" "sage" "slim" "soft" "sure" "tame" "tiny" "trim" "vast" "warm" "wild" "wise" "zany")
SCIENTISTS=("borg" "bohr" "cori" "curie" "darwin" "dirac" "euler" "faraday" "fermi" "feynman" "gauss" "hopper" "hubble" "hypatia" "kepler" "lamarr" "leibniz" "lovelace" "maxwell" "mendel" "newton" "noether" "pascal" "planck" "rosalind" "sagan" "shannon" "tesla" "turing" "volta" "watt" "wu")
ADJ=${ADJECTIVES[$((RANDOM % ${#ADJECTIVES[@]}))]}
SCI=${SCIENTISTS[$((RANDOM % ${#SCIENTISTS[@]}))]}
BUILD_ID="${ADJ}-${SCI}"

# Update build ID in source
sed -i '' "s/BUILD_ID = '[^']*'/BUILD_ID = '${BUILD_ID}'/" src/FontBrowserViewProvider.ts

# Read base version from package.json (strip any existing -dev.N suffix)
BASE_VERSION=$(node -e "const v=require('./package.json').version.replace(/-dev\.\d+$/,''); console.log(v)")
NEW_VERSION="${BASE_VERSION}-dev.${BUILD_NUM}"

# Temporarily set version for packaging
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.version = '${NEW_VERSION}';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

echo "🔨 Compiling TypeScript..."
pnpm run compile

echo "📦 Packaging extension (v${NEW_VERSION})..."
npx @vscode/vsce package

# Restore base version in package.json so git stays clean
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.version = '${BASE_VERSION}';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

echo "🔄 Installing extension..."
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
echo "✅ Build #${BUILD_NUM} complete (v${NEW_VERSION})"
echo "   Build ID: ${BUILD_ID}"
