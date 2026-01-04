#!/bin/bash

# Quick script to set Netlify environment variables
# Run this from the apps/web directory after linking your Netlify site

cd "$(dirname "$0")/../apps/web" || exit 1

if [ ! -f ".env.local" ]; then
  echo "Error: .env.local not found in apps/web"
  exit 1
fi

echo "📦 Reading environment variables from apps/web/.env.local"
echo ""

# Read and set each variable
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove quotes
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  
  # Skip empty or placeholder values
  [[ -z "$value" ]] && continue
  [[ "$value" == *"your-"* ]] && continue
  [[ "$value" == "your_webhook_secret" ]] && continue
  
  echo "Setting $key..."
  npx netlify-cli env:set "$key" "$value" 2>&1 | grep -v "Warning:" || true
done < .env.local

echo ""
echo "✅ Done! Verify with: npx netlify-cli env:list"

