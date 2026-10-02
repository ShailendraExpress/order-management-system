import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard,
  FiPrinter, FiEdit, FiUser, FiAlertCircle
} from "react-icons/fi";
import swal from "sweetalert";

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from "../../utils/api";

const OrderDetails = () => {
  const params = useParams();
  const navigate = useNavigate();

  // Support both 'orderId' or 'id' from route parameters
  const orderId = params.orderId || params.id;

  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Invoice_${orderId || 'Order'}`,
  });

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("pending");

  // Fetch Order Details securely on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchOrderDetails = async () => {
      if (!orderId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        const response = await api.get(`/api/v1/orders/${orderId}`);

        if (isMounted && response.data) {
          const orderData = response.data.data || response.data;
          setOrder(orderData);
          setSelectedStatus(orderData?.status || "pending");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        if (isMounted) {
          swal("Error", "Could not fetch order details.", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Handle Order Status Update securely
  const handleStatusUpdate = async () => {
    if (!orderId) return;

    setUpdating(true);
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }

      const response = await api.patch(`/api/v1/orders/${orderId}/status`, {
        status: selectedStatus
      });

      if (response.data) {
        const updatedOrder = response.data.data || response.data;
        setOrder(updatedOrder);
        swal("Updated!", "Order status changed to " + selectedStatus.toUpperCase(), "success");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      swal("Failed", "Could not update order status.", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Helper for dynamic status badge styling
  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* BACK BUTTON (Hidden during printing) */}
      <button
        onClick={() => navigate(-1)}
        className="print:hidden mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-all cursor-pointer"
      >
        <FiArrowLeft /> Back to All Orders
      </button>

      {/* PRINT TARGET CONTAINER WRAPPER */}
      <div ref={contentRef} className="print:bg-white print:p-4 space-y-6">

        {/* HEADER & STATUS CONTROL BAR - ALWAYS VISIBLE */}
        <div className="bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900">
                Order Details: {order?.order_number || order?.id || (loading ? "Loading..." : "N/A")}
              </h1>
              {order && (
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadgeStyle(order?.status)}`}>
                  {order?.status || 'Pending'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {order?.created_at ? `Placed on ${String(order.created_at).replace('T', ' ').substring(0, 16)}` : 'Manage and update order fulfillment.'}
            </p>
          </div>

          {/* STATUS UPDATE CONTROL SECTION (Hidden if loading) */}
          {!loading && order && (
            <div className="print:hidden flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <FiEdit className="text-slate-400 ml-2" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer uppercase"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out For Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === order?.status}
                className={`px-4 py-1.5 rounded-md text-xs font-bold text-white transition-all cursor-pointer ${updating || selectedStatus === order?.status ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-md'
                  }`}
              >
                {updating ? 'UPDATING...' : 'UPDATE'}
              </button>
            </div>
          )}
        </div>

        {/* DYNAMIC CONTENT AREA WITH SPINNER / NOT FOUND / SUCCESS STATES */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-20 text-center shadow-xs">
            <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2 align-middle"></div>
            <span className="text-sm font-semibold text-slate-500">Loading order details...</span>
          </div>
        ) : !order ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-xs max-w-md mx-auto mt-10">
            <FiAlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">The requested order ID does not exist or has been removed.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            {/* 📊 ORDER PROGRESS TIMELINE (Modern Sleek Stepper) */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Order Progress Flow</h2>

              <div className="flex flex-col sm:flex-row items-center justify-between relative gap-4 sm:gap-0">
                {[
                  { label: 'Pending', key: 'pending' },
                  { label: 'Processing', key: 'processing' },
                  { label: 'Shipped', key: 'shipped' },
                  { label: 'Out For Delivery', key: 'out_for_delivery' },
                  { label: 'Delivered', key: 'delivered' }
                ].map((step, idx, arr) => {
                  const statusOrder = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
                  const currentIndex = statusOrder.indexOf(order?.status?.toLowerCase());
                  const isPassed = currentIndex >= idx;
                  const isCurrent = statusOrder[currentIndex] === step.key;

                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative z-10 w-full sm:w-auto">
                      {/* Step Circle with Icon/Number */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCurrent
                          ? 'bg-slate-900 text-white ring-4 ring-slate-100 shadow-md scale-110'
                          : isPassed
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                        {isPassed && !isCurrent ? '✓' : idx + 1}
                      </div>

                      {/* Step Label */}
                      <span className={`text-[11px] font-bold mt-2 text-center uppercase tracking-wider ${isCurrent ? 'text-slate-900 font-black' : isPassed ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRID LAYOUT FOR ITEMS AND CUSTOMER INFO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* LEFT COLUMN: ITEMS LIST */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <FiPackage /> Items in Order ({order?.items?.length || 0})
                  </h2>

                  {order?.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div key={index} className="flex gap-4 items-center border-b border-slate-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                          {item?.product?.image ? (
                            <img
                              src={item.product.image.startsWith('http') ? item.product.image : `http://127.0.0.1:8000/storage/${item.product.image}`}
                              alt={item?.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold">NO IMG</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-sm line-clamp-1" title={item?.product?.name}>
                            {item?.product?.name || `Product ID: ${item?.product_id}`}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                            <span>Qty: <strong className="text-slate-700">{item?.quantity || 1}</strong></span>
                            {item?.product?.sku && <span>• SKU: {item.product.sku}</span>}
                          </div>
                        </div>

                        <p className="font-bold text-slate-900 text-sm font-mono">₹{Number((item?.price || 0) * (item?.quantity || 1)).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No items found for this order.</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: CUSTOMER & PAYMENT SUMMARY */}
              <div className="space-y-6">

                {/* CUSTOMER DETAILS */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <FiUser /> Customer Information
                  </h2>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{order?.customer?.name || order?.shipping_address?.name || 'Unknown Customer'}</p>
                    <p className="text-xs text-slate-600">{order?.customer?.email || order?.shipping_address?.email || 'N/A'}</p>
                    <p className="text-xs text-slate-600 font-mono">{order?.customer?.phone || order?.shipping_address?.phone || 'N/A'}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <FiMapPin /> Shipping Address
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {order?.shipping_address ? (
                        <>
                          {order.shipping_address.address_line1}, {order.shipping_address.address_line2 && `${order.shipping_address.address_line2}, `}
                          {order.shipping_address.city}, {order.shipping_address.state} - <span className="font-mono font-bold">{order.shipping_address.pincode}</span>
                          <br />{order.shipping_address.country || 'India'}
                        </>
                      ) : (
                        'Address details not provided.'
                      )}
                    </p>
                  </div>
                </div>

                {/* PAYMENT SUMMARY */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <FiCreditCard /> Payment Summary
                  </h2>

                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Payment Method</span>
                      <span className="uppercase font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{order?.payment_method || 'Online'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{Number(order?.total_price || order?.subtotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Charges</span>
                      <span className="font-mono text-emerald-600 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-3 mt-3 text-slate-900">
                      <span>Total Amount</span>
                      <span className="font-mono">₹{Number(order?.total_price || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* PRINT INVOICE BUTTON */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="print:hidden mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
                  >
                    <FiPrinter /> Print Invoice
                  </button>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;