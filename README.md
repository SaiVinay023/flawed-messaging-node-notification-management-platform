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
# Notification Management Platform

## 📌 Project Overview
This project is a **Notification Management Platform** that allows users to send email and SMS notifications. The system is built using **Node.js (Express.js), Redis, MongoDB, and React** and is deployed using **Docker Compose**.

### 📦 **Components**
1. **Notification API (Express.js)** - Handles notification requests and queues them in Redis.
2. **Processor Service (Node.js Worker)** - Reads from the Redis queue and sends notifications.
3. **Mock API (Simulated External Service)** - Simulates an external notification provider.
4. **Dashboard (React + Nginx)** - Provides real-time monitoring of notification status.
5. **MongoDB** - Stores notification data.
6. **Redis** - Manages the notification queue.

---

## 🚀 **Setup & Execution Steps**

### **1️⃣ Clone Repository & Set Up Environment**
```sh
git clone <repo-url>
cd flawed-messaging-node
```

### **2️⃣ Start All Services Using Docker Compose**
```sh
docker-compose up --build -d
```

### **3️⃣ Verify Running Containers**
```sh
docker ps
```
Ensure the following services are running:
- **API (Port 3000)**
- **Processor (Port 3001)**
- **Mock API (Port 1337)**
- **Dashboard (Port 80)**
- **Redis (Port 6379)**
- **MongoDB (Port 27017)**

### **4️⃣ Test API Endpoints**
- **Send Notification Request**
```sh
curl -X POST "http://localhost:3000/api/v1/notifications" \
     -H "Content-Type: application/json" \
     -d '{
           "type": "email",
           "recipient": "user@example.com",
           "message": "Hello, testing notification!",
           "campaign_id": "123e4567-e89b-12d3-a456-426614174000"
         }'
```

- **Check Redis Queue**
```sh
docker exec -it flawed-messaging-node_redis_1 redis-cli
LRANGE notification_queue 0 -1
```

- **Listen for Real-time Notification Processing**
```sh
curl -N http://localhost:3001/events
```

- **Test Mock API**
```sh
curl -X POST "http://localhost:1337/send" \
     -H "Content-Type: application/json" \
     -d '{
           "type": "email",
           "recipient": "user@example.com",
           "message": "Testing Mock API"
         }'
```

- **View Dashboard**
Visit: **[http://localhost](http://localhost)**

---

## ⚠️ **Errors & Fixes**

### **1️⃣ API Works on Direct Port but Fails via Nginx (`502 Bad Gateway`)**
**Fix:**
- Added correct API upstream in `nginx.conf`:
```nginx
location /api/ {
    rewrite ^/api(/.*)$ $1 break;
    proxy_pass http://api:3000/;
    proxy_http_version 1.1;
}
```
- Restart Nginx:
```sh
docker-compose restart dashboard
```

### **2️⃣ Mock API is "Unhealthy" (`Cannot find module 'cors'`)**
**Fix:**
```sh
docker exec -it flawed-messaging-node_mock-api sh
cd /app
npm install
exit
docker-compose restart mock-api
```

### **3️⃣ Redis Queue is Empty Even After Sending Notifications**
**Fix:**
- Used `RPUSH` instead of `PUBLISH` to persist messages:
```js
await redis.rpush('notification_queue', JSON.stringify(notification));
```

### **4️⃣ Dashboard Shows `Cannot GET /`**
**Fix:**
- Rebuilt React Dashboard:
```sh
cd dashboard
npm install
npm run build
docker-compose up --build dashboard -d
```

---

## 🏗 **Technical & Architectural Decisions**

### **✅ API Design & Validation**
- Used **Express.js** for the API.
- **Joi/Zod-based validation** for request payloads.

### **✅ Asynchronous Processing with Redis**
- Used **Redis as a message queue** (FIFO ordering).
- Implemented **Blocking List Pop (`BLPOP`)** to handle real-time message processing.

### **✅ Fault Tolerance & Resilience**
- **Retry Logic with Exponential Backoff** for failed notifications.
- **Circuit Breaker (opossum)** to prevent overloading external services.

### **✅ Scalable Microservices**
- Used **Docker Compose** for service orchestration.
- Separated API, Processor, and Dashboard into independent containers.

### **✅ WebSockets for Real-time Updates**
- Implemented **Server-Sent Events (SSE)** to stream real-time notifications.

---

## 🔥 **Performance Testing & Load Handling**

### **1️⃣ Load Testing with Artillery**
**Tested 240 requests per minute:**
```sh
npm install -g artillery
```
**Create `load-test.yml`**:
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 4
scenarios:
  - flow:
      - post:
          url: "/api/v1/notifications"
          json:
            type: "email"
            recipient: "user@example.com"
            message: "Test Load Notification"
            campaign_id: "123e4567-e89b-12d3-a456-426614174000"
```
**Run Test:**
```sh
artillery run load-test.yml
```

✅ **Passed Load Test: System handled 240 requests/minute!** 🎯

---
## 🏁 **Is Anything Missing?**

**Implement MongoDB storage for notifications**
**Secure API with JWT authentication**
**Improve Logging & Monitoring (Winston + Prometheus)**

## 🔮 **Future Improvements/ is anything missing**
- **Add a Frontend Authentication System**.
- **Implement Kafka Instead of Redis for Scaling**.
- **Optimize MongoDB Queries for Faster Reads/Writes**.
- **Implement Monitoring Tools (Prometheus + Grafana)**.

---

## 🎯 **Final Checklist Before Submission**
✅ **Mock API (`mock-api`) is Working**  
✅ **Processor (`processor`) Successfully Sends Notifications**  
✅ **API (`api`) is Receiving Requests & Storing in Redis**  
✅ **Dashboard (`dashboard`) is Displaying Notifications**  
✅ **Load Testing Confirms 240 Requests per Minute**  
✅ **Documentation (README.md + SOLUTION.md) is Complete**  

---


