const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(requireAdmin, createProduct);

router.route('/:id')
    .get(getProductById)
    .put(requireAdmin, updateProduct)
    .delete(requireAdmin, deleteProduct);

module.exports = router;
