require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

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

// Sample Orders
const sampleOrders = [
  {
    orderNumber: 'ORD-001',
    user: null, // Will be populated after user creation
    items: [],
    subtotal: 0,
    taxAmount: 0,
    shippingCost: 500,
    discountAmount: 0,
    totalAmount: 0,
    currency: 'PKR',
    shippingAddress: {},
    billingAddress: {},
    paymentMethod: 'credit_card',
    paymentStatus: 'completed',
    orderStatus: 'delivered',
    shippedDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
    deliveredDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    notes: 'Handle with care'
  },
  {
    orderNumber: 'ORD-002',
    user: null, // Will be populated after user creation
    items: [],
    subtotal: 0,
    taxAmount: 0,
    shippingCost: 500,
    discountAmount: 0,
    totalAmount: 0,
    currency: 'PKR',
    shippingAddress: {},
    billingAddress: {},
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'completed',
    orderStatus: 'shipped',
    shippedDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    notes: 'Call before delivery'
  },
  {
    orderNumber: 'ORD-003',
    user: null, // Will be populated after user creation
    items: [],
    subtotal: 0,
    taxAmount: 0,
    shippingCost: 500,
    discountAmount: 0,
    totalAmount: 0,
    currency: 'PKR',
    shippingAddress: {},
    billingAddress: {},
    paymentMethod: 'paypal',
    paymentStatus: 'pending',
    orderStatus: 'processing',
    notes: 'Special packaging required'
  },
  {
    orderNumber: 'ORD-004',
    user: null, // Will be populated after user creation
    items: [],
    subtotal: 0,
    taxAmount: 0,
    shippingCost: 500,
    discountAmount: 0,
    totalAmount: 0,
    currency: 'PKR',
    shippingAddress: {},
    billingAddress: {},
    paymentMethod: 'credit_card',
    paymentStatus: 'completed',
    orderStatus: 'cancelled',
    notes: 'Customer cancelled order'
  },
  {
    orderNumber: 'ORD-005',
    user: null, // Will be populated after user creation
    items: [],
    subtotal: 0,
    taxAmount: 0,
    shippingCost: 500,
    discountAmount: 0,
    totalAmount: 0,
    currency: 'PKR',
    shippingAddress: {},
    billingAddress: {},
    paymentMethod: 'debit_card',
    paymentStatus: 'completed',
    orderStatus: 'delivered',
    shippedDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
    deliveredDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    notes: ''
  }
];

const seedOrders = async () => {
  try {
    await connectDB();
    
    // Get existing users and products
    const users = await User.find({});
    const products = await Product.find({});
    
    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      process.exit(1);
    }
    
    if (products.length === 0) {
      console.log('No products found. Please seed products first.');
      process.exit(1);
    }
    
    // Clear existing orders
    console.log('Clearing existing orders...');
    await Order.deleteMany({});
    
    // Create orders with user and product references
    console.log('Creating orders...');
    
    // Prepare sample orders with actual user and product data
    const createdOrders = [];
    
    for (let i = 0; i < sampleOrders.length; i++) {
      const orderTemplate = sampleOrders[i];
      const user = users[i % users.length]; // Cycle through users
      
      // Select random products for the order
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      const items = [];
      let subtotal = 0;
      
      for (let j = 0; j < numItems; j++) {
        const productIndex = (i + j) % products.length;
        const product = products[productIndex];
        const variant = product.variants[0]; // Use first variant
        
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        const price = variant.salePrice || variant.price; // Use sale price if available
        const itemSubtotal = price * quantity;
        
        items.push({
          product: product._id,
          variant: variant._id,
          quantity: quantity,
          price: price,
          subtotal: itemSubtotal
        });
        
        subtotal += itemSubtotal;
      }
      
      // Calculate totals
      const taxRate = 0.1; // 10% tax
      const taxAmount = subtotal * taxRate;
      const discountAmount = subtotal > 50000 ? subtotal * 0.05 : 0; // 5% discount for orders > 50k
      const totalAmount = subtotal + taxAmount + orderTemplate.shippingCost - discountAmount;
      
      // Use user's shipping address or create a default one
      const shippingAddr = user.shippingAddress || {
        street: 'Default Street',
        city: 'Default City',
        state: 'Default State',
        zipCode: '00000',
        country: 'Pakistan',
        phone: user.phone || '+92000000000'
      };
      
      const orderData = {
        ...orderTemplate,
        user: user._id,
        items: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        shippingAddress: shippingAddr,
        billingAddress: shippingAddr // Use same as shipping for demo
      };
      
      const createdOrder = await Order.create(orderData);
      createdOrders.push(createdOrder);
    }
    
    console.log('Orders seeded successfully!');
    console.log(`${createdOrders.length} orders created`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding orders:', error);
    process.exit(1);
  }
};

seedOrders();