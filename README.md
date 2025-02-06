### 📁 Repository Structure Overview

```
.
├── api
│   └── Dockerfile                # To build the Notification Collector API service (Express.js)
├── dashboard
│   ├── Dockerfile                # To build the React dashboard for monitoring notifications
│   └── nginx.conf                # NGINX configuration for serving the dashboard
├── docker-compose.yml            # Docker orchestration file to manage all services
├── mock-api
│   ├── Dockerfile                # Pre-built mock external service simulating failures and timeouts
│   ├── combined.log              # Logs for debugging
│   ├── error.log                 # Error logs
│   ├── package-lock.json
│   ├── package.json
│   └── server.js                 # Mock API logic (DO NOT modify)
└── processor
    └── Dockerfile                # To build the Processor service that handles notification dispatch
```
