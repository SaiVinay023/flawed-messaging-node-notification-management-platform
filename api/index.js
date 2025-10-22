const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Redis Connection
//const redis = new Redis(process.env.REDIS_URI);
const redis = new Redis({
  host: "redis", // Use the service name "redis"
  port: 6379,
});
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis connection error:', err));

// Validation Function
const isValidNotification = (data) => {
  const { type, recipient, message, campaign_id } = data;
  return (
    ["email", "sms"].includes(type.toLowerCase()) &&
    typeof recipient === "string" &&
    typeof message === "string" &&
    typeof campaign_id === "string" &&
    uuidValidate(campaign_id) // Validate campaign_id as a UUID
  );
};

// Health Check Route
app.get("/api/v1/notifications/queue", async (req, res) => {
  try {
    const notifications = await redis.lrange("notification_queue", 0, -1);
    const parsedNotifications = notifications.map(JSON.parse);
    res.json({ notifications: parsedNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST: Create a Notification
app.post('/api/v1/notifications', async (req, res) => {
  try {
    const { type, recipient, message, campaign_id } = req.body;

    // Validate the request
    if (!isValidNotification(req.body)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Generate unique ID & store in Redis queue
    const notification = {
      id: uuidv4(),
      type,
      recipient,
      message,
      campaign_id,
      status: "queued",
      createdAt: new Date().toISOString()
    };

    const result = await redis.rpush('notification_queue', JSON.stringify(notification));

    console.log(`Notification queued: ${JSON.stringify(notification)}`);
    res.status(202).json({ message: 'Notification created successfully', notification });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Service running at http://localhost:${PORT}`);
});