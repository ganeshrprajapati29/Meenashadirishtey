const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { clientUrls, isProd } = require('./config/env');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/error');
const { UPLOAD_ROOT } = require('./middleware/upload');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => {
    // allow mobile apps (no origin), configured web origins, and local dev
    if (!origin || clientUrls.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitize);
app.use(morgan(isProd ? 'combined' : 'dev'));

app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '30d', immutable: true }));

app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ success: true, service: 'msr-api', time: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/interests', require('./routes/interests'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/public', require('./routes/public'));
app.use('/api/admin', require('./routes/admin'));

// Optionally serve the built website from the same server (useful without nginx)
const webDist = path.resolve(__dirname, '../../web/dist');
if (process.env.SERVE_WEB === 'true') {
  app.use(express.static(webDist, { maxAge: '1h' }));
  app.get(/^\/(?!api|uploads|socket\.io).*/, (req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
