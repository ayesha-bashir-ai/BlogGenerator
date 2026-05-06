const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes  = require('./routes/auth.routes');
const blogRoutes  = require('./routes/blog.routes');
const userRoutes  = require('./routes/user.routes');
const aiRoutes    = require('./routes/ai.routes');
const statsRoutes = require('./routes/stats.routes');
const trendsRoutes = require('./routes/trends.routes');

const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express(); // ✅ APP CREATED HERE (IMPORTANT)

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.get('/api/v1/health', (req,res) => res.json({
  success:true,
  status:'healthy',
  service:'AI Blogger API',
  time:new Date().toISOString()
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/trends', trendsRoutes); // ✅ FIXED POSITION

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;