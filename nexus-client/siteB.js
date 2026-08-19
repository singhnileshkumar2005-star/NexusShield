const express = require('express');
const threatShield = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);

// Parse JSON and Form Bodies before WAF inspection
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach WAF ThreatShield
app.use(threatShield({ clientId: 'client_B' }));

app.get('/', (req, res) => {
  res.json({
    status: 'secure',
    site: 'Site B',
    message: 'Welcome to Protected Site B',
    timestamp: new Date().toISOString()
  });
});

app.get('/search', (req, res) => {
  res.json({
    site: 'Site B',
    query: req.query.q || req.query.search || '',
    results: []
  });
});

app.post('/comment', (req, res) => {
  res.json({
    site: 'Site B',
    status: 'success',
    received_comment: req.body
  });
});

app.post('/login', (req, res) => {
  res.json({
    site: 'Site B',
    status: 'success',
    user: req.body.username || 'guest'
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Site B] Protected server listening on http://127.0.0.1:${PORT}`);
});
