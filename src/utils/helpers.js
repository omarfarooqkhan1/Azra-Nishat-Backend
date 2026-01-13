// Utility function to generate URL-friendly slugs
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
    .replace(/\-\-+/g, '-')       // Replace multiple - with single -
    .replace(/^-+/, '')           // Trim - from start
    .replace(/-+$/, '');          // Trim - from end
};

// Utility function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility function to validate phone number format
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Utility function to format currency
const formatCurrency = (amount, currency = 'PKR') => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Utility function to calculate discount percentage
const calculateDiscountPercentage = (originalPrice, salePrice) => {
  if (!salePrice || originalPrice <= salePrice) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Utility function to validate product variant
const validateProductVariant = (variant) => {
  const requiredFields = ['sku', 'weight', 'price'];
  
  for (const field of requiredFields) {
    if (!variant[field]) {
      return {
        isValid: false,
        error: `${field} is required for product variant`
      };
    }
  }
  
  if (variant.price < 0) {
    return {
      isValid: false,
      error: 'Price must be a positive number'
    };
  }
  
  if (variant.weight <= 0) {
    return {
      isValid: false,
      error: 'Weight must be a positive number'
    };
  }
  
  return { isValid: true };
};

module.exports = {
  generateSlug,
  isValidEmail,
  isValidPhone,
  formatCurrency,
  calculateDiscountPercentage,
  validateProductVariant
};