const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const loopRoutes = require('./routes/loopRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loops', loopRoutes);

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  }
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
