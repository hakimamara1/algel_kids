import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageCarousel from '../components/ImageCarousel';
import { trackEvent } from '../utils/FacebookPixel';
import { motion, AnimatePresence } from 'framer-motion';

import ProductHeader from '../components/product/ProductHeader';
import ProductVariants from '../components/product/ProductVariants';

// Lazy load components that are not immediately visible
const ProductTrust = lazy(() => import('../components/product/ProductTrust'));
const ProductDescription = lazy(() => import('../components/product/ProductDescription'));
const CheckoutForm = lazy(() => import('../components/CheckoutForm'));

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [isWishlist, setIsWishlist] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`);
                setProduct(data);

                if (data.colors && data.colors.length > 0) {
                    setSelectedColor(data.colors[0]);
                }

                setLoading(false);

                trackEvent('ViewContent', {
                    content_ids: [data._id],
                    content_name: data.title,
                    currency: 'DZD',
                    value: data.price
                });

            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleColorChange = useCallback((color) => {
        setSelectedColor(color);
        setSelectedSize(null);
    }, []);

    if (loading || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pink-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    const displayImages = (selectedColor?.images && selectedColor.images.length > 0)
        ? selectedColor.images
        : (product.images || []);

    const discount = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24 relative">
            {/* Top Header */}
            <div className=" fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center ">
                {/* Animated Logo Text */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute left-0 right-0 flex justify-center pointer-events-none -z-10"
                >

                </motion.div>
                {/* Visual Spacer */}
            </div>

            {/* Hero Image Section */}
            <div className="relative w-full bg-white rounded-b-[2rem] shadow-sm overflow-hidden z-20">
                <div className="relative">
                    <ImageCarousel images={displayImages} />
                </div>
            </div>

            <div className="px-4 pt-6 pb-20 max-w-2xl mx-auto">
                <ProductHeader
                    title={product.title}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    discount={discount}
                />

                <ProductVariants
                    colors={product.colors}
                    selectedColor={selectedColor}
                    onColorChange={handleColorChange}
                    selectedSize={selectedSize}
                    onSizeChange={setSelectedSize}
                />

                <Suspense fallback={<div className="h-20 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500"></div></div>}>
                    <ProductTrust />
                    <ProductDescription description={product.description} />
                </Suspense>
            </div>

            {/* Inline Checkout Form */}
            <div id="checkout-section" className="px-4 pb-10 max-w-2xl mx-auto">
                <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div></div>}>
                    <CheckoutForm
                        product={product}
                        variant={{ color: selectedColor, size: selectedSize }}
                        onClose={() => { }}
                    />
                </Suspense>
            </div>



            {/* Contact Us Section */}
            <div className="text-center pb-12">
                <h3 className="text-gray-500 font-medium mb-4 text-sm uppercase tracking-widest">لديك سؤال؟ اتصل بنا</h3>
                <div className="flex justify-center space-x-6">
                    <a href="https://web.facebook.com/profile.php?id=100071809980483" className="bg-white p-3 rounded-full shadow-sm text-blue-600 hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                    <a href="#" className="bg-white p-3 rounded-full shadow-sm text-pink-500 hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                    <a href="tel:0662241056" className="bg-white p-3 rounded-full shadow-sm text-green-600 hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
