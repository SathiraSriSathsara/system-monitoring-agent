#!/usr/bin/env bash
set -euo pipefail

echo "=== VPS Monitor Agent Setup ==="

# 1) Basic checks
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not installed. Please install Node.js LTS first."
  echo "   Ubuntu example:"
  echo "   - Install from NodeSource or apt, then re-run this script."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm is not installed. Install npm and re-run."
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "❌ package.json not found in current directory."
  echo "   Run this script inside the agent project folder."
  exit 1
fi

if [ ! -f "agent.js" ]; then
  echo "❌ agent.js not found in current directory."
  exit 1
fi

# 2) Create .env if missing
if [ ! -f ".env" ]; then
  echo "📝 .env not found. Let's create it."

  # DASHBOARD_URL
  read -r -p "DASHBOARD_URL (example: http://YOUR_DASHBOARD_IP:5050/api/ingest): " DASHBOARD_URL
  while [ -z "${DASHBOARD_URL}" ]; do
    read -r -p "DASHBOARD_URL cannot be empty. Enter DASHBOARD_URL: " DASHBOARD_URL
  done

  # INGEST_SECRET
  read -r -s -p "INGEST_SECRET (will not show while typing): " INGEST_SECRET
  echo ""
  while [ -z "${INGEST_SECRET}" ]; do
    read -r -s -p "INGEST_SECRET cannot be empty. Enter INGEST_SECRET: " INGEST_SECRET
    echo ""
  done

  # SERVER_ID
  read -r -p "SERVER_ID (example: vps-1): " SERVER_ID
  while [ -z "${SERVER_ID}" ]; do
    read -r -p "SERVER_ID cannot be empty. Enter SERVER_ID: " SERVER_ID
  done

  # INTERVAL_MS
  read -r -p "INTERVAL_MS (example: 5000): " INTERVAL_MS
  # default if blank
  if [ -z "${INTERVAL_MS}" ]; then
    INTERVAL_MS="5000"
  fi
  # simple numeric check
  if ! [[ "${INTERVAL_MS}" =~ ^[0-9]+$ ]]; then
    echo "❌ INTERVAL_MS must be a number (milliseconds)."
    exit 1
  fi

  cat > .env <<EOF
DASHBOARD_URL=${DASHBOARD_URL}
INGEST_SECRET=${INGEST_SECRET}
SERVER_ID=${SERVER_ID}
INTERVAL_MS=${INTERVAL_MS}
EOF

  chmod 600 .env
  echo "✅ Created .env"
else
  echo "✅ .env already exists. Keeping it as-is."
fi

# 3) Clean install dependencies (npm ci needs package-lock.json)
if [ ! -f "package-lock.json" ]; then
  echo "⚠️ package-lock.json not found."
  echo "   Creating it with npm install (one-time), then future runs can use npm ci."
  npm install
else
  echo "📦 Installing dependencies with npm ci (clean install)..."
  npm ci
fi

# 4) Start the agent
echo "🚀 Starting agent..."
node agent.js
