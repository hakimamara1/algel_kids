import React from 'react';

const ProductVariants = ({
    colors,
    selectedColor,
    onColorChange,
    selectedSize,
    onSizeChange
}) => {
    const hasColors = colors && colors.length > 0;
    const hasSizes = selectedColor?.sizes && selectedColor.sizes.length > 0;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6 mb-6">
            {/* Colors */}
            {hasColors && (
                <div>
                    <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        اختر اللون
                    </span>
                    <div className="flex flex-wrap gap-4">
                        {colors.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => onColorChange(color)}
                                className={`group relative w-12 h-12 rounded-full focus:outline-none transition-transform active:scale-95 ${selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-pink-500' : ''
                                    }`}
                            >
                                <span
                                    className="block w-full h-full rounded-full border border-black/10 shadow-inner"
                                    style={{ backgroundColor: color.hexCode }}
                                />
                                {selectedColor?.name === color.name && (
                                    <span className="absolute -bottom-6 left-1/2 transform translate-x-1/2 text-[10px] font-medium text-gray-600 whitespace-nowrap bg-white px-1 rounded shadow-sm z-10">
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
                            اختر المقاس / العمر
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
                                    onClick={() => onSizeChange(size)}
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
    );
};

export default ProductVariants;
