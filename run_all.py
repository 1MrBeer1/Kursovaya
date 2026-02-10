"""
Runs backend (uvicorn) and frontend (npm start) in parallel.
Stops both on Ctrl+C or when either process exits.
"""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


def popen(cmd, cwd):
    """Start process in its own group to send signals to the whole tree."""
    is_str = isinstance(cmd, str)
    if os.name == "nt":
        return subprocess.Popen(
            cmd,
            cwd=cwd,
            shell=is_str,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
        )
    return subprocess.Popen(
        cmd,
        cwd=cwd,
        shell=is_str,
        preexec_fn=os.setsid,
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


def main():
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ]
    frontend_cmd = "npm start"

    print("Starting backend...")
    backend = popen(backend_cmd, BACKEND_DIR)

    print("Starting frontend...")
    frontend = popen(frontend_cmd, FRONTEND_DIR)

    processes = [backend, frontend]

    try:
        # Loop while both processes are alive
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
