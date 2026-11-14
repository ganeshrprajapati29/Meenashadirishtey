const http = require('http');
const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const initSockets = require('./sockets');
const { User } = require('./models');

(async () => {
  try {
    await connectDB();
    await User.updateMany({ isOnline: true }, { isOnline: false }); // reset presence after restart
    const server = http.createServer(app);
    initSockets(server);
    server.listen(port, () => console.log(`[msr-api] listening on :${port}`));

    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[msr-api] failed to start', err);
    process.exit(1);
  }
})();
