#!/usr/bin/env python3
import os
import sys
import time
import signal
import subprocess
import webbrowser
import threading
import platform
import psutil
import requests
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from queue import Queue, Empty
from enum import Enum, auto

# Configuration
BASE_DIR = Path(__file__).parent.resolve()
FRONTEND_DIR = BASE_DIR / 'frontend'
BACKEND_DIR = BASE_DIR / 'backend'

# Maximum time to wait for processes to start/stop (in seconds)
PROCESS_START_TIMEOUT = 30
PROCESS_STOP_TIMEOUT = 10

# ANSI color codes
COLORS = {
    'red': '\033[91m',
    'green': '\033[92m',
    'yellow': '\033[93m',
    'blue': '\033[94m',
    'magenta': '\033[95m',
    'cyan': '\033[96m',
    'white': '\033[97m',
    'gray': '\033[90m',
    'end': '\033[0m'
}

class ProcessState(Enum):
    STARTING = auto()
    RUNNING = auto()
    STOPPING = auto()
    STOPPED = auto()
    ERROR = auto()

class ProcessInfo:
    def __init__(self, process: subprocess.Popen, name: str, color: str, start_time: float):
        self.process = process
        self.name = name
        self.color = color
        self.state = ProcessState.STARTING
        self.start_time = start_time
        self.pid = process.pid if process else None
        self.retry_count = 0
        self.max_retries = 3
        self.health_check_url = None
        self.last_health_check = 0

