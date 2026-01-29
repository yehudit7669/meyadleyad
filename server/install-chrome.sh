#!/bin/bash
# Install Chrome for Puppeteer on Render

echo "🔧 Installing Chrome for Puppeteer..."

# Create cache directory
mkdir -p /opt/render/.cache/puppeteer

# Install Chrome using Puppeteer's built-in installer
echo "📥 Downloading Chrome..."
npx puppeteer browsers install chrome --path /opt/render/.cache/puppeteer

# Verify installation
if [ -d "/opt/render/.cache/puppeteer/chrome" ]; then
  echo "✅ Chrome installed successfully!"
  ls -la /opt/render/.cache/puppeteer/
else
  echo "❌ Chrome installation failed"
  exit 1
fi
