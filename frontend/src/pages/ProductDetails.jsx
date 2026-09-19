import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';
import { getProduct } from '../lib/api';
import { defaultColor, pickSize } from '../lib/variants';
import { trackEvent } from '../utils/FacebookPixel';
import { productPageKey, trackPageVisit } from '../lib/funnel';

import ProductHeader from '../components/product/ProductHeader';
import ProductVariants from '../components/product/ProductVariants';
import ProductTrust from '../components/product/ProductTrust';
import ProductDescription from '../components/product/ProductDescription';
import StickyOrderBar from '../components/product/StickyOrderBar';

// The order form carries the wilaya/commune list, so it loads right after the page appears
const CheckoutForm = lazy(() => import('../components/CheckoutForm'));

const scrollGently = (element, block = 'start') => {
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block });
};

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [retryCount, setRetryCount] = useState(0);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [sizeMissing, setSizeMissing] = useState(false);
    const [barVisible, setBarVisible] = useState(false);
    const addToCartSent = useRef(false);
    const priceRef = useRef(null);
    const variantsRef = useRef(null);
    const sizeRef = useRef(null);
    const checkoutRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        addToCartSent.current = false;

        getProduct(id)
            .then((data) => {
                if (cancelled) return;
                const color = defaultColor(data.colors);
                setProduct(data);
                setSelectedColor(color);
                // A size is already chosen, so the customer can't forget it (the shop checks it on the call)
                setSelectedSize(pickSize(color));
                setStatus('ready');

                trackPageVisit(productPageKey(data._id), data._id);
                trackEvent('ViewContent', {
                    content_ids: [data._id],
                    content_name: data.title,
                    content_type: 'product',
                    currency: 'DZD',
                    value: data.price
                });
            })
            .catch((error) => {
                if (cancelled) return;
                console.error(error);
                setStatus('error');
            });

        return () => {
            cancelled = true;
        };
    }, [id, retryCount]);

    // Show the order bar once the price has scrolled away, hide it again when the form is on screen
    useEffect(() => {
        const price = priceRef.current;
        const checkout = checkoutRef.current;
        if (status !== 'ready' || !price || !checkout || !('IntersectionObserver' in window)) return;

        const onScreen = { price: true, checkout: false };
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                onScreen[entry.target === price ? 'price' : 'checkout'] = entry.isIntersecting;
            }
            setBarVisible(!onScreen.price && !onScreen.checkout);
        });
        observer.observe(price);
        observer.observe(checkout);
        return () => observer.disconnect();
    }, [status]);

    // The customer choosing a color or size herself is the "add to cart" moment
    const sendAddToCart = useCallback(() => {
        if (!product || addToCartSent.current) return;
        addToCartSent.current = true;
        trackEvent('AddToCart', {
            content_ids: [product._id],
            content_name: product.title,
            content_type: 'product',
            currency: 'DZD',
            value: product.price
        });
    }, [product]);

    const handleColorChange = useCallback((color) => {
        setSelectedColor(color);
        // Keep her size when this color has it in stock, otherwise the closest one
        setSelectedSize((current) => pickSize(color, current?.value));
        setSizeMissing(false);
        sendAddToCart();
    }, [sendAddToCart]);

    const handleSizeChange = useCallback((size) => {
        setSelectedSize(size);
        setSizeMissing(false);
        sendAddToCart();
    }, [sendAddToCart]);

    const handleSizeMissing = useCallback(() => {
        setSizeMissing(true);
        scrollGently(sizeRef.current, 'center');
    }, []);

    // "تغيير" in the order form: back up to the color and size choices
    const handleChangeVariant = useCallback(() => {
        scrollGently(variantsRef.current, 'center');
    }, []);

    const handleOrderClick = () => {
        if (selectedColor?.sizes?.length && !selectedSize) {
            handleSizeMissing();
            return;
        }
        scrollGently(checkoutRef.current);
    };

    const retry = () => {
        setStatus('loading');
        setRetryCount((count) => count + 1);
    };

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
                <p className="text-xl font-bold text-gray-800">تعذّر تحميل المنتج</p>
                <p className="text-gray-500">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
                <button
                    onClick={retry}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                    إعادة المحاولة
                </button>
                <a href="tel:0662241056" className="text-pink-600 font-medium">أو اتصل بنا: 0662241056</a>
            </div>
        );
    }

    if (status === 'loading' || !product) {
        // Same shape as the loaded page, so nothing jumps when the product arrives
        return (
            <div className="min-h-screen bg-gray-50" aria-busy="true">
                <div className="w-full aspect-[3/4] md:aspect-auto md:h-[600px] bg-gray-200 animate-pulse rounded-b-[2rem]" />
                <div className="px-4 pt-6 max-w-2xl mx-auto space-y-4">
                    <div className="h-7 w-2/3 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-9 w-1/3 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-32 bg-white rounded-2xl border border-gray-100" />
                </div>
            </div>
        );
    }

    const displayImages = (selectedColor?.images && selectedColor.images.length > 0)
        ? selectedColor.images
        : (product.images || []);

    const discount = product.compareAtPrice > product.price
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;

    const colorSizes = selectedColor?.sizes || [];
    const soldOut = colorSizes.length > 0 && colorSizes.every((size) => Number(size.stock) <= 0);
    const summary = [selectedColor?.name, selectedSize?.value].filter(Boolean).join(' · ');

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-28 relative">
            {/* Hero Image Section */}
            <div className="relative w-full bg-white rounded-b-[2rem] shadow-sm overflow-hidden z-20">
                <ImageCarousel images={displayImages} alt={product.title} />
                <Link
                    to="/"
                    aria-label="العودة إلى المتجر"
                    className="absolute top-3 start-3 w-10 h-10 rounded-full bg-white/85 text-gray-800 shadow flex items-center justify-center"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" /></svg>
                </Link>
            </div>

            <div className="px-4 pt-6 pb-8 max-w-2xl mx-auto">
                <div ref={priceRef}>
                    <ProductHeader
                        title={product.title}
                        price={product.price}
                        compareAtPrice={product.compareAtPrice}
                        discount={discount}
                        soldOut={soldOut}
                        stockLeft={selectedSize ? Number(selectedSize.stock) : null}
                    />
                </div>

                <ProductTrust />

                <div ref={variantsRef}>
                    <ProductVariants
                        colors={product.colors}
                        selectedColor={selectedColor}
                        onColorChange={handleColorChange}
                        selectedSize={selectedSize}
                        onSizeChange={handleSizeChange}
                        sizeRef={sizeRef}
                        sizeMissing={sizeMissing}
                    />
                </div>

                <ProductDescription description={product.description} />
            </div>

            {/* Inline Checkout Form */}
            <div id="checkout-section" ref={checkoutRef} className="px-4 pb-10 max-w-2xl mx-auto scroll-mt-4">
                <Suspense fallback={<div className="h-96 bg-white rounded-3xl border border-gray-100" />}>
                    <CheckoutForm
                        product={product}
                        variant={{ color: selectedColor, size: selectedSize }}
                        onSizeMissing={handleSizeMissing}
                        onChangeVariant={handleChangeVariant}
                    />
                </Suspense>
            </div>

            {/* Contact Us Section */}
            <div className="text-center pb-12">
                <h3 className="text-gray-500 font-medium mb-4 text-sm uppercase tracking-widest">لديك سؤال؟ اتصل بنا</h3>
                <div className="flex justify-center gap-6">
                    <a href="https://web.facebook.com/profile.php?id=100071809980483" aria-label="Facebook" className="bg-white p-3 rounded-full shadow-sm text-blue-600 hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                    <a href="tel:0662241056" aria-label="اتصل بنا" className="bg-white p-3 rounded-full shadow-sm text-green-600 hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </a>
                </div>
            </div>

            <StickyOrderBar
                visible={barVisible}
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                summary={summary}
                soldOut={soldOut}
                onOrder={handleOrderClick}
            />
        </div>
    );
};

export default ProductDetails;
