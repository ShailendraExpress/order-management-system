import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers';

const GridView = ({ products }) => {
    return (
        <div className="w-full">
            {/* Grid layout: Mobile par 2 col, Tablet par 3, Desktop par 4 (Standard eCommerce) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => {
                    const { id, name, price, thumbnail } = product;
                    
                    return (
                        <Link 
                            key={id} 
                            to={`/products/${id}`} 
                            className="group flex flex-col bg-white rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                            {/* IMAGE SECTION */}
                            <div className="relative w-full h-40 sm:h-52 bg-white p-4 flex items-center justify-center overflow-hidden">
                                <img 
                                    src={thumbnail} 
                                    alt={name} 
                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-in-out" 
                                />
                            </div>

                            {/* DETAILS SECTION */}
                            <div className="p-3 sm:p-4 flex flex-col flex-grow border-t border-slate-100 bg-slate-50/30">
                                {/* Product Name (Line clamp prevents long names from breaking the grid) */}
                                <h4 className="text-xs sm:text-sm font-semibold text-slate-700 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                    {name}
                                </h4>
                                
                                {/* Price */}
                                <div className="mt-auto">
                                    <p className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                        {formatPrice(price)}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default GridView;