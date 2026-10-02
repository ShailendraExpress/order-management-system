import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers';
import { FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';

const ProductItem = ({ product = {}, update = true, handleDelete, handleToggleStatus }) => {
  // Safely extract product unique identifier
  const id = product.id || product._id;
  const stockCount = Number(product.stock || 0);
  const isOutOfStock = stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;

  return (
    <tr className="bg-white hover:bg-slate-50/80 transition-colors duration-150 border-b border-slate-200/80 text-sm">
      
      {/* 1. PRODUCT INFORMATION COLUMN */}
      <td className="py-3.5 pl-6 pr-4">
        <div className="flex items-center gap-3.5">
          
          <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden">
            {product.thumbnail || product.image ? (
              <img
                className="h-full w-full object-contain"
                src={product.thumbnail || product.image}
                alt={product.name || 'Product item'}
                loading="lazy"
              />
            ) : (
              <BsBoxSeam className="text-slate-300 text-lg" aria-hidden="true" />
            )}
          </div>
          
          <div className="flex flex-col min-w-0 max-w-xs sm:max-w-sm">
            <div className="flex items-center gap-1.5 group">
              <Link
                to={`/admin/dashboard/updateproducts/${id}`}
                state={{ product }}
                className="font-semibold text-slate-800 hover:text-slate-900 truncate transition-colors"
                title={product.name}
              >
                {product.name || 'Untitled Product'}
              </Link>
              <Link
                to={`/product/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View live product"
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 transition-opacity"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <span className="text-xs text-slate-500 mt-0.5 truncate">
              {product.description || product.category || 'No description available.'}
            </span>
            
            <span className="text-[11px] font-mono text-slate-400 mt-1">
              SKU: {product.sku || id?.toString().slice(-8).toUpperCase() || 'N/A'}
            </span>
          </div>

        </div>
      </td>

      {/* 2. PRICE COLUMN */}
      <td className="px-6 py-3.5 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 font-sans">
            {formatPrice ? formatPrice(product.price || 0) : `₹${Number(product.price || 0).toLocaleString()}`}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice ? formatPrice(product.compareAtPrice) : `₹${Number(product.compareAtPrice).toLocaleString()}`}
            </span>
          )}
        </div>
      </td>

      {/* 3. STOCK STATUS BADGES */}
      <td className="px-6 py-3.5 whitespace-nowrap">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Low Stock ({stockCount} left)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            In Stock ({stockCount})
          </span>
        )}
      </td>

      {/* TOGGLE SWITCH FOR HIDE / SHOW */}
      <td className="px-6 py-3.5 whitespace-nowrap">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={product.is_active !== false && product.status !== 'inactive'} 
            onChange={() => handleToggleStatus && handleToggleStatus(id, product.is_active)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="ml-2 text-xs font-medium text-slate-600">
            {product.is_active !== false ? "Visible" : "Hidden"}
          </span>
        </label>
      </td>

      {/* 4. ACTIONS COLUMN */}
      <td className="py-3.5 pl-4 pr-6 whitespace-nowrap text-right">
        <div className="flex justify-end items-center gap-2">
          
          {update && (
            <Link
              to={`/admin/dashboard/updateproducts/${id}`}
              state={{ product }}
              aria-label={`Edit ${product.name}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 text-xs font-medium transition-all shadow-2xs active:scale-98 cursor-pointer"
            >
              <FiEdit2 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Edit</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleDelete(id)}
            aria-label={`Delete ${product.name}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-rose-50/60 hover:border-rose-200 hover:text-rose-600 text-xs font-medium transition-all shadow-2xs active:scale-98 cursor-pointer"
          >
            <FiTrash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" aria-hidden="true" />
            <span>Delete</span>
          </button>

        </div>
      </td>
      
    </tr>
  );
};

export default React.memo(ProductItem);