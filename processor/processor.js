const axios = require("axios");
const Redis = require("ioredis");
const CircuitBreaker = require("opossum");

const redis = new Redis({ host: "redis", port: 6379 });
const MOCK_API_URL = "http://mock-api:1337/send";

// Exponential backoff function
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendNotification(notification) {
  try {
    const response = await axios.post(MOCK_API_URL, notification, { timeout: 5000 });
    console.log(`Notification ${notification.id} sent:`, response.data);
    return response.data;
  } catch (error) {
    if (error.response && [429, 500].includes(error.response.status)) {
      console.warn(`Temporary failure for ${notification.id}: ${error.message}`);
      throw error;
    }
    console.error(`Failed to send notification ${notification.id}:`, error.message);
    return null;
  }
}

// Circuit breaker config
const breaker = new CircuitBreaker(sendNotification, {
  timeout: 5000, // API request timeout
  errorThresholdPercentage: 50, // If 50% of requests fail, trip the breaker
  resetTimeout: 10000, // Wait 10s before retrying
});

async function processQueue() {
  while (true) {
    try {
      const data = await redis.rpop("notification_queue");
      if (!data) {
        await wait(3000); // Wait before checking again
        continue;
      }

      const notification = JSON.parse(data);
      console.log("Processing:", notification);

      await breaker.fire(notification).catch(async (err) => {
        console.error(`Error processing ${notification.id}, retrying...`);
        for (let i = 1; i <= 3; i++) {
          await wait(i * 2000); // Exponential backoff (2s, 4s, 6s)
          try {
            await sendNotification(notification);
            console.log(`Notification ${notification.id} sent on retry ${i}`);
            break;
          } catch (retryError) {
            console.error(`Retry ${i} failed for ${notification.id}:`, retryError.message);
          }
        }
      });

    } catch (error) {
      console.error("Processor error:", error.message);
    }
  }
}

// Start processing notifications
processQueue();
