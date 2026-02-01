const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const cacheMiddleware = require('../middleware/cache');

// Apply cache middleware to GET routes
// Cache product list for 5 minutes (300 seconds)
// Cache individual products for 10 minutes (600 seconds)
router.route('/')
    .get(cacheMiddleware(300), getProducts)
    .post(createProduct);

router.route('/:id')
    .get(cacheMiddleware(600), getProductById)
    .put(updateProduct)
    .delete(deleteProduct);

module.exports = router;
