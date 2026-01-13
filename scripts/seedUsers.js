require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

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

// Sample Users
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+1234567890',
    shippingAddress: {
      street: '123 Main St',
      city: 'Karachi',
      state: 'Sindh',
      zipCode: '75650',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+1234567891',
    shippingAddress: {
      street: '456 Oak St',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '54000',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567899',
    shippingAddress: {
      street: '789 Admin St',
      city: 'Islamabad',
      state: 'ICT',
      zipCode: '44000',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+1234567892',
    shippingAddress: {
      street: '321 Pine St',
      city: 'Rawalpindi',
      state: 'Punjab',
      zipCode: '46000',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Mohammed',
    lastName: 'Ahmed',
    email: 'mohammed@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+1234567893',
    shippingAddress: {
      street: '654 Cedar St',
      city: 'Multan',
      state: 'Punjab',
      zipCode: '60000',
      country: 'Pakistan'
    },
    isActive: true,
    isVerified: true
  }
];

const seedUsers = async () => {
  try {
    await connectDB();
    
    // Clear existing users
    console.log('Clearing existing users...');
    await User.deleteMany({});
    
    // Hash passwords for all users
    console.log('Hashing passwords...');
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (userData) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        return {
          ...userData,
          password: hashedPassword
        };
      })
    );
    
    // Create users
    console.log('Creating users...');
    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    
    console.log('Users seeded successfully!');
    console.log(`${createdUsers.length} users created`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();