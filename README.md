# Azra Nishat Ecommerce Store

A complete ecommerce platform for selling jewellery items, built with Node.js, Express, and MongoDB.

## Features

- **User Management**: Registration, login, profile management
- **Product Catalog**: Comprehensive product management with variants, categories, and attributes
- **Shopping Cart**: Full-featured cart with add/update/remove functionality
- **Wishlist**: Save favorite products for later
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Payment Processing**: Support for multiple payment methods (Stripe, PayPal, COD, Bank Transfer)
- **Reviews & Ratings**: Customer reviews and ratings system
- **Search & Filter**: Advanced product search and filtering capabilities
- **Admin Dashboard**: Analytics and management tools for administrators
- **Inventory Management**: Track and manage product stock levels

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) with Passport.js
- **Validation**: Zod schema validation
- **Payment**: Stripe API integration
- **Caching**: Redis for caching and session management
- **Security**: Helmet, XSS protection, HPP, rate limiting
- **File Upload**: Multer (with Cloudinary integration)
- **Environment**: dotenv

## Docker Setup

The application can be run using Docker containers. We provide services for the application, MongoDB, and Redis.

### Prerequisites
- Docker installed on your machine
- Docker Compose installed

### Running with Docker

1. Build and start all services:
```bash
npm run docker:up
# or
docker-compose up -d
```

2. The application will be available at `http://localhost:5000`
3. MongoDB will be available at `mongodb://localhost:27017`
4. Redis will be available at `redis://localhost:6379`

5. To stop all services:
```bash
npm run docker:down
# or
docker-compose down
```

6. To build only the application container:
```bash
npm run docker:build
# or
docker build -t azra-nishat-ecommerce .
```

### Docker Services

- **app**: The main application service running on port 5000
- **mongodb**: MongoDB service for data persistence on port 27017
- **redis**: Redis service for caching and session management on port 6379

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd azra-nishat-ecommerce
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following environment variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/azra-nishat-ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
MAIL_HOST=smtp.your-email-provider.com
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
CORS_ORIGIN=http://localhost:3000
```

4. Run the application:
```bash
npm run dev
```

The server will start on `http://localhost:5000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Users
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user by ID (admin only)
- `DELETE /api/users/:id` - Delete user by ID (admin only)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create new product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/new` - Get new products
- `GET /api/products/sale` - Get products on sale

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/slug/:slug` - Get category by slug
- `POST /api/categories` - Create new category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)
- `GET /api/categories/:id/subcategories` - Get subcategories
- `GET /api/categories/tree` - Get hierarchical category tree

### Cart
- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart/items` - Add item to cart (requires auth)
- `PUT /api/cart/items/:itemId` - Update cart item (requires auth)
- `DELETE /api/cart/items/:itemId` - Remove item from cart (requires auth)
- `DELETE /api/cart` - Clear entire cart (requires auth)
- `GET /api/cart/summary` - Get cart summary (requires auth)

### Wishlist
- `GET /api/wishlist` - Get user's wishlist (requires auth)
- `POST /api/wishlist/items` - Add item to wishlist (requires auth)
- `DELETE /api/wishlist/items/:itemId` - Remove item from wishlist (requires auth)
- `DELETE /api/wishlist/products/:productId` - Remove product from wishlist (requires auth)
- `GET /api/wishlist/check/:productId` - Check if product is in wishlist (requires auth)
- `GET /api/wishlist/count` - Get wishlist count (requires auth)

### Orders
- `GET /api/orders` - Get all orders (admin only)
- `GET /api/orders/:id` - Get order by ID (requires auth)
- `POST /api/orders` - Create new order (requires auth)
- `PUT /api/orders/:id` - Update order (admin only)
- `PUT /api/orders/:id/cancel` - Cancel order (requires auth)
- `DELETE /api/orders/:id` - Delete order (admin only)
- `GET /api/orders/history` - Get user's order history (requires auth)

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `POST /api/reviews` - Create review (requires auth)
- `PUT /api/reviews/:id` - Update review (requires auth)
- `DELETE /api/reviews/:id` - Delete review (requires auth)
- `POST /api/reviews/:id/helpful` - Mark review as helpful (requires auth)
- `POST /api/reviews/:id/report` - Report review (requires auth)

### Payments
- `POST /api/payments/stripe` - Process Stripe payment (requires auth)
- `POST /api/payments/cod` - Process Cash on Delivery (requires auth)
- `POST /api/payments/bank-transfer` - Process Bank Transfer (requires auth)
- `POST /api/payments/paypal` - Process PayPal payment (requires auth)
- `GET /api/payments/verify/:paymentId` - Verify payment (requires auth)
- `POST /api/payments/refund` - Refund payment (admin only)

### Search & Filter
- `GET /api/search/products` - Search products
- `GET /api/filter/products` - Filter products
- `GET /api/filter/options` - Get filter options

### Admin Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics (admin only)
- `GET /api/admin/analytics/sales` - Get sales analytics (admin only)
- `GET /api/admin/analytics/users` - Get user analytics (admin only)
- `GET /api/admin/analytics/products` - Get product analytics (admin only)
- `GET /api/admin/analytics/orders` - Get order analytics (admin only)

## Architecture

The application follows a modular, scalable microservices-based architecture:

- **Models**: Define the database schemas using Mongoose
- **Controllers**: Handle the business logic for each endpoint
- **Services**: Encapsulate reusable business logic
- **Routes**: Define the API endpoints
- **Middlewares**: Handle authentication, validation, caching, rate limiting, and error handling
- **Utils**: Provide utility functions and validation schemas
- **Config**: Store configuration settings
- **Errors**: Define custom error classes

## Professional Libraries Used

- **Zod**: Schema validation library for runtime type checking
- **Passport.js**: Authentication middleware with JWT strategy
- **Redis**: In-memory data structure store for caching and session management
- **Mongoose**: MongoDB object modeling for Node.js
- **Helmet**: Security middleware to protect against common attacks
- **Express-rate-limit**: Rate limiting middleware
- **XSS-clean**: Sanitizes user input to prevent cross-site scripting attacks
- **HPP**: HTTP Parameter Pollution protection

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License.