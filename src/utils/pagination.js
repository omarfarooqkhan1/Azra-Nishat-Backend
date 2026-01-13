// Utility function to create pagination metadata
const createPaginationMetadata = (totalItems, currentPage, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    totalItems,
    itemsPerPage,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  };
};

// Utility function to parse query parameters for pagination
const parsePaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Set maximum limit to prevent abuse
  const maxLimit = 100;
  const parsedLimit = Math.min(limit, maxLimit);
  
  const skip = (page - 1) * parsedLimit;
  
  return {
    page,
    limit: parsedLimit,
    skip
  };
};

// Utility function to parse sort parameters
const parseSortParams = (req, allowedFields = []) => {
  let sortBy = req.query.sortBy || '';
  let sortOrder = req.query.sortOrder || 'asc';
  
  // Convert to lowercase for comparison
  sortBy = sortBy.toLowerCase();
  sortOrder = sortOrder.toLowerCase();
  
  // Validate sort field if allowed fields are provided
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    sortBy = '';
  }
  
  // Validate sort order
  if (!['asc', 'desc'].includes(sortOrder)) {
    sortOrder = 'asc';
  }
  
  // Create sort object
  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }
  
  return sort;
};

// Utility function to parse filter parameters
const parseFilterParams = (req, allowedFilters = []) => {
  const filters = {};
  
  // Process each query parameter
  Object.keys(req.query).forEach(key => {
    // Skip pagination and sorting params
    if (['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
      return;
    }
    
    // Check if filter is allowed
    if (allowedFilters.length > 0 && !allowedFilters.includes(key)) {
      return;
    }
    
    const value = req.query[key];
    
    // Handle different types of filters
    if (key.endsWith('_min')) {
      const field = key.replace('_min', '');
      filters[field] = { ...filters[field], $gte: parseFloat(value) };
    } else if (key.endsWith('_max')) {
      const field = key.replace('_max', '');
      filters[field] = { ...filters[field], $lte: parseFloat(value) };
    } else if (key.endsWith('_gte')) {
      const field = key.replace('_gte', '');
      filters[field] = { ...filters[field], $gte: parseFloat(value) };
    } else if (key.endsWith('_lte')) {
      const field = key.replace('_lte', '');
      filters[field] = { ...filters[field], $lte: parseFloat(value) };
    } else if (key.endsWith('_ne')) {
      const field = key.replace('_ne', '');
      filters[field] = { ...filters[field], $ne: value };
    } else if (key.endsWith('_in')) {
      const field = key.replace('_in', '');
      filters[field] = { ...filters[field], $in: Array.isArray(value) ? value : [value] };
    } else {
      // Handle exact match
      filters[key] = value;
    }
  });
  
  return filters;
};

module.exports = {
  createPaginationMetadata,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams
};