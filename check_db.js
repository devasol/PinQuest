const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const checkDb = async () => {
  try {
    const db = process.env.MONGODB_URL || "mongodb://localhost:27017/pin_quest";
    console.log('Connecting to:', db.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(db);
    console.log('Connected!');
    
    const count = await mongoose.connection.db.collection('posts').countDocuments();
    console.log('Total posts:', count);
    
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log('Total users:', usersCount);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkDb();
