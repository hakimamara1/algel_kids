import React from 'react';

const ProductTrust = () => {
    return (
        <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-sky-50 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                <div className="bg-white p-2 rounded-full text-sky-500 mb-1 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-sky-800 uppercase leading-tight">الدفع عند<br />الاستلام</span>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                <div className="bg-white p-2 rounded-full text-indigo-500 mb-1 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2 2 2 0 012 2m10 0a2 2 0 012-2 2 2 0 012 2M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-indigo-800 uppercase leading-tight">توصيل<br />سريع</span>
            </div>
            <div className="bg-mint-50 bg-green-50 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                <div className="bg-white p-2 rounded-full text-green-500 mb-1 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-green-800 uppercase leading-tight">سهولة<br />الاسترجاع</span>
            </div>
        </div>
    );
};

export default ProductTrust;
