import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductImages = ({ images = [] }) => {
    const [main, setMain] = useState(null);

    // BUG FIX: Redux se data aane me thoda time lagta hai, 
    // isliye jab bhi images load hon, main image automatically set ho jaye.
    useEffect(() => {
        if (images && images.length > 0) {
            setMain(images[0]);
        }
    }, [images]);

    if (!images || images.length === 0) return null;

    return (
        <div className="flex flex-col gap-4 sm:gap-6 w-full font-sans">
            
            {/* --- Main Image Showcase --- */}
            <div className="relative w-full aspect-square sm:aspect-auto sm:h-[450px] lg:h-[500px] bg-white rounded-lg flex items-center justify-center p-4 sm:p-8 overflow-hidden group">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={main?.image} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeIn" }}
                        src={main?.image}
                        alt="Product Showcase"
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 cursor-zoom-in"
                    />
                </AnimatePresence>
            </div>

            {/* --- Thumbnail Gallery --- */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                {images.map((image, index) => {
                    const isActive = main?.image === image?.image;
                    
                    return (
                        <button
                            key={index}
                            onClick={() => setMain(images[index])}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-md p-1.5 flex items-center justify-center overflow-hidden transition-all duration-200 outline-none bg-white ${
                                isActive
                                    ? 'border-2 border-blue-600 shadow-sm'
                                    : 'border border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                            }`}
                        >
                            <img
                                src={image?.image}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-contain"
                            />
                        </button>
                    );
                })}
            </div>
            
        </div>
    );
};

export default ProductImages;