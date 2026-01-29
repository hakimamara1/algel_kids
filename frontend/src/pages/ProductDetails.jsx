import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageCarousel from '../components/ImageCarousel';
import CheckoutForm from '../components/CheckoutForm';
import { trackEvent } from '../utils/FacebookPixel';
import { motion, AnimatePresence } from 'framer-motion';

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
                // Note: Using the IP from previous context
                const { data } = await axios.get(`http://192.168.179.237:5002/api/products/${id}`);
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

    const handleColorChange = (color) => {
        setSelectedColor(color);
        setSelectedSize(null);
    };





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

    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = selectedColor?.sizes && selectedColor.sizes.length > 0;
    const discount = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24 relative">
            {/* Top Header */}
            <div className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-none">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto bg-white/90 backdrop-blur-xl p-2.5 rounded-full shadow-sm text-gray-700 active:scale-95 transition-all border border-white/20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Animated Logo Text */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute left-0 right-0 flex justify-center pointer-events-none -z-10"
                >
                    <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-white/40">
                        <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-sky-500 bg-clip-text text-transparent">
                            Angel Kids
                        </span>
                    </div>
                </motion.div>

                {/* Visual Spacer */}
                <div className="w-10"></div>
            </div>

            {/* Hero Image Section */}
            <div className="relative w-full bg-white rounded-b-[2rem] shadow-sm overflow-hidden z-20">
                <div className="relative">
                    <ImageCarousel images={displayImages} />
                    <button
                        onClick={() => setIsWishlist(!isWishlist)}
                        className="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-sm active:scale-95 transition-transform"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-6 w-6 transition-colors ${isWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="px-4 pt-6 pb-20 max-w-2xl mx-auto">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold text-gray-800 leading-snug flex-1 mr-2">
                        {product.title}
                    </h1>
                    {discount > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wide whitespace-nowrap">
                            -{discount}% OFF
                        </span>
                    )}
                </div>

                {/* Price & Stock */}
                <div className="flex items-center space-x-3 mb-6">
                    <span className="text-3xl font-extrabold text-pink-500">{product.price} DA</span>
                    {product.compareAtPrice && (
                        <span className="text-lg text-gray-400 line-through decoration-gray-400">{product.compareAtPrice} DA</span>
                    )}
                    <div className="ml-auto flex items-center space-x-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span>In Stock</span>
                    </div>
                </div>

                {/* Variants Section */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6 mb-6">
                    {/* Colors */}
                    {hasColors && (
                        <div>
                            <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Select Color
                            </span>
                            <div className="flex flex-wrap gap-4">
                                {product.colors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => handleColorChange(color)}
                                        className={`group relative w-12 h-12 rounded-full focus:outline-none transition-transform active:scale-95 ${selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-pink-500' : ''
                                            }`}
                                    >
                                        <span
                                            className="block w-full h-full rounded-full border border-black/10 shadow-inner"
                                            style={{ backgroundColor: color.hexCode }}
                                        />
                                        {selectedColor?.name === color.name && (
                                            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-600 whitespace-nowrap bg-white px-1 rounded shadow-sm z-10">
                                                {color.name}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sizes */}
                    {hasSizes && (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    Select Age / Size
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {selectedColor.sizes.map((size) => {
                                    const isOutOfStock = size.stock === 0;
                                    const isSelected = selectedSize?.value === size.value;
                                    return (
                                        <button
                                            key={size.value}
                                            disabled={isOutOfStock}
                                            onClick={() => setSelectedSize(size)}
                                            className={`
                                                relative py-3 rounded-xl text-sm font-bold border-2 transition-all
                                                ${isSelected
                                                    ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm transform scale-[1.02]'
                                                    : isOutOfStock
                                                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                                        : 'border-gray-100 bg-white text-gray-700 hover:border-pink-200'
                                                }
                                            `}
                                        >
                                            {size.value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Trust & Delivery Info */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-sky-50 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                        <div className="bg-white p-2 rounded-full text-sky-500 mb-1 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-sky-800 uppercase leading-tight">Cash on<br />Delivery</span>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                        <div className="bg-white p-2 rounded-full text-indigo-500 mb-1 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2 2 2 0 012 2m10 0a2 2 0 012-2 2 2 0 012 2M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-800 uppercase leading-tight">Fast<br />Delivery</span>
                    </div>
                    <div className="bg-mint-50 bg-green-50 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                        <div className="bg-white p-2 rounded-full text-green-500 mb-1 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-green-800 uppercase leading-tight">Easy<br />Returns</span>
                    </div>
                </div>

                {/* Description */}
                <div className="prose prose-sm prose-pink text-gray-600 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-900 font-bold mb-2">Product Description</h3>
                    <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
                </div>
            </div>

            {/* Inline Checkout Form */}
            <div id="checkout-section" className="px-4 pb-10 max-w-2xl mx-auto">
                <CheckoutForm
                    product={product}
                    variant={{ color: selectedColor, size: selectedSize }}
                    onClose={() => { }}
                />
            </div>
        </div>
    );
};

export default ProductDetails;
