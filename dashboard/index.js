const express = require('express');

const app = express();
const port = 80;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Dashboard Service');
});

app.listen(port, () => {
  console.log(`Dashboard service listening at http://localhost:${port}`);
});