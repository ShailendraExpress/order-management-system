import React from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/helpers";
import { HiChevronDoubleRight } from 'react-icons/hi';

const ListView = ({ products }) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {products.map((product) => {
        const { id, name, description, price, thumbnail } = product;
        return (
          <div 
            key={id} 
            className="group flex flex-col sm:flex-row bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* IMAGE SECTION - Left Side (Top on Mobile) */}
            <Link 
              to={`/products/${id}`} 
              className="sm:w-1/3 lg:w-[280px] h-[220px] bg-white p-6 flex items-center justify-center shrink-0 overflow-hidden"
            >
              <img
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                src={thumbnail}
                alt={name}
              />
            </Link>

            {/* DETAILS SECTION - Right Side (Bottom on Mobile) */}
            <div className="flex flex-col flex-grow p-5 sm:p-6 sm:border-l border-slate-100 bg-slate-50/30">
              
              {/* Product Name */}
              <Link to={`/products/${id}`}>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors mb-1 line-clamp-2">
                  {name}
                </h3>
              </Link>

              {/* Price */}
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 tracking-tight">
                {formatPrice(price)}
              </h4>

              {/* Description (Used line-clamp so it cuts off perfectly) */}
              <p className="text-sm text-slate-500 mb-6 line-clamp-2 sm:line-clamp-3">
                {description.substring(0, 150)}...
              </p>

              {/* Action Button - Modern Outline Button */}
              <Link
                to={`/products/${id}`}
                className="mt-auto inline-flex items-center justify-center sm:justify-start gap-2 text-sm uppercase tracking-wide font-bold text-blue-600 hover:text-white border-2 border-blue-600 hover:bg-blue-600 rounded-lg py-2.5 px-6 w-full sm:w-max transition-all active:scale-95"
              >
                View Details
                <HiChevronDoubleRight className="text-lg" />
              </Link>

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;