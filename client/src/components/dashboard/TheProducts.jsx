import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactPaginate from 'react-paginate';
import ProductItem from './ProductItem'; // Curly braces ke bina default import
import swal from 'sweetalert';

// Import secure actions and CSRF helper
import { getProducts, deleteProduct } from '../../store/actions/products-actions';
import { getCsrfCookie } from '../../utils/api';
import api from '../../utils/api';

// Icons
import { BsBoxSeam } from 'react-icons/bs';
import { FiSearch, FiPlus } from 'react-icons/fi';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { Link } from 'react-router-dom';

const TheProducts = () => {
  const dispatch = useDispatch();
  
  // Extract authentication token securely from Redux state
  const token = useSelector((state) => state.auth?.token);

  // Fetch products automatically on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }
        dispatch(getProducts());
      } catch (error) {
        console.error("Error fetching inventory products:", error);
      }
    };
    loadProducts();
  }, [dispatch]);

  // Safely extract products array from Redux store with multiple fallbacks
  const rawProducts = useSelector((state) => state.products?.products || state.products?.items || state.products?.list || []);
  const [productsList, setProductsList] = useState([]);

  // Sync products list when redux state changes
  useEffect(() => {
    setProductsList(Array.isArray(rawProducts) ? rawProducts : []);
  }, [rawProducts]);

  const [searchTerm, setSearchTerm] = useState('');
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;

  // Optimized live search filtering across product name, description, category, and brand
  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return productsList;

    return productsList.filter((product) => {
      const name = product?.name || '';
      const desc = product?.description || '';
      const cat = product?.category || '';
      const brand = product?.brand || '';
      
      return name.toLowerCase().includes(query) ||
             desc.toLowerCase().includes(query) ||
             cat.toLowerCase().includes(query) ||
             brand.toLowerCase().includes(query);
    });
  }, [productsList, searchTerm]);

  // Pagination calculation metrics
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = filteredProducts.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handle pagination page change events smoothly
  const handlePageClick = useCallback((event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredProducts.length;
    setItemOffset(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [itemsPerPage, filteredProducts.length]);

  // Handle search query input changes and reset pagination offset
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setItemOffset(0);
  }, []);

  // Handle Product Visibility Toggle (Visible/Hidden)
  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }
      
      // Call API to toggle status on backend
      await api.put(`/api/v1/products/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state smoothly
      setProductsList(prev => 
        prev.map(p => (p.id === id || p._id === id ? { ...p, is_active: !p.is_active, status: p.is_active ? 'inactive' : 'active' } : p))
      );
    } catch (error) {
      console.error("Failed to toggle product status:", error);
      swal("Error", "Could not update product status.", "error");
    }
  }, [token]);

  // Secure Delete Handler with SweetAlert confirmation
  const handleDelete = useCallback((id) => {
    swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this product record!",
      icon: "warning",
      buttons: ["Cancel", "Yes, Delete it!"],
      dangerMode: true,
    })
    .then(async (willDelete) => {
      if (willDelete) {
        try {
          if (typeof getCsrfCookie === 'function') {
            await getCsrfCookie();
          }
          await dispatch(deleteProduct(id, token)); 
          setProductsList(prev => prev.filter(p => p.id !== id && p._id !== id));
        } catch (error) {
          console.error("Failed to delete product in component:", error);
        }
      }
    });
  }, [dispatch, token]);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 1. SEPARATE TOP HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <BsBoxSeam className="text-xl" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Product Inventory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage catalog items, track stock status, and monitor pricing.
            </p>
          </div>
        </div>

        {/* Controls: Aligned Search Bar & Quick Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FiSearch className="text-slate-400 text-sm" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search by product name, SKU..."
              value={searchTerm}
              onChange={handleSearch}
              aria-label="Search products"
              className="w-full h-[42px] pl-9 pr-4 bg-slate-50 border border-slate-300 rounded-lg text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-2xs"
            />
          </div>

          <Link
            to="/admin/dashboard/addproduct"
            className="inline-flex items-center justify-center gap-2 h-[42px] px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all shadow-xs hover:shadow active:scale-98 border border-slate-900 cursor-pointer"
          >
            <FiPlus className="text-lg text-slate-300 flex-shrink-0" aria-hidden="true" />
            <span>Add Product</span>
          </Link>
        </div>

      </div>

      {/* 2. SEPARATE MAIN TABLE CARD CONTAINER */}
      <div className="w-full bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[520px]">
        
        {/* TABLE SECTION */}
        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            
            <thead className="bg-slate-50/75 border-b border-slate-200/80">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-1/2">
                  Product Details
                </th>
                <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Price
                </th>
                <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Stock Status
                </th>
                <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Visibility
                </th>
                <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-100">
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <ProductItem 
                    key={product.id || product._id} 
                    product={product} 
                    update={true} 
                    handleDelete={handleDelete}
                    handleToggleStatus={handleToggleStatus}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center mb-3">
                        <FiSearch className="w-5 h-5 text-slate-400" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No products found</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        We couldn't find anything matching "{searchTerm}". Try refining your keywords or clearing the search.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            
          </table>
        </div>

        {/* FOOTER & PAGINATION SECTION */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredProducts.length > 0 ? itemOffset + 1 : 0}</span> to <span className="font-bold text-slate-800">{Math.min(endOffset, filteredProducts.length)}</span> of <span className="font-bold text-slate-800">{filteredProducts.length}</span> results
          </div>

          {pageCount > 1 && (
            <ReactPaginate
              onPageChange={handlePageClick}
              pageCount={pageCount}
              pageRangeDisplayed={3}
              marginPagesDisplayed={1}
              breakLabel={'...'}
              containerClassName={"flex items-center space-x-1"}
              previousLabel={<ArrowBackIosIcon style={{ fontSize: 10 }} />}
              previousClassName={"flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"}
              previousLinkClassName={"w-full h-full flex items-center justify-center outline-none"}
              nextLabel={<ArrowForwardIosIcon style={{ fontSize: 10 }} />}
              nextClassName={"flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"}
              nextLinkClassName={"w-full h-full flex items-center justify-center outline-none"}
              pageClassName={"flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"}
              pageLinkClassName={"w-full h-full flex items-center justify-center outline-none"}
              activeClassName={"!bg-slate-900 !border-slate-900 !text-white font-bold shadow-xs hover:!bg-slate-800"}
              breakClassName={"flex items-center justify-center w-8 h-8 text-slate-400 text-xs"}
              disabledClassName={"opacity-40 cursor-not-allowed hover:bg-white shadow-none pointer-events-none"}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default React.memo(TheProducts);