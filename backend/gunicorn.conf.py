# Gunicorn configuration file for 17 @ Peppertree

import os
import multiprocessing

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = min(multiprocessing.cpu_count() * 2 + 1, 8)
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50

# Restart workers after this many requests, with up to 50 random jitter
preload_app = True

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "peppertree-backend"

# Server mechanics
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# SSL (handled by nginx in production)
keyfile = None
certfile = None

# Environment variables
raw_env = [
    f"DATABASE_URL={os.getenv('DATABASE_URL', '')}",
    f"SECRET_KEY={os.getenv('SECRET_KEY', '')}",
    f"FLASK_ENV={os.getenv('FLASK_ENV', 'production')}",
    f"MAIL_SERVER={os.getenv('MAIL_SERVER', '')}",
    f"MAIL_PORT={os.getenv('MAIL_PORT', '587')}",
    f"MAIL_USERNAME={os.getenv('MAIL_USERNAME', '')}",
    f"MAIL_PASSWORD={os.getenv('MAIL_PASSWORD', '')}",
    f"MAIL_DEFAULT_SENDER={os.getenv('MAIL_DEFAULT_SENDER', '')}",
    f"OWNER_EMAIL={os.getenv('OWNER_EMAIL', '')}",
]