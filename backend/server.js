const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // For accepting structured JSON requests
app.use('/api/workflows', require('./routes/workflowRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Decision Engine running on port ${PORT}`);
});