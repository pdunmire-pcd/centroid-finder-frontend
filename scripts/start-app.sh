#!/usr/bin/env bash
# Starts the whole app with one command: the Express server and the frontend.
#
#   npm run dev (or npm run app)   real server + JAR -> open http://localhost:5173
#   npm run dev:mock (or app:mock) mock data only, no server or JAR
#
# The server runs on port 3001, not 3000, so it can't clash with another
# program that is already using 3000. Vite forwards /api, /process, /videos ...
# to it (see BACKEND_URL in vite.config.ts). Press Ctrl+C to stop both.

set -euo pipefail

FRONTEND_PORT=5173
BACKEND_PORT=3001

# The frontend folder (this script lives in its scripts/ folder)
FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ "${1:-}" = "--mock" ]; then
  echo "Starting the frontend in mock mode: http://localhost:$FRONTEND_PORT"
  cd "$FRONTEND_DIR"
  exec npx vite --mode mock --port "$FRONTEND_PORT" --strictPort
fi

# Find the server: BACKEND_DIR if set, otherwise next to the main frontend repo.
# The upgraded server (with /api/jobs, /frame and uploads) is used if it exists.
MAIN_REPO="$(cd "$(git -C "$FRONTEND_DIR" rev-parse --git-common-dir)/.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"
if [ -z "${BACKEND_DIR:-}" ]; then
  if [ -d "$PARENT_DIR/centroid-finder-upgrade-api/server" ]; then
    BACKEND_DIR="$PARENT_DIR/centroid-finder-upgrade-api/server"
  else
    BACKEND_DIR="$PARENT_DIR/centroid-finder/server"
  fi
fi

# The server reads the .env one folder above server/
if [ ! -e "$BACKEND_DIR/../.env" ]; then
  echo "No .env found next to $BACKEND_DIR."
  echo "Copy or link your centroid-finder/.env there, e.g.:"
  echo "  ln -s \"$PARENT_DIR/centroid-finder/.env\" \"$BACKEND_DIR/../.env\""
  exit 1
fi

# Use the faster JAR (parallel frames + per-frame speed-ups) if it has been built.
# Setting JAR_PATH here wins over the .env file, because the server's dotenv never
# overwrites a variable that is already set. Set JAR_PATH yourself to choose another JAR.
FAST_JAR="$PARENT_DIR/centroid-finder-proc-parallel/processor/target/videoprocessor.jar"
if [ -z "${JAR_PATH:-}" ] && [ -f "$FAST_JAR" ]; then
  export JAR_PATH="$FAST_JAR"
fi
if [ -n "${JAR_PATH:-}" ]; then
  echo "Using the JAR at $JAR_PATH"
else
  echo "Using the JAR from .env"
fi

for port in "$FRONTEND_PORT" "$BACKEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use. Stop whatever is using it (lsof -i :$port) and try again."
    exit 1
  fi
done

echo "Starting the server from $BACKEND_DIR on port $BACKEND_PORT"
(cd "$BACKEND_DIR" && PORT="$BACKEND_PORT" npm run dev) &
SERVER_PID=$!

# Stop the server too when this script ends (Ctrl+C or an error)
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

echo "Starting the frontend: http://localhost:$FRONTEND_PORT"
cd "$FRONTEND_DIR"
BACKEND_URL="http://localhost:$BACKEND_PORT" npx vite --port "$FRONTEND_PORT" --strictPort
