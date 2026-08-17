const express = require('express');
const threatShield = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);
app.use(threatShield);

app.get('/', (req, res) => {
  res.send("Welcome to Protected Site B");
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Site B] Protected server listening on http://127.0.0.1:${PORT}`);
});
