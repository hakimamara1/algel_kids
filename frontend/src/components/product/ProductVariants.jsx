import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductVariants = ({
    colors,
    selectedColor,
    onColorChange,
    selectedSize,
    onSizeChange
}) => {
    const [shakingColor, setShakingColor] = useState(null);
    const [shakingSize, setShakingSize] = useState(null);

    const hasColors = colors && colors.length > 0;
    const hasSizes = selectedColor?.sizes && selectedColor.sizes.length > 0;

    const handleOutOfStockColorClick = (colorName) => {
        setShakingColor(colorName);
        setTimeout(() => setShakingColor(null), 500);
    };

    const handleOutOfStockSizeClick = (sizeValue) => {
        setShakingSize(sizeValue);
        setTimeout(() => setShakingSize(null), 500);
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6 mb-6">
            {/* Colors */}
            {hasColors && (
                <div>
                    <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        اختر اللون
                    </span>
                    <div className="flex flex-wrap gap-4">
                        {colors.map((color) => {
                            const isColorOutOfStock = color.sizes && color.sizes.length > 0 && color.sizes.every(size => size.stock === 0);
                            
                            return (
                            <motion.button
                                key={color.name}
                                animate={shakingColor === color.name ? { x: [-10, 10, -10, 10, 0] } : {}}
                                transition={{ duration: 0.4 }}
                                onClick={() => {
                                    if (isColorOutOfStock) {
                                        handleOutOfStockColorClick(color.name);
                                    } else {
                                        onColorChange(color);
                                    }
                                }}
                                className={`group relative w-12 h-12 rounded-full focus:outline-none transition-transform ${
                                    !isColorOutOfStock ? 'active:scale-95' : ''
                                } ${selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-pink-500' : ''} ${
                                    isColorOutOfStock ? 'opacity-50' : ''
                                }`}
                            >
                                <span
                                    className="block w-full h-full rounded-full border border-black/10 shadow-inner relative overflow-hidden"
                                    style={{ backgroundColor: color.hexCode }}
                                >
                                    {isColorOutOfStock && (
                                        <span className="absolute inset-0 w-full h-full border-t-[1.5px] border-red-500 transform -rotate-45 origin-center scale-150 top-1/2 -mt-[1px]"></span>
                                    )}
                                </span>
                                
                                {selectedColor?.name === color.name && !isColorOutOfStock && (
                                    <span className="absolute -bottom-6 left-1/2 transform translate-x-1/2 text-[10px] font-medium text-gray-600 whitespace-nowrap bg-white px-1 rounded shadow-sm z-10">
                                        {color.name}
                                    </span>
                                )}

                                <AnimatePresence>
                                    {shakingColor === color.name && (
                                        <motion.span 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute -top-8 left-1/2 transform translate-x-1/2 text-[10px] font-medium text-white bg-red-500 px-2 py-1 rounded shadow-sm z-20 whitespace-nowrap pointer-events-none"
                                        >
                                            نفذت الكمية
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        )})}
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
                                <motion.button
                                    key={size.value}
                                    animate={shakingSize === size.value ? { x: [-10, 10, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    onClick={() => {
                                        if (isOutOfStock) {
                                            handleOutOfStockSizeClick(size.value);
                                        } else {
                                            onSizeChange(size);
                                        }
                                    }}
                                    className={`
                                        relative py-3 rounded-xl text-sm font-bold border-2 transition-all
                                        ${isSelected
                                            ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm transform scale-[1.02]'
                                            : isOutOfStock
                                                ? 'border-gray-200 bg-gray-50 text-gray-400 opacity-60'
                                                : 'border-gray-100 bg-white text-gray-700 hover:border-pink-200'
                                        }
                                    `}
                                >
                                    <span className="relative z-10">{size.value}</span>
                                    {isOutOfStock && (
                                        <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                                            <span className="absolute inset-0 w-full h-full border-t border-red-400 transform -rotate-[25deg] origin-center scale-[1.3] top-1/2"></span>
                                        </span>
                                    )}
                                    <AnimatePresence>
                                        {shakingSize === size.value && (
                                            <motion.span 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute -top-[22px] left-1/2 transform translate-x-1/2 text-[10px] font-medium text-white bg-red-500 px-1.5 py-0.5 rounded shadow-sm z-20 whitespace-nowrap pointer-events-none"
                                            >
                                                نفذت الكمية
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductVariants;
