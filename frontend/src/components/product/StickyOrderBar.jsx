import React from 'react';

// Bottom bar on phones: price + "order now" stay in reach while scrolling.
// It slides with a CSS transform only (no layout work) and hides near the form.
const StickyOrderBar = ({ visible, price, compareAtPrice, summary, soldOut, onOrder }) => (
    <div
        aria-hidden={!visible}
        className={`fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-200 motion-reduce:transition-none ${visible ? 'translate-y-0' : 'translate-y-full'}`}
    >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="leading-tight min-w-0">
                <p className="text-lg font-extrabold text-pink-600 whitespace-nowrap">
                    {price} د.ج
                    {compareAtPrice > price && (
                        <span className="ms-2 text-xs font-medium text-gray-400 line-through">{compareAtPrice} د.ج</span>
                    )}
                </p>
                {summary && <p className="text-xs text-gray-500 truncate">{summary}</p>}
            </div>
            <button
                type="button"
                onClick={onOrder}
                disabled={soldOut}
                tabIndex={visible ? 0 : -1}
                className="flex-1 bg-black text-white py-3.5 rounded-xl font-bold text-base hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {soldOut ? 'نفد هذا اللون' : 'اطلب الآن'}
            </button>
        </div>
    </div>
);

export default StickyOrderBar;
