#!/usr/bin/env bash
# Универсальный старт для локальной разработки, предпросмотра и Railway.
# Требования: bash, Python 3, Node.js+npm.
#
# Режимы:
#   dev              — uvicorn --reload + npm start
#   preview          — uvicorn + npm run build + npx serve -s build -l $FRONT_PORT
#   railway-backend  — только бэкенд (для Railway backend service)
#   railway-frontend — только фронтенд build+serve (для Railway frontend service)
#
# Опции окружения:
#   API_URL     — REACT_APP_API_URL для фронта (default http://localhost:$BACK_PORT)
#   BACK_PORT   — порт uvicorn (default 8000)
#   FRONT_PORT  — порт фронта/serve (default 3000)
#   PYTHON_BIN  — явный путь к python, если в PATH нет

set -euo pipefail

MODE="${1:-dev}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
VENV_DIR="$BACKEND_DIR/.venv"
BACK_PORT="${BACK_PORT:-8000}"
FRONT_PORT="${FRONT_PORT:-3000}"
API_URL="${API_URL:-http://localhost:${BACK_PORT}}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

banner() { printf "\n========== %s ==========\n" "$*"; }

ensure_python() {
  if command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    return
  fi
  for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
      PYTHON_BIN="$candidate"
      return
    fi
  done

  echo "Python не найден в PATH, пробую установить..."
  if command -v apt-get >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then sudo apt-get update -y && sudo apt-get install -y python3 python3-venv; else apt-get update -y && apt-get install -y python3 python3-venv; fi || true
    if command -v python3 >/dev/null 2>&1; then PYTHON_BIN="python3"; return; fi
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache python3 py3-virtualenv || true
    if command -v python3 >/dev/null 2>&1; then PYTHON_BIN="python3"; return; fi
  fi

  echo "Python is not installed or not in PATH. Set PYTHON_BIN env to your python executable."
  exit 1
}

ensure_venv() {
  if [[ ! -d "$VENV_DIR" ]]; then
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  fi
  if [[ -x "$VENV_DIR/bin/activate" ]]; then
    source "$VENV_DIR/bin/activate"
  else
    source "$VENV_DIR/Scripts/activate"
  fi
}

install_backend_deps() {
  banner "pip install"
  pip install --quiet -r "$BACKEND_DIR/requirements.txt"
}

install_frontend_deps() {
  banner "npm install / ci"
  pushd "$FRONTEND_DIR" >/dev/null
  if [[ ! -d node_modules ]]; then
    npm ci
  fi
  popd >/dev/null
}

start_backend() {
  banner "Starting backend on 0.0.0.0:${BACK_PORT}"
  pushd "$BACKEND_DIR" >/dev/null
  "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port "$BACK_PORT" &
  BACK_PID=$!
  popd >/dev/null
}

start_frontend_dev() {
  banner "Starting frontend dev on localhost:${FRONT_PORT}"
  pushd "$FRONTEND_DIR" >/dev/null
  REACT_APP_API_URL="$API_URL" PORT="$FRONT_PORT" npm start &
  FRONT_PID=$!
  popd >/dev/null
}

start_frontend_preview() {
  banner "Building frontend"
  pushd "$FRONTEND_DIR" >/dev/null
  REACT_APP_API_URL="$API_URL" npm run build
  banner "Serving build on :${FRONT_PORT}"
  npx serve -s build -l "$FRONT_PORT" &
  FRONT_PID=$!
  popd >/dev/null
}

case "$MODE" in
  dev)
    banner "MODE: dev"
    ensure_python
    ensure_venv
    install_backend_deps
    install_frontend_deps
    start_backend
    start_frontend_dev
    ;;
  preview)
    banner "MODE: preview"
    ensure_python
    ensure_venv
    install_backend_deps
    install_frontend_deps
    start_backend
    start_frontend_preview
    ;;
  railway-backend)
    banner "MODE: railway-backend"
    ensure_python
    ensure_venv
    install_backend_deps
    banner "Starting backend for Railway on 0.0.0.0:${PORT:-8000}"
    pushd "$BACKEND_DIR" >/dev/null
    "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
    popd >/dev/null
    exit 0
    ;;
  railway-frontend)
    banner "MODE: railway-frontend"
    install_frontend_deps
    pushd "$FRONTEND_DIR" >/dev/null
    REACT_APP_API_URL="${API_URL}" npm run build
    npx serve -s build -l "${PORT:-3000}"
    popd >/dev/null
    exit 0
    ;;
  *)
    echo "Unknown mode: $MODE"; exit 1 ;;
 esac

banner "Running (backend PID: ${BACK_PID:-N/A}, frontend PID: ${FRONT_PID:-N/A})"
trap 'echo "Stopping..."; kill ${BACK_PID-} ${FRONT_PID-} 2>/dev/null || true' INT TERM
wait

