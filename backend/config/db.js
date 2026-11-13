const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
    try{
        console.log("Connecting to MongoDB...", process.env.MONGODB_URL);
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
module.exports = connectDB;