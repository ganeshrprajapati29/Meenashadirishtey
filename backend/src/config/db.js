const mongoose = require('mongoose');
const { mongoUri } = require('./env');

mongoose.set('strictQuery', true);

async function connectDB() {
  await mongoose.connect(mongoUri, { autoIndex: true });
  console.log(`[db] connected → ${mongoose.connection.name}`);
}

module.exports = connectDB;
