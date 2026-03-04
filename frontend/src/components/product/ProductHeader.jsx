import React from 'react';

const ProductHeader = React.memo(({ title, price, compareAtPrice, discount }) => {
    return (
        <>
            <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold text-gray-800 leading-snug flex-1 mr-2">
                    {title}
                </h1>
                {discount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wide whitespace-nowrap">
                        -{discount}% تخفيض
                    </span>
                )}
            </div>

            <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <span className="text-3xl font-extrabold text-pink-500">{price} د.ج</span>
                {compareAtPrice && (
                    <span className="text-lg text-gray-400 line-through decoration-gray-400">{compareAtPrice} د.ج</span>
                )}
                <div className="mr-auto flex items-center space-x-1 space-x-reverse text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>متوفر</span>
                </div>
            </div>
        </>
    );
});

export default ProductHeader;
