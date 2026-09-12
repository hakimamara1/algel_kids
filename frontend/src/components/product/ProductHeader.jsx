import React from 'react';

// Real stock only: "last pieces" appears when the chosen size really has 3 or fewer left
const Availability = ({ soldOut, stockLeft }) => {
    if (soldOut) {
        return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md whitespace-nowrap">نفد هذا اللون</span>;
    }
    if (stockLeft > 0 && stockLeft <= 3) {
        return (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md whitespace-nowrap">
                {stockLeft === 1 ? 'آخر قطعة' : `آخر ${stockLeft} قطع`}
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md whitespace-nowrap">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            متوفر
        </span>
    );
};

const ProductHeader = React.memo(({ title, price, compareAtPrice, discount, soldOut, stockLeft }) => {
    return (
        <>
            <div className="flex justify-between items-start gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-800 leading-snug flex-1">
                    {title}
                </h1>
                {discount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                        -{discount}% تخفيض
                    </span>
                )}
            </div>

            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-extrabold text-pink-500">{price} د.ج</span>
                {compareAtPrice > price && (
                    <span className="text-lg text-gray-400 line-through decoration-gray-400">{compareAtPrice} د.ج</span>
                )}
                <div className="ms-auto">
                    <Availability soldOut={soldOut} stockLeft={stockLeft} />
                </div>
            </div>
        </>
    );
});

export default ProductHeader;
