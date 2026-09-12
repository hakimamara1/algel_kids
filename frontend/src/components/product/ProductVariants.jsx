import React from 'react';

// Color codes typed in the admin are sometimes "CFB08C#" or " #5A3A2E": repair them so the swatch still shows
const swatchColor = (hex) => {
    const value = String(hex || '').trim();
    const digits = value.replace(/#/g, '');
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(digits)) return `#${digits}`;
    if (typeof CSS !== 'undefined' && CSS.supports?.('color', value)) return value;
    return '#E5E7EB';
};

const ProductVariants = ({
    colors,
    selectedColor,
    onColorChange,
    selectedSize,
    onSizeChange,
    sizeRef,
    sizeMissing
}) => {
    const hasColors = colors && colors.length > 0;
    const sizes = selectedColor?.sizes || [];

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6 mb-6">
            {/* Colors */}
            {hasColors && (
                <div role="group" aria-labelledby="color-label">
                    <p id="color-label" className="text-sm font-semibold text-gray-500 mb-3">
                        اختر اللون{selectedColor && <span className="text-gray-900">: {selectedColor.name}</span>}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-3">
                        {colors.map((color) => {
                            const isSelected = selectedColor?.name === color.name;
                            return (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => onColorChange(color)}
                                    aria-pressed={isSelected}
                                    className="flex w-16 flex-col items-center gap-1.5 rounded-lg p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                                >
                                    <span
                                        className={`block h-11 w-11 rounded-full border border-black/10 shadow-inner transition-shadow ${isSelected ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
                                        style={{ backgroundColor: swatchColor(color.hexCode) }}
                                    />
                                    <span className={`w-full text-center text-[11px] leading-tight line-clamp-2 break-words ${isSelected ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                        {color.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
                <div
                    ref={sizeRef}
                    role="group"
                    aria-labelledby="size-label"
                    className={`scroll-mt-24 rounded-xl transition-colors ${sizeMissing ? 'bg-red-50 ring-2 ring-red-300 p-3 -m-3' : ''}`}
                >
                    <p id="size-label" className="text-sm font-semibold text-gray-500 mb-3">
                        اختر المقاس / العمر{selectedSize && <span className="text-gray-900">: {selectedSize.value}</span>}
                    </p>
                    {sizeMissing && (
                        <p role="alert" className="mb-3 text-sm font-semibold text-red-600">اختر المقاس للمتابعة</p>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                        {sizes.map((size) => {
                            const isOutOfStock = Number(size.stock) <= 0;
                            const isSelected = selectedSize?.value === size.value;
                            return (
                                <button
                                    key={size.value}
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => onSizeChange(size)}
                                    aria-pressed={isSelected}
                                    aria-label={isOutOfStock ? `${size.value} (نفد)` : size.value}
                                    className={`
                                        relative py-3 rounded-xl text-sm font-bold border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500
                                        ${isSelected
                                            ? 'border-pink-500 bg-pink-50 text-pink-600'
                                            : isOutOfStock
                                                ? 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'
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
    );
};

export default ProductVariants;
