import threading
from datetime import datetime

class Logger:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(Logger, cls).__new__(cls, *args, **kwargs)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._logs = []

    def log(self, message: str) -> None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self._logs.append({
            "timestamp": timestamp,
            "message": message
        })
        print(f"[LOGGER] [{timestamp}] {message}")

    def get_logs(self) -> list:
        return self._logs

    def clear(self) -> None:
        self._logs.clear()
