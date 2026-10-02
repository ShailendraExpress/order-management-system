import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  FiArrowLeft, FiPrinter, FiCreditCard, FiUser, 
  FiFileText, FiExternalLink, FiCheckCircle, FiXCircle, FiInfo, FiActivity, FiShield
} from "react-icons/fi";
import swal from "sweetalert";
import { formatPrice } from "../../utils/helpers";

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from "../../utils/api";

const TransactionDetails = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configuration for ReactToPrint
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Transaction_Receipt_${orderNumber || 'Unknown'}`,
  });

  // Securely Fetch Transaction Details
  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        const response = await api.get(`/api/v1/admin/transaction-details/${orderNumber}`);
        
        if (isMounted) {
          const responseData = response.data?.data || response.data || null;
          if (responseData) {
            setData(responseData);
          }
        }
      } catch (err) {
        console.error("Error fetching transaction details:", err);
        if (isMounted) {
          swal("Error", "Could not load transaction details from the server.", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  const isSuccess = data?.payment_status?.toLowerCase() === 'success' || data?.payment_status?.toLowerCase() === 'paid';

  return (
    // ✅ FIX: Removed max-w container, added w-full flex-1 so it matches all other pages exactly
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* Back Button - Hamesha dikhega */}
      <button 
        onClick={() => navigate(-1)} 
        className="print:hidden mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-all cursor-pointer w-fit"
      >
        <FiArrowLeft /> Back to Transactions
      </button>

      {/* Main Content Wrapper - Printable Area */}
      <div ref={contentRef} className="print:bg-white print:p-8 w-full">
        
        {/* HEADER SECTION */}
        <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:border-none print:shadow-none print:px-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
               <FiCreditCard size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Transaction Details</h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold flex items-center gap-1">
                ID: 
                {loading ? (
                  <span className="w-32 h-3 bg-slate-200 rounded animate-pulse inline-block"></span>
                ) : (
                  <span className="font-mono text-slate-700">{data?.transaction_id || 'N/A'}</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          {!loading && data && (
            <div className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border w-fit ${
              isSuccess 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isSuccess ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
              {data.payment_status || 'Pending'}
            </div>
          )}
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
          {/* SKELETON LOADER */}
          {loading ? (
            <>
              <div className="xl:col-span-2 space-y-6">
                <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
                <div className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
                <div className="h-12 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
            </>
          ) : !data ? (
            
            /* DATA NOT FOUND */
            <div className="xl:col-span-3 bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
              <FiInfo className="text-slate-300 text-5xl mb-3" />
              <h3 className="text-lg font-bold text-slate-700">Transaction Not Found</h3>
              <p className="text-slate-500 text-sm mt-1">We couldn't find any data for this transaction ID.</p>
            </div>

          ) : (
            
            /* ACTUAL DATA LAYOUT */
            <>
              {/* LEFT COLUMN: Payment Info & Breakdown */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Basic Payment Info */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm print:border-slate-300">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                    <FiFileText size={16} /> Payment Information
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Amount Paid</p>
                      <span className="font-black text-slate-900 text-lg font-mono">
                        {formatPrice ? formatPrice(data.total_price) : `₹${Number(data.total_price || 0).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Method</p>
                      <span className="font-bold text-slate-900 capitalize block text-base">{data.payment_method || 'N/A'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Date</p>
                      <span className="font-bold text-slate-900 block text-sm">
                        {data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* REAL-WORLD ADDITION: Payment Breakdown & Gateway Details */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm print:border-slate-300">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                    <FiActivity size={16} /> Gateway Reference & Breakdown
                  </h2>

                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Breakdown List */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 font-medium">Gross Transaction Amount</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {formatPrice ? formatPrice(data.total_price) : `₹${Number(data.total_price || 0).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 pb-3">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          Gateway Fee <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">Est. 2%</span>
                        </span>
                        <span className="font-bold text-rose-600 font-mono">
                          - {formatPrice ? formatPrice((data.total_price * 0.02)) : `₹${Number((data.total_price * 0.02) || 0).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700">Net Settlement Amount</span>
                        <span className="font-black text-emerald-600 text-base font-mono">
                          {formatPrice ? formatPrice((data.total_price * 0.98)) : `₹${Number((data.total_price * 0.98) || 0).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    </div>

                    {/* Reference Details */}
                    <div className="w-full md:w-64 bg-slate-50 rounded-xl p-5 border border-slate-100 h-fit shrink-0">
                      <div className="mb-4">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5"><FiShield size={12}/> Gateway / Bank UTR</p>
                        <p className="font-mono text-xs font-bold text-slate-800 break-all bg-white px-2 py-1 border border-slate-200 rounded">{data.gateway_reference || data.transaction_id || 'Not Available'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Payment Mode Details</p>
                        <p className="text-xs font-bold text-slate-700 capitalize">{data.payment_method_details || 'Standard Integration'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Customer & Actions Sidebar */}
              <div className="space-y-6">
                
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm print:border-slate-300">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
                    <FiUser size={16} /> Customer & Order
                  </h2>
                  
                  {/* Customer Box */}
                  <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-900 text-base truncate" title={data.customer?.name}>
                      {data.customer?.name || 'Guest User'}
                    </p>
                    <p className="text-sm font-medium text-slate-600 truncate" title={data.customer?.email}>
                      {data.customer?.email || 'N/A'}
                    </p>
                  </div>

                  {/* Order Link */}
                  <div className="pt-5 mt-5 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Linked Order ID</p>
                    
                    {/* Screen Version (Link) */}
                    <Link 
                      to={`/admin/dashboard/orders/${data.id || data.order_number}`} 
                      className="print:hidden font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 w-fit transition-colors bg-blue-50/50 px-3 py-1.5 rounded-md border border-blue-100"
                    >
                      {data.order_number || 'N/A'} <FiExternalLink size={14} />
                    </Link>

                    {/* Print Version (Text only) */}
                    <span className="hidden print:block font-bold text-slate-900 font-mono">
                      {data.order_number || 'N/A'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="print:hidden w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                >
                  <FiPrinter size={16} /> Print Receipt
                </button>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;