const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Azra Nishat E-commerce API',
      version: '1.0.0',
      description: 'A comprehensive e-commerce API for Azra Nishat jewellery store',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://yourdomain.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            email: {
              type: 'string',
              description: 'User email',
            },
            role: {
              type: 'string',
              description: 'User role (user or admin)',
              enum: ['user', 'admin'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Product ID',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Product price',
            },
            category: {
              type: 'string',
              description: 'Product category ID',
            },
            countInStock: {
              type: 'integer',
              description: 'Number of items in stock',
            },
            ratings: {
              type: 'number',
              format: 'float',
              description: 'Average rating',
            },
            reviews: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of review IDs',
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of image URLs',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Category ID',
            },
            name: {
              type: 'string',
              description: 'Category name',
            },
            description: {
              type: 'string',
              description: 'Category description',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Order ID',
            },
            orderItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string' },
                  name: { type: 'string' },
                  qty: { type: 'integer' },
                  price: { type: 'number', format: 'float' },
                },
              },
            },
            shippingAddress: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                city: { type: 'string' },
                postalCode: { type: 'string' },
                country: { type: 'string' },
              },
            },
            paymentMethod: {
              type: 'string',
            },
            itemsPrice: {
              type: 'number',
              format: 'float',
            },
            taxPrice: {
              type: 'number',
              format: 'float',
            },
            shippingPrice: {
              type: 'number',
              format: 'float',
            },
            totalPrice: {
              type: 'number',
              format: 'float',
            },
            isPaid: {
              type: 'boolean',
            },
            paidAt: {
              type: 'string',
              format: 'date-time',
            },
            isDelivered: {
              type: 'boolean',
            },
            deliveredAt: {
              type: 'string',
              format: 'date-time',
            },
            user: {
              type: 'string',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Cart ID',
            },
            user: {
              type: 'string',
              description: 'User ID',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string' },
                  name: { type: 'string' },
                  qty: { type: 'integer' },
                  price: { type: 'number', format: 'float' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;