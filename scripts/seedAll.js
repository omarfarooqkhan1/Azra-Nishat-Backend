require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/azra-nishat-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const seedAll = async () => {
  try {
    await connectDB();
    
    // Import seed functions
    const seedCategories = require('./seedCategories');
    const seedUsers = require('./seedUsers');
    const seedProducts = require('./seedProducts');
    const seedOrders = require('./seedOrders');
    
    console.log('Starting full database seeding...');
    
    // Note: Since these are separate Node.js scripts, we need to execute them differently
    // We'll just log the instructions here
    console.log('\nTo seed the database, run these commands in sequence:');
    console.log('1. node scripts/seedCategories.js');
    console.log('2. node scripts/seedUsers.js');
    console.log('3. node scripts/seedProducts.js');
    console.log('4. node scripts/seedOrders.js');
    
    console.log('\nOr run the original seed script:');
    console.log('node scripts/seedDatabase.js');
    
    process.exit(0);
  } catch (error) {
    console.error('Error in seedAll:', error);
    process.exit(1);
  }
};

// For this file, we'll just provide instructions
console.log('This script provides instructions for seeding the database.');
console.log('Run the individual seed scripts in the correct order:');
console.log('1. node scripts/seedCategories.js');
console.log('2. node scripts/seedUsers.js');
console.log('3. node scripts/seedProducts.js');
console.log('4. node scripts/seedOrders.js');