#!/bin/bash

# Script to push environment variables from .env.local to Netlify
# Usage: ./scripts/push-env-to-netlify.sh [site-id]

set -e

ENV_FILE="apps/web/.env.local"
SITE_ID=$1

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

# If no site ID provided, try to get it or link
if [ -z "$SITE_ID" ]; then
  echo "Checking for linked Netlify site..."
  SITE_ID=$(npx netlify-cli api getSites 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
  
  if [ -z "$SITE_ID" ]; then
    echo "No site ID found. Please link your site first:"
    echo "  cd apps/web && npx netlify-cli link"
    echo ""
    echo "Or provide site ID as argument:"
    echo "  ./scripts/push-env-to-netlify.sh YOUR_SITE_ID"
    exit 1
  fi
fi

echo "Setting environment variables for site: $SITE_ID"
echo "Reading from: $ENV_FILE"
echo ""

# Read .env.local and set each variable
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove quotes from value if present
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  
  # Skip if value is empty
  [[ -z "$value" ]] && continue
  
  echo "Setting $key..."
  npx netlify-cli env:set "$key" "$value" --context production 2>&1 | grep -v "Warning:" || true
  npx netlify-cli env:set "$key" "$value" --context deploy-preview 2>&1 | grep -v "Warning:" || true
  npx netlify-cli env:set "$key" "$value" --context branch-deploy 2>&1 | grep -v "Warning:" || true
done < "$ENV_FILE"

echo ""
echo "✅ Environment variables pushed to Netlify!"
echo ""
echo "To verify, run:"
echo "  npx netlify-cli env:list"

