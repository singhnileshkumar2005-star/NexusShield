import express from 'express';
import { nexusSecureExpress } from '../../packages/agent/src/index.js';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

// NexusSecure Security Agent Middleware
app.use(
  nexusSecureExpress({
    apiKey: process.env.NEXUS_API_KEY || 'nx_live_demo_site_alpha_key',
    hubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3000',
    siteName: 'Alpha Store (E-Commerce)',
    sensitiveAuthPaths: ['/api/auth/login', '/login', '/checkout'],
    maxFailedLogins: 4,
    failedLoginWindowSec: 30,
    enableHoneypots: true,
    enableSqliXssFilter: true,
    enableRateLimiting: true,
    maxRequestsPerSec: 30
  })
);

// Protected Website Business Logic
app.get('/', (req, res) => {
  res.json({
    site: 'Alpha Store (E-Commerce)',
    status: 'online',
    shield: 'Protected by NexusSecure Mesh',
    clientIp: req.ip || req.socket.remoteAddress,
    endpoints: [
      { path: '/', method: 'GET', description: 'Storefront Homepage' },
      { path: '/api/products', method: 'GET', description: 'Product Catalog' },
      { path: '/api/auth/login', method: 'POST', description: 'Customer Login (Protected)' }
    ]
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    products: [
      { id: 1, name: 'Cyberpunk Mechanical Keyboard', price: 149.99 },
      { id: 2, name: 'Ultra-Wide 4K Gaming Monitor', price: 499.00 },
      { id: 3, name: 'Noise-Canceling Wireless Headset', price: 199.50 }
    ]
  });
});

// Simulates user login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'admin' && password === 'correct_pass_123') {
    return res.json({ success: true, token: 'jwt_valid_session_token' });
  }
  // 401 triggers brute-force tracker in agent
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.listen(PORT, () => {
  console.log(`[Site Alpha - E-Commerce] Running on http://localhost:${PORT}`);
  console.log(`[Site Alpha] NexusSecure Shield is ACTIVE. Connected to Hub.`);
});
