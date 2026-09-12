import React from 'react';

const ITEMS = [
    {
        label: 'الدفع عند الاستلام',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    },
    {
        label: 'توصيل سريع',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />,
    },
    {
        label: 'سهولة الاسترجاع',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
];

// One compact row right under the price, where the buying decision happens
const ProductTrust = React.memo(() => {
    return (
        <ul className="flex flex-wrap gap-2 mb-6">
            {ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-sm rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        {item.icon}
                    </svg>
                    {item.label}
                </li>
            ))}
        </ul>
    );
});

export default ProductTrust;
