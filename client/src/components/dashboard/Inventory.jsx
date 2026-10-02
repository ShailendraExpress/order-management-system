import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiSearch, FiPackage, FiAlertTriangle, FiRefreshCw, FiInbox } from 'react-icons/fi';
import { MdInventory } from 'react-icons/md';
import swal from 'sweetalert';

// Import Redux action to fetch product inventory data
import { getProducts } from '../../store/actions/products-actions';

const Inventory = () => {
  const dispatch = useDispatch();
  
  // Safely extract products array from Redux state with secure fallbacks
  const products = useSelector((state) => state.products?.products || state.products?.list || []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Automatically fetch products on component mount for real-time inventory sync
  useEffect(() => {
    const loadInitialInventory = async () => {
      try {
        await dispatch(getProducts());
      } catch (error) {
        console.error('Failed to load initial inventory:', error);
      }
    };
    loadInitialInventory();
  }, [dispatch]);

  // Handle manual refresh / synchronization of inventory data securely
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(getProducts());
      swal("Synced!", "Inventory data updated successfully.", "success");
    } catch (error) {
      console.error('Sync error:', error);
      swal("Error", "Failed to sync inventory data.", "error");
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  // Optimized search filter logic using useMemo to prevent unnecessary re-calculations
  const inventoryData = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return products;

    return products.filter((p) =>
      p.name?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    );
  }, [products, searchTerm]);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* PAGE HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <MdInventory className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Stock Audit</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time warehouse inventory and stock availability.</p>
          </div>
        </div>
        
        {/* Sync / Refresh Button */}
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 h-[42px] px-5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-2xs active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          <FiRefreshCw className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} size={16} /> 
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* INVENTORY TABLE CARD CONTAINER */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col">
        
        {/* TABLE HEADER & SEARCH CONTROLS */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Warehouse Stock</h2>
          
          {/* Search Input Filter */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FiSearch className="text-slate-400 text-sm" />
            </div>
            <input 
              type="text"
              placeholder="Search SKU or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[38px] pl-9 pr-4 bg-slate-50 border border-slate-300 rounded-lg text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* TABLE CONTENT DATA */}
        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3.5">Product / SKU</th>
                <th className="px-6 py-3.5 text-center">Current Stock</th>
                <th className="px-6 py-3.5 text-center">Reorder Point</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {inventoryData.length > 0 ? (
                inventoryData.map((item) => {
                  const stock = Number(item.stock || 0);
                  const reorder = 10; // Standard low stock threshold

                  return (
                    <tr key={item.id || item.sku} className="hover:bg-slate-50/80 transition-colors duration-150 text-sm">
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col min-w-0 max-w-[280px]">
                          <span className="font-semibold text-slate-900 truncate">{item.name}</span>
                          <span className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {item.sku || 'N/A'}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-3.5 text-center">
                        <span className={`font-bold font-mono text-sm ${stock === 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {stock}
                        </span>
                      </td>
                      
                      <td className="px-6 py-3.5 text-center text-slate-400 font-mono text-xs">{reorder}</td>
                      
                      {/* DYNAMIC STOCK STATUS BADGES */}
                      <td className="px-6 py-3.5">
                        {stock === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <FiAlertTriangle className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : stock <= reorder ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <FiPackage className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Stable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* EMPTY STATE FALLBACK */
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center mb-3">
                        <FiInbox className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No inventory found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchTerm ? `No matches found for "${searchTerm}".` : "Your inventory list is currently empty."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER METRICS SUMMARY */}
        {inventoryData.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] uppercase tracking-wider text-slate-500 font-bold gap-2">
            <span>Showing {inventoryData.length} items</span>
            <span>Stock Limit Alert: &le; 10 units</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Inventory);