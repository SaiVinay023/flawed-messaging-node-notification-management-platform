const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");
const CircuitBreaker = require("opossum");

const app = express();
const redis = new Redis({ host: "redis", port: 6379 });
const clients = [];

const MOCK_API_URL = "http://mock-api:1337/send";

// SSE Endpoint for Dashboard
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  clients.push(res);
  
  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

async function notifyClients(notification) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
}

// Exponential backoff function
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendNotification(notification) {
  try {
    const response = await axios.post(MOCK_API_URL, notification, { timeout: 5000 });
    notification.status = "sent";
  } catch (error) {
    notification.status = "failed";
  }
  notifyClients(notification);
}

// Process Redis Queue
async function processQueue() {
  while (true) {
    const data = await redis.rpop("notification_queue");
    if (!data) {
      await wait(3000);
      continue;
    }

    const notification = JSON.parse(data);
    notification.status = "queued";
    notifyClients(notification);
    await sendNotification(notification);
  }
}

app.listen(3001, () => {
  console.log("Processor Service running on port 3001");
  processQueue();
});
