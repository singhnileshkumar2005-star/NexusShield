import express from 'express';
import { nexusSecureExpress } from '../../packages/agent/src/index.js';

const app = express();
const PORT = process.env.PORT || 4002;

app.use(express.json());

// NexusSecure Security Agent Middleware
app.use(
  nexusSecureExpress({
    apiKey: process.env.NEXUS_API_KEY || 'nx_live_demo_site_beta_key',
    hubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3000',
    siteName: 'Beta SaaS Portal',
    sensitiveAuthPaths: ['/api/auth/login', '/login', '/admin'],
    maxFailedLogins: 4,
    failedLoginWindowSec: 30,
    enableHoneypots: true,
    enableSqliXssFilter: true,
    enableRateLimiting: true,
    maxRequestsPerSec: 30
  })
);

// Protected SaaS Web Application Endpoints
app.get('/', (req, res) => {
  res.json({
    site: 'Beta SaaS Portal (Enterprise Workflow)',
    status: 'online',
    shield: 'Protected by NexusSecure Mesh',
    clientIp: req.ip || req.socket.remoteAddress,
    endpoints: [
      { path: '/', method: 'GET', description: 'SaaS Landing Page' },
      { path: '/api/dashboard/metrics', method: 'GET', description: 'Internal Company Analytics' },
      { path: '/api/auth/login', method: 'POST', description: 'Enterprise SSO Login' }
    ]
  });
});

app.get('/api/dashboard/metrics', (req, res) => {
  res.json({
    activeUsers: 1420,
    monthlyRecurringRevenue: '$48,500',
    systemHealth: '100% operational'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'executive@nexus.io' && password === 'secure_pass_999') {
    return res.json({ success: true, token: 'jwt_admin_session_token' });
  }
  return res.status(401).json({ success: false, error: 'Invalid enterprise credentials' });
});

app.listen(PORT, () => {
  console.log(`[Site Beta - SaaS Portal] Running on http://localhost:${PORT}`);
  console.log(`[Site Beta] NexusSecure Shield is ACTIVE. Connected to Hub.`);
});
