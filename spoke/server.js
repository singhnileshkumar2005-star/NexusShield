const express = require('express');
const { createWafInstance } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_NAME = process.env.SITE_NAME || `Site-on-Port-${PORT}`;

// Enable trust proxy to correctly read IP addresses when behind proxies or tests
app.set('trust proxy', true);

// Parse JSON bodies
app.use(express.json());

// Attach WAF Middleware
const waf = createWafInstance();
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
  const query = req.query.q || '';
  res.json({
    message: `Search results for: "${query}"`,
    site: SITE_NAME,
    results: []
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 WAF Spoke (${SITE_NAME}) running on http://127.0.0.1:${PORT}`);
});
