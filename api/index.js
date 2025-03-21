const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Redis connection
const redis = new Redis('redis://redis:6379');
redis.on('connect', () => {
  console.log('Redis connected');
});
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

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

// Routes
app.get('/', (req, res) => {
  res.send('API Service');
});

// Route to handle POST requests for creating notifications
app.post('/api/v1/notifications', (req, res) => {
  const { type, recipient, message, campaign_id } = req.body;

  const notification = { type, recipient, message, campaign_id };
  redis.publish('notifications', JSON.stringify(notification));

  // Here you can add logic to handle the notification, e.g., save to MongoDB, send to Redis, etc.
  console.log(`Received notification: ${type}, ${recipient}, ${message}, ${campaign_id}`);

  res.status(201).send({ message: 'Notification created successfully' });
});

app.listen(port, () => {
  console.log(`API service listening at http://localhost:${port}`);
});