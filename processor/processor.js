const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");
const CircuitBreaker = require("opossum"); // Circuit Breaker

const app = express();
const redis = new Redis({ host: "redis", port: 6379 });

const MOCK_API_URL = "http://mock-api:1337/send";
const clients = []; // SSE Clients

// Server-Sent Events (SSE) for real-time dashboard updates
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);

  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

// Function to notify dashboard clients in real-time
function notifyClients(notification) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
}

// Exponential backoff function for retries
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendNotification(notification, attempt = 1) {
  try {
    const response = await axios.post(MOCK_API_URL, notification, { timeout: 5000 });
    notification.status = "sent";
  } catch (error) {
    if (attempt < 3) {
      console.log(`Retrying (${attempt}/3)...`);
      await wait(2000 * attempt); // Exponential backoff
      return sendNotification(notification, attempt + 1);
    }
    notification.status = "failed";
  }
  notifyClients(notification);
}

// Circuit Breaker to avoid excessive retries if `mock-api` fails continuously
const breaker = new CircuitBreaker(sendNotification, {
  timeout: 6000, // If the request takes longer than 6 seconds, it fails
  errorThresholdPercentage: 50, // If 50% of requests fail, the circuit opens
  resetTimeout: 10000, // Wait 10 seconds before trying again
});

breaker.fallback((notification) => {
  console.error("Circuit breaker triggered. Marking notification as failed:", notification);
  notification.status = "failed";
  notifyClients(notification);
});

// Process Redis Queue
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

      // Use Circuit Breaker for handling failures
      breaker.fire(notification);
    } catch (error) {
      console.error("Redis error:", error);
    }
  }
}

// Start Processor Service
app.listen(3001, () => {
  console.log("Processor Service running on port 3001");
  processQueue();
});
