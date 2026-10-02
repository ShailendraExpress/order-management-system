import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProductItem from './ProductItem';
import { FiEdit3, FiSearch, FiInbox } from 'react-icons/fi';
import swal from 'sweetalert';

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from '../../utils/api';

// Import Redux action to fetch products if available
import { getProducts } from '../../store/actions/products-actions';

const UpdateProducts = () => {
  const dispatch = useDispatch();

  // Safely extract products array from Redux state with multiple fallbacks
  const rawProducts = useSelector((state) => state.products?.products || state.products?.list || []);
  const productsList = Array.isArray(rawProducts) ? rawProducts : [];
  
  // Local search query state & deleting loader state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products automatically on component mount to keep catalog fresh securely
  useEffect(() => {
    const loadProducts = async () => {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }
        await dispatch(getProducts());
      } catch (error) {
        console.error("Failed to load products list:", error);
      }
    };
    loadProducts();
  }, [dispatch]);

  // Optimized live search filtering by name or SKU
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return productsList;

    return productsList.filter((product) => {
      const nameMatch = (product?.name || '').toLowerCase().includes(query);
      const skuMatch = (product?.sku || '').toLowerCase().includes(query);
      return nameMatch || skuMatch;
    });
  }, [productsList, searchQuery]);

  // Secure & Fast Delete Handler via API with SweetAlert confirmation
  const handleDelete = useCallback(async (id) => {
    const willDelete = await swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this product record!",
      icon: "warning",
      buttons: ["Cancel", "Yes, Delete It!"],
      dangerMode: true,
    });

    if (!willDelete) return;

    setIsDeleting(true);
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }
      
      // Call backend DELETE API using standard v1 prefix securely
      const response = await api.delete(`/api/v1/products/${id}`);

      if (response.status === 200 || response.status === 204 || response.data?.success) {
        // Fast UI Update: Redux store se turant item remove karein bina poori list reload kiye
        dispatch({ type: 'DELETE_PRODUCT_SUCCESS', payload: id });
        
        swal("Deleted!", "Product has been successfully deleted.", "success");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      
      // Handle backend errors safely (e.g., product linked to active orders)
      const errorMsg = error?.response?.data?.message || "Failed to delete the product. Please try again.";
      swal("Cannot Delete!", errorMsg, "error");
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen font-sans space-y-6">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xs">
            <FiEdit3 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit & Update Products</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Select any item from your catalog to modify inventory details, pricing, or product specs.
            </p>
          </div>
        </div>

        {/* Live Search Bar Input */}
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
          />
        </div>
      </div>

      {/* 2. MAIN TABLE CARD CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left border-collapse">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="py-3.5 pl-6 pr-4">Product Details</th>
                  <th scope="col" className="px-6 py-3.5">Price</th>
                  <th scope="col" className="px-6 py-3.5">Stock Status</th>
                  <th scope="col" className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredProducts.map((product) => (
                  <ProductItem
                    key={product?.id || product?._id}
                    product={product}
                    update={true}
                    handleDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
              <FiInbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Products Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}". Try a different search keyword.`
                : 'Your catalog is currently empty. Add products to start editing and updating them.'}
            </p>
          </div>
        )}

        {/* TABLE FOOTER COUNTER */}
        {filteredProducts.length > 0 && (
          <div className="bg-slate-50/60 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>
              Showing <strong className="font-semibold text-slate-800">{filteredProducts.length}</strong> of{' '}
              <strong className="font-semibold text-slate-800">{productsList.length}</strong> catalog items
            </span>
            <span className="text-slate-400 font-mono">Select Edit action to modify</span>
          </div>
        )}

      </div>

    </div>
  );
};

export default React.memo(UpdateProducts);