#!/usr/bin/env bash
#
# Универсальный запуск проекта (первый и последующие).
# Требования: bash (Git Bash/WLS/Mac/Linux), Python 3, Node.js, npm.
#
# Опции:
#   API_URL=https://your-backend.example   # прокидывает REACT_APP_API_URL для фронта
#   FRONT_PORT=3000                        # порт dev-сервера CRA
#   BACK_PORT=8000                         # порт uvicorn

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
VENV_DIR="$BACKEND_DIR/.venv"
BACK_PORT="${BACK_PORT:-8000}"
FRONT_PORT="${FRONT_PORT:-3000}"
API_URL="${API_URL:-http://localhost:${BACK_PORT}}"

banner() { printf "\n========== %s ==========\n" "$*"; }

# ----- Python venv -----
banner "Python venv"
if [[ ! -d "$VENV_DIR" ]]; then
  python -m venv "$VENV_DIR"
fi
if [[ -x "$VENV_DIR/bin/activate" ]]; then
  # Unix path
  source "$VENV_DIR/bin/activate"
else
  # Windows Git Bash path
  source "$VENV_DIR/Scripts/activate"
fi

banner "pip install"
pip install --quiet -r "$BACKEND_DIR/requirements.txt"

# ----- Frontend deps -----
banner "npm install / ci"
pushd "$FRONTEND_DIR" >/dev/null
if [[ ! -d node_modules ]]; then
  npm ci
fi
popd >/dev/null

# ----- Run services -----
banner "Starting backend on 0.0.0.0:${BACK_PORT}"
pushd "$BACKEND_DIR" >/dev/null
python -m uvicorn app.main:app --host 0.0.0.0 --port "$BACK_PORT" &
BACK_PID=$!
popd >/dev/null

banner "Starting frontend on localhost:${FRONT_PORT}"
pushd "$FRONTEND_DIR" >/dev/null
REACT_APP_API_URL="$API_URL" PORT="$FRONT_PORT" npm start &
FRONT_PID=$!
popd >/dev/null

banner "Running (backend PID: $BACK_PID, frontend PID: $FRONT_PID)"
trap 'echo "Stopping..."; kill $BACK_PID $FRONT_PID 2>/dev/null || true' INT TERM
wait
