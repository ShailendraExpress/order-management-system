import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  FiChevronRight, FiPackage, FiMapPin, FiCreditCard, FiPrinter, 
  FiCheckCircle, FiClock, FiTruck, FiXCircle, FiAlertTriangle, FiX, 
  FiUploadCloud, FiTrash, FiStar, FiEdit 
} from "react-icons/fi";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import swal from "sweetalert";

const CustomerOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Return Modal States
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [returnForm, setReturnForm] = useState({ 
    reason: "", 
    comment: "",
    quantity: 1,
    action: "refund", 
    images: [] 
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Review Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, headline: "", comment: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Invoice_Order_${orderId}`,
  });

  useEffect(() => {
    fetchOrderDetails();
    // eslint-disable-next-line
  }, [orderId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://127.0.0.1:8000/api/my-orders/${orderId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CANCEL ORDER LOGIC
  // ==========================================
  const handleCancelOrder = async () => {
    const confirm = await swal({
      title: "Cancel Order?",
      text: "Are you sure you want to cancel this order? This action cannot be undone.",
      icon: "warning",
      buttons: ["No, keep it", "Yes, Cancel Order"],
      dangerMode: true,
    });

    if (confirm) {
      try {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
        const response = await axios.post(`http://127.0.0.1:8000/api/my-orders/${orderId}/cancel`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          swal("Cancelled!", "Your order has been cancelled successfully.", "success");
          fetchOrderDetails(); 
        }
      } catch (error) {
        console.error("Error cancelling order:", error);
        swal("Error", error.response?.data?.message || "Failed to cancel order.", "error");
      }
    }
  };

  // ==========================================
  // RETURN ITEM LOGIC
  // ==========================================
  const openReturnModal = (itemData) => {
    setReturnItem(itemData);
    setReturnForm({ reason: "", comment: "", quantity: 1, action: "refund", images: [] });
    setImagePreviews([]);
    setIsReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setIsReturnModalOpen(false);
    setReturnItem(null);
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + returnForm.images.length > 3) {
      swal("Limit Exceeded", "You can upload a maximum of 3 images as proof.", "warning");
      return;
    }
    const newImages = [...returnForm.images, ...files];
    setReturnForm({ ...returnForm, images: newImages });
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...returnForm.images];
    newImages.splice(index, 1);
    setReturnForm({ ...returnForm, images: newImages });
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.reason) {
      swal("Required", "Please select a reason for return.", "warning");
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('order_id', order.id);
      formData.append('item_id', returnItem.id);
      formData.append('product_id', returnItem.product_id);
      formData.append('reason', returnForm.reason);
      formData.append('comment', returnForm.comment);
      formData.append('quantity', returnForm.quantity);
      formData.append('action', returnForm.action);
      
      returnForm.images.forEach((img, index) => {
        formData.append(`images[${index}]`, img); 
      });

      const response = await axios.post(`http://127.0.0.1:8000/api/orders/return-item`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });

      if (response.data.success) {
        swal("Return Requested!", "Your return/replacement request has been submitted successfully.", "success");
        closeReturnModal();
        fetchOrderDetails(); 
      }
    } catch (error) {
      console.error("Return Error:", error);
      swal("Error", error.response?.data?.message || "Failed to place return request.", "error");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // ==========================================
  // REVIEW & RATING LOGIC
  // ==========================================
  const openReviewModal = (itemData, existingReview = null) => {
    setReviewItem(itemData);
    
    if (existingReview) {
      setReviewForm({ 
        rating: existingReview.rating, 
        headline: existingReview.headline || "", 
        comment: existingReview.comment || "" 
      });
      setHoverRating(existingReview.rating);
    } else {
      setReviewForm({ rating: 0, headline: "", comment: "" });
      setHoverRating(0);
    }
    
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewItem(null);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) {
      swal("Rating Required", "Please select a star rating before submitting.", "warning");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      
      const response = await axios.post(`http://127.0.0.1:8000/api/reviews`, {
        order_id: order.id,
        product_id: reviewItem.product_id,
        rating: reviewForm.rating,
        headline: reviewForm.headline,
        comment: reviewForm.comment
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        swal("Thank You!", "Your review has been submitted successfully.", "success");
        closeReviewModal();
        fetchOrderDetails(); 
      }
    } catch (error) {
      console.error("Review Error:", error);
      swal("Error", error.response?.data?.message || "Failed to submit review. Try again.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p>Loading Order Details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">The order you are looking for does not exist or you don't have access.</p>
        <Link to="/my-orders" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Back to My Orders</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 font-sans text-slate-800">
      <div className="max-w-[1500px] w-[95vw] lg:w-[90vw] mx-auto">
        
        <nav className="print:hidden flex items-center text-sm text-slate-500 mb-6 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <FiChevronRight className="mx-2 text-slate-400" />
          <Link to="/my-orders" className="hover:text-slate-900 transition-colors">My Orders</Link>
          <FiChevronRight className="mx-2 text-slate-400" />
          <span className="text-slate-900 font-bold">Order #{order.order_number || order.id}</span>
        </nav>

        <div ref={contentRef} className="print:bg-white print:p-4">
          
          <div className="mb-6 bg-white border border-slate-200 rounded-xl px-6 py-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Order #{order.order_number || order.id}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Placed on {order.created_at ? order.created_at.split('T')[0] : 'N/A'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                {order.status === 'delivered' ? <FiCheckCircle size={14} /> : 
                 order.status === 'cancelled' ? <FiXCircle size={14} /> :
                 order.status === 'pending' ? <FiClock size={14} /> : <FiTruck size={14} />}
                {order.status}
              </div>

              {['pending', 'processing'].includes(order.status?.toLowerCase()) ? (
                <button 
                  onClick={handleCancelOrder}
                  className="print:hidden text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                >
                  <FiXCircle size={14} /> Cancel Order
                </button>
              ) : ['shipped', 'out_for_delivery', 'delivered'].includes(order.status?.toLowerCase()) ? (
                <button 
                  onClick={() => swal("Cannot Cancel", "This order cannot be cancelled anymore as it has already been " + order.status, "info")}
                  className="print:hidden text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full cursor-not-allowed flex items-center gap-1"
                >
                  <FiXCircle size={14} /> Cancellation Unavailable
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                  <FiPackage /> Items Ordered
                </h2>
                
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const returnReq = item.return_request || item.returnRequest;
                    const review = item.review; 

                    return (
                      <div key={index} className="flex flex-col border-b border-slate-100 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
                        
                        {/* Product Basic Info Row */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                          <div className="flex gap-4 flex-1 w-full">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                              {item.product?.image ? (
                                  <img src={`http://127.0.0.1:8000/storage/${item.product.image}`} alt={item.product?.name} className="w-full h-full object-cover" />
                              ) : (
                                  <span className="text-slate-400 text-[10px] font-bold">NO IMG</span>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2">
                                  {item.product?.name || `Product ID: ${item.product_id}`}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-slate-500">
                                  <span>Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-start sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                            <p className="font-bold text-slate-900 text-sm sm:text-base">₹{Number(item.price || 0).toLocaleString()}</p>
                            
                            {/* ACTION BUTTONS: REVIEW AUR RETURN */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              
                              {/* 1. Rate & Review Button - Sirf tab dikhega jab review NAHI kiya hai */}
                              {order.status === 'delivered' && !review && (
                                <button 
                                  onClick={() => openReviewModal(item)}
                                  className="print:hidden text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <FiStar size={12} className="fill-current" /> Rate & Review
                                </button>
                              )}

                              {/* 2. Return / Replace Button - Sirf tab dikhega jab return request NAHI dali hai */}
                              {order.status === 'delivered' && !returnReq && (
                                <button 
                                  onClick={() => openReturnModal(item)}
                                  className="print:hidden text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <FiAlertTriangle size={12} /> Return / Replace
                                </button>
                              )}

                              {/* 3. NAYA: Agar return request daal di hai toh badge dikhayega */}
                              {order.status === 'delivered' && returnReq && (
                                <span className="print:hidden text-xs font-bold text-amber-700 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                                  <FiClock size={12} /> Return {returnReq.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 🔥 PROFESSIONAL SUBMITTED REVIEW UI WITH EDIT BUTTON */}
                       
                       
                     {/* 🔥 COMPACT & RIGHT-ALIGNED SUBMITTED REVIEW UI */}
                        {review && (
                          <div className="mt-6 ml-auto w-full sm:max-w-lg bg-slate-50 border border-slate-200 rounded-xl shadow-sm relative flex flex-col sm:flex-row gap-4 p-4">
                            {/* Decorative Left Border */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400 rounded-l-xl"></div>
                            
                            <div className="flex-1 pl-2">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <FiStar size={12} className="text-yellow-500 fill-current" /> Your Review
                                </h4>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                <div className="flex text-yellow-400 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                                  {[...Array(5)].map((_, i) => (
                                    <FiStar key={i} size={14} className={i < review.rating ? "fill-current" : "text-slate-200"} />
                                  ))}
                                </div>
                                {review.headline && (
                                  <span className="font-bold text-slate-800 text-sm border-l-2 border-slate-200 pl-2.5">
                                    {review.headline}
                                  </span>
                                )}
                              </div>
                              
                              {review.comment && (
                                <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-2">
                                  {review.comment}
                                </p>
                              )}
                              
                              <div className="mt-3 text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                <FiCheckCircle size={13} className="text-emerald-500" /> Verified Purchase
                              </div>
                            </div>

                            {/* Action Buttons Section */}
                            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-center shrink-0">
                              <button 
                                onClick={() => openReviewModal(item, review)}
                                className="w-full sm:w-auto text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 hover:text-blue-600 px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <FiEdit size={12} /> Edit
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-slate-500">No items found for this order.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                  <FiCreditCard /> Order Summary
                </h2>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="uppercase font-bold text-slate-800">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{Number(order.total_price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-slate-100 pt-3 mt-3 text-slate-900">
                    <span>Total Amount</span>
                    <span>₹{Number(order.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handlePrint()} 
                  className="print:hidden mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <FiPrinter /> Download / Print Invoice
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                  <FiMapPin /> Shipping Details
                </h2>
                <p className="text-sm font-bold text-slate-900 mb-1">{order.customer?.name || 'Customer Name'}</p>
                <p className="text-sm text-slate-600">{order.customer?.email}</p>
                <p className="text-sm text-slate-600">{order.customer?.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* REVIEW & RATING MODAL POPUP                    */}
        {/* ============================================== */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
              
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Rate & Review Product</h3>
                <button onClick={closeReviewModal} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full">
                  <FiX size={18} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                <form id="reviewForm" onSubmit={handleReviewSubmit}>
                  
                  {/* Product Info */}
                  <div className="flex gap-4 items-center mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {reviewItem?.product?.image ? (
                        <img src={`http://127.0.0.1:8000/storage/${reviewItem.product.image}`} alt="product" className="w-full h-full object-cover" />
                      ) : (
                        <FiPackage className="text-slate-300" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{reviewItem?.product?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Share your experience with this product.</p>
                    </div>
                  </div>

                  {/* Star Rating System */}
                  <div className="mb-6 flex flex-col items-center justify-center border-b border-slate-100 pb-6">
                    <label className="text-sm font-bold text-slate-800 mb-3">Overall Rating <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, index) => {
                        const starValue = index + 1;
                        return (
                          <button
                            type="button"
                            key={starValue}
                            className={`transition-all duration-200 ${
                              starValue <= (hoverRating || reviewForm.rating) 
                                ? 'text-yellow-400 scale-110' 
                                : 'text-slate-200 hover:text-yellow-200'
                            }`}
                            onClick={() => setReviewForm({ ...reviewForm, rating: starValue })}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                          >
                            <FiStar size={36} className={starValue <= (hoverRating || reviewForm.rating) ? "fill-current" : ""} />
                          </button>
                        );
                      })}
                    </div>
                    {reviewForm.rating > 0 && (
                      <p className="text-xs font-bold text-yellow-600 mt-3 bg-yellow-50 px-3 py-1 rounded-full">
                        {reviewForm.rating === 1 && "1 Star - Very Poor"}
                        {reviewForm.rating === 2 && "2 Stars - Poor"}
                        {reviewForm.rating === 3 && "3 Stars - Average"}
                        {reviewForm.rating === 4 && "4 Stars - Good"}
                        {reviewForm.rating === 5 && "5 Stars - Excellent!"}
                      </p>
                    )}
                  </div>

                  {/* Headline */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Add a headline</label>
                    <input 
                      type="text"
                      value={reviewForm.headline}
                      onChange={(e) => setReviewForm({...reviewForm, headline: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                      placeholder="What's most important to know?"
                    />
                  </div>

                  {/* Written Review */}
                  <div className="mb-2">
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Add a written review</label>
                    <textarea 
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 min-h-[120px] resize-none"
                      placeholder="What did you like or dislike? What did you use this product for?"
                    ></textarea>
                  </div>

                </form>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={closeReviewModal}
                  className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="reviewForm"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>

            </div>
          </div>
        )}

       {/* ============================================== */}
        {/* PREMIUM & EXPANDED RETURN MODAL POPUP           */}
        {/* ============================================== */}
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[92vh]">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2.5">
                  <FiAlertTriangle className="text-red-500 text-2xl animate-pulse" /> Return / Replace Item
                </h3>
                <button onClick={closeReturnModal} className="text-slate-400 hover:text-slate-700 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full border border-slate-200 shadow-sm">
                  <FiX size={18} />
                </button>
              </div>

              {/* Modal Content Form */}
              <div className="overflow-y-auto p-8 flex-1 custom-scrollbar space-y-6">
                <form id="returnForm" onSubmit={handleReturnSubmit} className="space-y-6">
                  
                  {/* Action Selection (Radio Group) */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">What do you want?</label>
                    <div className="flex flex-wrap gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 cursor-pointer group">
                        <input type="radio" name="action" value="refund" checked={returnForm.action === 'refund'} onChange={(e) => setReturnForm({...returnForm, action: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                        <span className="group-hover:text-slate-900 transition-colors">Refund Money</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 cursor-pointer group">
                        <input type="radio" name="action" value="replacement" checked={returnForm.action === 'replacement'} onChange={(e) => setReturnForm({...returnForm, action: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                        <span className="group-hover:text-slate-900 transition-colors">Replace Item</span>
                      </label>
                    </div>
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Reason for Return <span className="text-red-500">*</span></label>
                    <select 
                      value={returnForm.reason} 
                      onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                      required
                    >
                      <option value="">Select a valid reason...</option>
                      <option value="Damaged Product">Product was damaged or defective</option>
                      <option value="Wrong Item">Received wrong item entirely</option>
                      <option value="Missing Parts">Item is missing parts/accessories</option>
                      <option value="Not as Described">Product does not match description</option>
                      <option value="Other">Other reason</option>
                    </select>
                  </div>

                  {/* Comments Box */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Additional Comments (Optional)</label>
                    <textarea 
                      value={returnForm.comment}
                      onChange={(e) => setReturnForm({...returnForm, comment: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all min-h-[110px] resize-none shadow-sm placeholder:text-slate-400"
                      placeholder="Please explain the exact issue in detail here..."
                    ></textarea>
                  </div>

                  {/* Premium Upload Zone */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Upload Images (Max 3)</label>
                    
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group shadow-inner">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                        <FiUploadCloud size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">Click to upload images</p>
                        <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG or JPG up to 2MB each (Max 3 proofs)</p>
                      </div>
                    </label>

                    {/* Image Previews with Delete Badge */}
                    {imagePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        {imagePreviews.map((src, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden shadow-sm group bg-white shrink-0">
                            <img src={src} alt="proof-preview" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => removeImage(idx)} 
                              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <FiTrash size={16} className="text-red-200 hover:text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </form>
              </div>

              {/* Modal Footer Buttons */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0">
                <button 
                  type="button" 
                  onClick={closeReturnModal} 
                  className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="returnForm" 
                  disabled={isSubmittingReturn} 
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-md shadow-red-200 active:scale-[0.98]"
                >
                  {isSubmittingReturn ? "Submitting Request..." : "Submit Request"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerOrderDetails;