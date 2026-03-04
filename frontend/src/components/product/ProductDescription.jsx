import React from 'react';

const ProductDescription = React.memo(({ description }) => {
    return (
        <div className="prose prose-sm prose-pink text-gray-600 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-gray-900 font-bold mb-2">وصف المنتج</h3>
            <p className="whitespace-pre-line leading-relaxed">{description}</p>
        </div>
    );
});

export default ProductDescription;
