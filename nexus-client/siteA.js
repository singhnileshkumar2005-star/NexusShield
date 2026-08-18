const express = require('express');
const threatShield = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);
app.use(threatShield({ clientId: 'client_A' }));

app.get('/', (req, res) => {
  res.send("Welcome to Protected Site A");
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Site A] Protected server listening on http://127.0.0.1:${PORT}`);
});
