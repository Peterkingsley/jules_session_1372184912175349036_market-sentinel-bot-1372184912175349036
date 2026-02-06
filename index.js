const http = require('http');

// Render requires a web service to bind to a port.
// Since this bot uses polling, we start a simple HTTP server for health checks.
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Market Sentinel Bot is running\n');
});

server.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);

  // Start the bot after the server is listening
  try {
    require('./src/bot.js');
  } catch (error) {
    console.error('Failed to start bot:', error);
  }
});
