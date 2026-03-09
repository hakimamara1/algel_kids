import React, { useState } from 'react';
import { motion } from 'framer-motion';

const LazyImage = ({ src, alt }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative w-full min-h-[300px] bg-gray-100">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <svg className="w-12 h-12 text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                        <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                    </svg>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
                className={`w-full h-auto object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

const ProductImageGallery = ({ images }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="mt-8 mb-8 bg-white rounded-[2rem] p-6 shadow-sm">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800">تفاصيل أكثر</h3>
                <div className="w-16 h-1 bg-pink-500 mx-auto mt-2 rounded-full"></div>
            </div>

            <div className="flex flex-col gap-6">
                {images.map((img, index) => (
                    <motion.div
                        key={img._id || index}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full rounded-2xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100"
                    >
                        <LazyImage
                            src={img.url}
                            alt={`صورة توضيحية للمنتج ${index + 1}`}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ProductImageGallery;