class ProcessManager:
    def __init__(self):
        self.processes: List[ProcessInfo] = []
        self.log_queue = Queue()
        self.running = True
        self.start_time = time.time()
        self.log_lock = threading.Lock()
        
        # Set up health check URLs
        self.health_checks = {
            'BACKEND': 'http://localhost:8000/api/health',
            'FRONTEND': 'http://localhost:3000'
        }

    def log(self, message: str, source: str = "SYSTEM", color: str = 'white', level: str = 'INFO'):
        """Add a message to the log queue with color coding and timestamp."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        level_color = {
            'ERROR': 'red',
            'WARN': 'yellow',
            'INFO': 'white',
            'DEBUG': 'gray'
        }.get(level, 'white')
        
        with self.log_lock:
            colored_source = f"{COLORS[color]}{source:10}{COLORS['end']}"
            colored_level = f"{COLORS[level_color]}{level:5}{COLORS['end']}"
            log_message = f"[{timestamp}] {colored_level} | {colored_source} | {message}"
            self.log_queue.put(log_message + '\n')

    def run_command(
        self, 
        command: List[str], 
        cwd: str = None, 
        name: str = "CMD", 
        color: str = 'white',
        retries: int = 3,
        health_check: bool = False,
        env: dict = None
    ) -> Optional[ProcessInfo]:
        """Run a command and capture its output with retry logic."""
        def enqueue_output(pipe, source, is_error=False):
            while self.running:
                try:
                    line = pipe.readline()
                    if line:
                        level = 'ERROR' if is_error else 'INFO'
                        self.log(line.strip(), source, color, level)
                    else:
                        time.sleep(0.1)
                except Exception as e:
                    self.log(f"Error reading from {source}: {str(e)}", "ERROR", 'red')
                    break

        for attempt in range(1, retries + 1):
            try:
                process = subprocess.Popen(
                    command,
                    cwd=cwd or str(BASE_DIR),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    universal_newlines=True,
                    shell=sys.platform == 'win32',
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0,
                    env=env or os.environ
                )
                
                # Create process info
                proc_info = ProcessInfo(process, name, color, time.time())
                proc_info.retry_count = attempt - 1
                proc_info.health_check_url = self.health_checks.get(name)
                
                # Start output capture threads
                threading.Thread(
                    target=enqueue_output, 
                    args=(process.stdout, name, False),
                    daemon=True
                ).start()
                
                threading.Thread(
                    target=enqueue_output, 
                    args=(process.stderr, f"{name}-ERR", True),
                    daemon=True
                ).start()
                
                self.processes.append(proc_info)
                proc_info.state = ProcessState.RUNNING
                self.log(f"Started {name} (PID: {process.pid})", name, color)
                
                return proc_info
                
            except Exception as e:
                error_msg = f"Failed to start {name} (attempt {attempt}/{retries}): {str(e)}"
                self.log(error_msg, "ERROR", 'red')
                
                if attempt < retries:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    proc_info = ProcessInfo(None, name, color, time.time())
                    proc_info.state = ProcessState.ERROR
                    self.processes.append(proc_info)
                    return None
        
        return None

    def check_process_health(self, proc_info: ProcessInfo) -> bool:
        """Check if a process is healthy by making an HTTP request to its health endpoint."""
        if not proc_info.health_check_url or not proc_info.process:
            return True
            
        try:
            # Skip health checks during startup period
            current_time = time.time()
            startup_grace_period = 30  # Give 30 seconds for startup
            
            if current_time - proc_info.start_time < startup_grace_period:
                return True
                
            # Don't check too frequently (min 15 seconds between checks)
            if current_time - proc_info.last_health_check < 15:
                return True
                
            proc_info.last_health_check = current_time
            # Increase timeout to 15 seconds and add retry logic
            for attempt in range(3):
                try:
                    response = requests.get(proc_info.health_check_url, timeout=15)
                    return response.status_code == 200
                except requests.exceptions.Timeout:
                    if attempt < 2:
                        time.sleep(2)  # Wait 2 seconds before retry
                        continue
                    raise
                except requests.exceptions.ConnectionError:
                    if attempt < 2:
                        time.sleep(2)  # Wait 2 seconds before retry
                        continue
                    raise
            
        except Exception as e:
            self.log(f"Health check failed for {proc_info.name}: {str(e)}", 
                    proc_info.name, 'yellow', 'WARN')
            return False

    def start_backend(self) -> Optional[ProcessInfo]:
        """Start the FastAPI backend server with health checks."""
        self.log("Starting backend server...", "BACKEND", 'blue')
        
        # Set up environment
        backend_env = os.environ.copy()
        backend_env['PYTHONPATH'] = str(BACKEND_DIR)
        
        # Start the backend process
        return self.run_command(
            ['uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
            cwd=str(BACKEND_DIR),
            name="BACKEND",
            color='blue',
            health_check=True,
            env=backend_env
        )

    def start_frontend(self) -> Optional[ProcessInfo]:
        """Start the Vite frontend development server."""
        self.log("Starting frontend server...", "FRONTEND", 'magenta')
        
        # Install dependencies if needed
        if not (FRONTEND_DIR / 'node_modules').exists():
            self.log("Installing frontend dependencies...", "FRONTEND", 'yellow')
            install = self.run_command(
                ['npm', 'install'],
                cwd=str(FRONTEND_DIR),
                name="NPM-INSTALL",
                color='yellow',
                retries=1
            )
            if install and install.process:
                install.process.wait()
        
        # Set environment variables for proper Unicode handling
        env = os.environ.copy()
        if platform.system() == 'Windows':
            env['PYTHONIOENCODING'] = 'utf-8'
            env['NODE_OPTIONS'] = '--max-old-space-size=4096'
        
        # Start the frontend process
        return self.run_command(
            ['npm', 'run', 'dev', '--', '--host'],
            cwd=str(FRONTEND_DIR),
            name="FRONTEND",
            color='magenta',
            health_check=True,
            env=env
        )

    def stop_process(self, proc_info: ProcessInfo, timeout: int = 10) -> bool:
        """Stop a process gracefully with a timeout."""
        if not proc_info or not proc_info.process:
            return False
            
        proc_info.state = ProcessState.STOPPING
        self.log(f"Stopping {proc_info.name} (PID: {proc_info.pid})...", 
                proc_info.name, proc_info.color)
        
        try:
            # Try graceful shutdown first
            if platform.system() == 'Windows':
                proc_info.process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                proc_info.process.terminate()
            
            # Wait for the process to terminate
            try:
                proc_info.process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                self.log(f"Force killing {proc_info.name} (PID: {proc_info.pid})", 
                        proc_info.name, 'red', 'WARN')
                proc_info.process.kill()
                proc_info.process.wait()
                
        except Exception as e:
            self.log(f"Error stopping {proc_info.name}: {str(e)}", 
                    "ERROR", 'red')
            return False
        finally:
            proc_info.state = ProcessState.STOPPED
            
        return True

    def cleanup(self):
        """Cleanup all processes and resources."""
        self.running = False
        self.log("Shutting down servers...", "SYSTEM", 'yellow')
        
        # Stop processes in reverse order of startup
        for proc_info in reversed(self.processes):
            if proc_info.state not in (ProcessState.STOPPED, ProcessState.ERROR):
                self.stop_process(proc_info, PROCESS_STOP_TIMEOUT)
        
        self.log("All servers have been stopped.", "SYSTEM", 'green')

def main():
    manager = ProcessManager()
    
    def signal_handler(sig, frame):
        """Handle termination signals."""
        manager.log(f"Received signal {sig}, shutting down...", "SYSTEM", 'yellow')
        manager.cleanup()
        sys.exit(0)
    
    # Set up signal handling
    signal.signal(signal.SIGINT, signal_handler)
    if platform.system() != 'Windows':
        signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start servers
        backend = manager.start_backend()
        if not backend or not backend.process:
            manager.log("Failed to start backend server. Exiting...", "ERROR", 'red')
            sys.exit(1)
        
        # Wait for backend to be ready
        time.sleep(2)
        
        frontend = manager.start_frontend()
        if not frontend or not frontend.process:
            manager.log("Failed to start frontend server. Exiting...", "ERROR", 'red')
            sys.exit(1)
        
        # Open browser after a short delay
        def open_browser():
            time.sleep(5)  # Give servers time to start
            try:
                webbrowser.open('http://localhost:3000')
            except Exception as e:
                manager.log(f"Failed to open browser: {str(e)}", "WARN", 'yellow')
        
        threading.Thread(target=open_browser, daemon=True).start()
        
        # Main monitoring loop
        last_health_check = 0
        
        while manager.running:
            try:
                # Process log messages
                while True:
                    try:
                        line = manager.log_queue.get_nowait()
                        print(line, end='', flush=True)
                    except Empty:
                        break
                
                # Periodically check process health
                current_time = time.time()
                if current_time - last_health_check > 30:  # Every 30 seconds
                    for proc_info in manager.processes:
                        if proc_info.state == ProcessState.RUNNING:
                            if not manager.check_process_health(proc_info):
                                manager.log(
                                    f"Health check failed for {proc_info.name}, restarting...",
                                    proc_info.name, 'yellow', 'WARN'
                                )
                                if proc_info.retry_count < proc_info.max_retries:
                                    proc_info.retry_count += 1
                                    manager.stop_process(proc_info)
                                    # Restart the process (implementation depends on your needs)
                                else:
                                    manager.log(
                                        f"Max retries reached for {proc_info.name}, giving up",
                                        proc_info.name, 'red', 'ERROR'
                                    )
                                    manager.running = False
                    last_health_check = current_time
                
                # Small sleep to prevent high CPU usage
                time.sleep(0.1)
                
            except Exception as e:
                manager.log(f"Unexpected error in main loop: {str(e)}", "ERROR", 'red')
                manager.running = False
    
    except Exception as e:
        manager.log(f"Fatal error: {str(e)}", "ERROR", 'red')
        import traceback
        manager.log(traceback.format_exc(), "ERROR", 'red')
    finally:
        manager.cleanup()

if __name__ == "__main__":
    print(f"\n{COLORS['green']}Starting On Their Footsteps Application...{COLORS['end']}")
    print(f"{COLORS['blue']}Backend: http://localhost:8000{COLORS['end']}")
    print(f"{COLORS['magenta']}Frontend: http://localhost:3000{COLORS['end']}")
    print(f"{COLORS['gray']}Press Ctrl+C to stop all servers{COLORS['end']}\n")
    
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"\n{COLORS['red']}Fatal error: {str(e)}{COLORS['end']}")
        sys.exit(1)