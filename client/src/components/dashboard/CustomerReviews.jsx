import React, { useState, useMemo, useEffect } from 'react';
import ReactPaginate from 'react-paginate';
import { FiMessageSquare, FiSearch, FiStar, FiTrash2, FiEye } from 'react-icons/fi';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import swal from 'sweetalert';

// Using the secure global API instance
import api from '../../utils/api';

const CustomerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;

  // 1. Fetch Reviews on Component Load
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Direct API call using the global instance (Bearer token is already attached by api.js)
      // Note: Assuming '/api/v1/admin/reviews' based on previous route fixes. 
      const response = await api.get('/api/v1/admin/reviews'); 

      if (response.data) {
        // Flexible data check: Works whether Laravel sends { data: [...] } or just [...]
        const fetchedData = response.data.data || response.data.reviews || response.data;
        setReviews(Array.isArray(fetchedData) ? fetchedData : []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Delete Review Function
  const handleDelete = async (id) => {
    const confirm = await swal({
      title: "Delete Review?",
      text: "Are you sure you want to delete this customer review? This cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Yes, Delete"],
      dangerMode: true,
    });

    if (confirm) {
      try {
        // Replaced raw axios with the secure global api instance
        const response = await api.delete(`/api/v1/admin/reviews/${id}`);

        // Flexible success check
        if (response.data && (response.data.success || response.status === 200 || response.status === 204)) {
          swal("Deleted!", "The review has been deleted.", "success");
          setReviews(reviews.filter(rev => rev.id !== id));
        }
      } catch (error) {
        console.error("Error deleting review:", error);
        swal("Error", "Failed to delete review.", "error");
      }
    }
  };

  // 3. Search Filter Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const customerName = r.customer?.name || '';
      const productName = r.product?.name || '';
      const commentText = r.comment || '';

      return (
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commentText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, reviews]);

  // 4. Pagination Logic
  const endOffset = itemOffset + itemsPerPage;
  const currentItems = filteredReviews.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filteredReviews.length / itemsPerPage);
  const handlePageClick = (e) => setItemOffset((e.selected * itemsPerPage) % filteredReviews.length);


  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <FiMessageSquare className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Customer Reviews</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage and moderate product feedback from customers.</p>
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <FiSearch className="text-slate-400 text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search by name, product or comment..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setItemOffset(0); // Reset page to 1 when searching
            }}
            disabled={loading} // Search remains disabled during loading
            className="w-full h-[42px] pl-9 pr-4 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all disabled:opacity-60"
          />
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="w-full bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            {/* <thead> ALWAYS VISIBLE */}
            <thead className="bg-slate-50/75 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Customer</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Product</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Rating</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500">Comment</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                /* LOADING STATE - Spinner inside the table */
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-3"></div>
                      <p className="text-sm font-bold text-slate-500">Fetching Reviews...</p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                /* DATA STATE - Reviews list */
                currentItems.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-slate-900">
                      {rev.customer?.name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {rev.product?.name || `Product #${rev.product_id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} size={14} className={i < rev.rating ? "fill-current" : "text-slate-200"} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {rev.headline && <span className="font-bold text-slate-800 block mb-0.5">{rev.headline}</span>}
                      {rev.comment || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => swal(rev.headline || "Review", rev.comment || "No comment provided", "info")}
                        className="text-slate-400 hover:text-blue-600 mr-4 transition-colors cursor-pointer"
                        title="View Full Review"
                      >
                        <FiEye />
                      </button>
                      <button 
                        onClick={() => handleDelete(rev.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* EMPTY STATE - If no data is found */
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FiMessageSquare size={32} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium text-slate-500">No reviews found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION - Visible only after loading is complete and multiple pages exist */}
        {!loading && filteredReviews.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Showing {itemOffset + 1} to {Math.min(endOffset, filteredReviews.length)} of {filteredReviews.length} reviews
            </div>
            <ReactPaginate
              onPageChange={handlePageClick}
              pageCount={pageCount}
              containerClassName={"flex items-center space-x-1"}
              pageClassName={"w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-xs cursor-pointer hover:bg-slate-100 transition-colors"}
              activeClassName={"!bg-slate-900 !text-white !border-slate-900"}
              previousLabel={<ArrowBackIosIcon style={{ fontSize: 10 }} />}
              nextLabel={<ArrowForwardIosIcon style={{ fontSize: 10 }} />}
              previousClassName={"w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"}
              nextClassName={"w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"}
              disabledClassName={"opacity-50 cursor-not-allowed"}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;