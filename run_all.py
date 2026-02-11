"""
Runs backend and frontend in parallel.
Modes:
  dev     - uvicorn --reload + npm start
  preview - uvicorn (no reload) + npm run build && npx serve -s build -l <port>
Supports forwarding API URL to the frontend via REACT_APP_API_URL.
Stops both on Ctrl+C or when either process exits.
"""
from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


def popen(cmd, cwd, env=None):
    """Start process in its own group to send signals to the whole tree."""
    is_str = isinstance(cmd, str)
    if os.name == "nt":
        return subprocess.Popen(
            cmd,
            cwd=cwd,
            shell=is_str,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
            env=env,
        )
    return subprocess.Popen(
        cmd,
        cwd=cwd,
        shell=is_str,
        preexec_fn=os.setsid,
        env=env,
    )


def stop_process(proc):
    if proc is None or proc.poll() is not None:
        return

    try:
        if os.name == "nt":
            proc.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(proc.pid, signal.SIGINT)
    except Exception:
        proc.terminate()


def parse_args():
    parser = argparse.ArgumentParser(description="Run frontend + backend together")
    parser.add_argument(
        "--mode",
        choices=["dev", "preview"],
        default="dev",
        help="dev: npm start + uvicorn --reload; preview: serve build + uvicorn",
    )
    parser.add_argument(
        "--api-url",
        default=None,
        help="External API URL for frontend (sets REACT_APP_API_URL)",
    )
    parser.add_argument(
        "--frontend-port",
        default="3000",
        help="Port for serve in preview mode (default: 3000)",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    env_front = os.environ.copy()
    if args.api_url:
        env_front["REACT_APP_API_URL"] = args.api_url

    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
    ]
    if args.mode == "dev":
        backend_cmd.insert(4, "--reload")

    if args.mode == "dev":
        frontend_cmd = "npm start"
    else:
        frontend_cmd = f"npm run build && npx serve -s build -l {args.frontend_port}"

    print(f"Mode: {args.mode}")
    if args.api_url:
        print(f"Frontend API: {args.api_url}")
    print("Starting backend...")
    backend = popen(backend_cmd, BACKEND_DIR)

    print("Starting frontend...")
    frontend = popen(frontend_cmd, FRONTEND_DIR, env=env_front)

    processes = [backend, frontend]

    try:
        while True:
            time.sleep(1)
            if any(p.poll() is not None for p in processes):
                break
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        for p in processes:
            stop_process(p)

        for p in processes:
            if p and p.poll() is None:
                try:
                    p.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    p.kill()

        print("Both services stopped.")


if __name__ == "__main__":
    main()
