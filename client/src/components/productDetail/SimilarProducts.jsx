import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers';

const SimilarProducts = ({ currentProductId, currentCategory }) => {
    // Redux se saare products fetch karein
    const allProducts = useSelector((state) => state.products.products) || [];

    // Current product ko chhod kar same category ke products filter karein
    const similarItems = allProducts
        .filter((item) => item.id !== currentProductId && item.category === currentCategory)
        .slice(0, 4); // Sirf max 4 products dikhayein

    if (similarItems.length === 0) return null;

    return (
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">Similar Products You Might Like</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {similarItems.map((product) => (
                    <Link 
                        to={`/products/${product.id}`} 
                        key={product.id}
                        className="group bg-slate-50/50 rounded-xl p-4 border border-slate-200/60 hover:shadow-md transition-all flex flex-col"
                    >
                        <div className="aspect-square w-full overflow-hidden rounded-lg bg-white mb-3 flex items-center justify-center p-2">
                            <img 
                                src={product.images?.[0]?.url || product.image} 
                                alt={product.name} 
                                className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{product.name}</h4>
                        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">{product.brand}</p>
                        <div className="mt-auto flex items-center justify-between">
                            <span className="text-sm font-extrabold text-slate-900">{formatPrice(product.price)}</span>
                            <span className="text-xs font-semibold text-blue-600 group-hover:underline">View</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SimilarProducts;