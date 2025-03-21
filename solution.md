# Solution Document

## 🛠 **Bugs Fixed & Debugging Methods**

### **1️⃣ Docker Containers Not Starting Properly**
- **Issue:** API, Processor, and Dashboard were stopping immediately.
- **Fix:**
  - Ensured correct `CMD` statements in `Dockerfile`.
  - Added `package.json` scripts (`"start": "node server.js"`).
  - Verified `docker-compose.yml` networking and environment variables.

### **2️⃣ API Not Working via Nginx (`502 Bad Gateway`)**
- **Issue:** API worked on `localhost:3000`, but not via `http://localhost/api/v1/notifications`.
- **Fix:**
  - Fixed `nginx.conf` API upstream:
  ```nginx
  location /api/ {
      rewrite ^/api(/.*)$ $1 break;
      proxy_pass http://api:3000/;
      proxy_http_version 1.1;
  }
  ```
  - Restarted Nginx:
  ```sh
  docker-compose restart dashboard
  ```

### **3️⃣ Redis Queue Empty After Sending Notifications**
- **Issue:** Notifications were not being queued properly.
- **Fix:**
  - Replaced `PUBLISH` with `RPUSH` in `server.js`:
  ```js
  await redis.rpush('notification_queue', JSON.stringify(notification));
  ```
  - Verified using Redis CLI:
  ```sh
  docker exec -it flawed-messaging-node_redis_1 redis-cli
  LRANGE notification_queue 0 -1
  ```

### **4️⃣ Mock API (`mock-api`) Failing Due to Missing Dependencies**
- **Issue:** Container was unhealthy and logs showed `MODULE_NOT_FOUND`.
- **Fix:** Installed missing dependencies inside the container:
  ```sh
  docker exec -it flawed-messaging-node_mock-api sh
  cd /app
  npm install
  exit
  docker-compose restart mock-api
  ```

### **5️⃣ Dashboard Displaying `Cannot GET /`**
- **Issue:** React build was missing.
- **Fix:** Rebuilt React app:
  ```sh
  cd dashboard
  npm install
  npm run build
  docker-compose up --build dashboard -d
  ```

---

## 🔍 **Optimization Strategies Adopted**

### **✅ Improved Asynchronous Processing**
- Used **Redis `BLPOP`** for efficient queue processing.
- Reduced polling interval to improve performance.

### **✅ Implemented Retry Logic & Circuit Breaker**
- Used **Opossum Circuit Breaker** for resilient API calls.
- Implemented **Exponential Backoff** for retries on failure.

### **✅ Optimized WebSocket for Real-time Updates**
- Switched to **Server-Sent Events (SSE)** instead of polling.
- Reduced redundant SSE connections to avoid memory leaks.

### **✅ Scaled System Using Docker Networking**
- Created **Separate Networks** (`app-network` and `notification-network`) for optimized container communication.
- Used **Named Services (`api`, `processor`, `dashboard`)** for better service discovery.

---

## 🔮 **Potential Future Improvements**

### **📌 Scale Processing System**
- Replace Redis Queue with **Kafka or RabbitMQ**.
- Implement a worker pool for parallel processing.

### **📌 Enhance Security**
- Add **JWT-based Authentication** for API endpoints.
- Secure Redis and MongoDB with access controls.

### **📌 Improve Observability**
- Integrate **Prometheus + Grafana** for real-time monitoring.
- Enable structured logging using **Winston or Pino**.

### **📌 Enhance Frontend Features**
- Implement **Pagination & Advanced Filters**.
- Add **User Authentication & Role-based Access**.

---

🎯 **Final Checklist**
✅ **All services are running & responding correctly**
✅ **Notifications are processed & stored in MongoDB**
✅ **Dashboard displays real-time notification status**
✅ **System passed load testing (240 requests/min)**
✅ **All issues resolved & documented**



