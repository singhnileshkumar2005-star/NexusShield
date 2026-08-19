const express = require('express');
const threatShield = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_NAME = process.env.SITE_NAME || `Site-on-Port-${PORT}`;

// Enable trust proxy to correctly read IP addresses when behind proxies or tests
app.set('trust proxy', true);

// Parse JSON and URL-encoded bodies before WAF inspection
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach WAF Middleware
const waf = threatShield({ clientId: SITE_NAME });
app.use(waf);

// Application Routes
app.get('/', (req, res) => {
  res.json({
    message: `Welcome to ${SITE_NAME}!`,
    status: 'secure',
    timestamp: new Date().toISOString()
  });
});

app.get('/search', (req, res) => {
  const query = req.query.q || req.query.search || '';
  res.json({
    message: `Search results for: "${query}"`,
    site: SITE_NAME,
    results: []
  });
});

app.post('/comment', (req, res) => {
  res.json({
    message: `Comment received on ${SITE_NAME}`,
    site: SITE_NAME,
    received: req.body
  });
});

app.post('/login', (req, res) => {
  res.json({
    message: `Login successful on ${SITE_NAME}`,
    site: SITE_NAME,
    user: req.body.username || 'guest'
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 WAF Spoke (${SITE_NAME}) running on http://127.0.0.1:${PORT}`);
});
