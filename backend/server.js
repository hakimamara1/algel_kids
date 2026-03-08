require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const productRoutes = require('./routes/productRoutes');
// const redisClient = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://192.168.179.237:5173', 'https://algel-kids.vercel.app', 'https://algel-kids-git-checkout-hakimamara20242023-6761s-projects.vercel.app', 'https://algel-kids-git-main-hakimamara20242023-6761s-projects.vercel.app', 'http://localhost:4174'],
  credentials: true
}));

app.use(cookieParser());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// // Redis Connection
// redisClient.connect()
//   .catch((err) => console.error('Redis Connection Error:', err));

const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Routes
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM signal received: closing HTTP server and Redis connection');
//   await redisClient.disconnect();
//   server.close(() => {
//     console.log('HTTP server closed');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', async () => {
//   console.log('\nSIGINT signal received: closing HTTP server and Redis connection');
//   await redisClient.disconnect();
//   server.close(() => {
//     console.log('HTTP server closed');
//     process.exit(0);
//   });
// });
