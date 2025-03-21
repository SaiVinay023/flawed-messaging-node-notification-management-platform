const express = require("express");
const Redis = require("ioredis");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = process.env.PORT || 3000;

// Connect to Redis
const redis = new Redis({ host: "redis", port: 6379 });

// Middleware
app.use(express.json());

// Validation function
const isValidNotification = (data) => {
  const { type, recipient, message, campaign_id } = data;
  return (
    ["email", "SMS"].includes(type) &&
    typeof recipient === "string" &&
    typeof message === "string" &&
    typeof campaign_id === "string"
  );
};

// POST endpoint
app.post("/api/v1/notifications", async (req, res) => {
  const notification = req.body;

  if (!isValidNotification(notification)) {
    return res.status(400).json({ error: "Invalid notification format" });
  }

  const jobId = uuidv4();
  await redis.lpush("notification_queue", JSON.stringify({ jobId, ...notification }));

  res.status(202).json({ success: true, jobId });
});

// Start server
app.listen(port, () => {
  console.log(`API Service running on port ${port}`);
});
