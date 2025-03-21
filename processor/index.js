const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');

const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Redis connection
const redisClient = redis.createClient({ url: process.env.REDIS_URI });
redisClient.on('connect', () => {
  console.log('Redis connected');
});
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Routes
app.get('/', (req, res) => {
  res.send('Processor Service');
});

app.listen(port, () => {
  console.log(`Processor service listening at http://localhost:${port}`);
});