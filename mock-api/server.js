const express = require('express');
const app = express();
const port = 1337;

app.get('/', (req, res) => {
  res.send('Mock API Service');
});

app.listen(port, () => {
  console.log(`Mock API running on port ${port}`);
});