const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }
  try {
    cachedConnection = await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database');
    return cachedConnection;
  } catch (error) {
    console.error('Error connecting to Database:', error);
    process.exit(1);
  }
}

module.exports = connectDB;