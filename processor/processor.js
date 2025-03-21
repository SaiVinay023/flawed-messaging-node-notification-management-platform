const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");

const app = express();
const redis = new Redis({ host: "redis", port: 6379 });

const MOCK_API_URL = "http://mock-api:1337/send";

async function processQueue() {
  while (true) {
    try {
      const data = await redis.blpop("notification_queue", 0); // Blocking pop to process notifications in real-time
      
      if (!data) {
        console.log("No notifications to process...");
        continue;
      }

      const notification = JSON.parse(data[1]);
      console.log(`Processing notification: ${JSON.stringify(notification)}`);

      try {
        const response = await axios.post(MOCK_API_URL, notification, { timeout: 5000 });
        notification.status = "sent";
      } catch (error) {
        notification.status = "failed";
        console.error("Error sending notification:", error.message);
      }

      console.log(`Notification processed: ${JSON.stringify(notification)}`);
    } catch (error) {
      console.error("Redis error:", error);
    }
  }
}

app.listen(3001, () => {
  console.log("Processor Service running on port 3001");
  processQueue();
});
