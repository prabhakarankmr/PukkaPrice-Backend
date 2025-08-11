const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/products - Get all products with optional search
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      category = '', 
      minPrice = 0, 
      maxPrice = 999999999,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause for search
    let whereConditions = [];
    let queryParams = [];

    // Search functionality
    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category) {
      whereConditions.push('category = ?');
      queryParams.push(category);
    }

    // Price range filter
    whereConditions.push('price BETWEEN ? AND ?');
    queryParams.push(minPrice, maxPrice);

    // Only show active products
    whereConditions.push('status = ?');
    queryParams.push('active');

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Validate sort parameters
    const allowedSortFields = ['name', 'price', 'created_at', 'updated_at', 'category'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Main query
    const query = `
      SELECT 
        id,
        name,
        description,
        price,
        image_url,
        category,
        affiliate_link,
        tags,
        created_at,
        updated_at
      FROM products 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products 
      ${whereClause}
    `;

    // Execute queries
    const [products] = await db.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);
    const [countResult] = await db.execute(countQuery, queryParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        sortBy: validSortBy,
        sortOrder: validSortOrder
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        name,
        description,
        price,
        image_url,
        category,
        affiliate_link,
        tags,
        status,
        created_at,
        updated_at
      FROM products 
      WHERE id = ? AND status = 'active'
    `;

    const [products] = await db.execute(query, [id]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// GET /api/products/categories - Get all categories
router.get('/meta/categories', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM products 
      WHERE status = 'active' AND category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY count DESC, category ASC
    `;

    const [categories] = await db.execute(query);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// GET /api/products/search/suggestions - Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = `
      SELECT DISTINCT name
      FROM products 
      WHERE name LIKE ? AND status = 'active'
      ORDER BY name
      LIMIT 10
    `;

    const [suggestions] = await db.execute(query, [`%${q}%`]);

    res.json({
      success: true,
      data: suggestions.map(item => item.name)
    });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

module.exports = router;
