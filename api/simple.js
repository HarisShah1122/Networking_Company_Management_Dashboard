const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Simple test route
app.post('/api/auth/login', (req, res) => {
  res.status(200).json({ 
    message: 'Login endpoint working',
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/register', (req, res) => {
  res.status(200).json({ 
    message: 'Register endpoint working',
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Catch all for other routes
app.get('/api/*', (req, res) => {
  res.status(200).json({ 
    message: 'API is working',
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/*', (req, res) => {
  res.status(200).json({ 
    message: 'API POST working',
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

module.exports = (req, res) => {
  app(req, res);
};
