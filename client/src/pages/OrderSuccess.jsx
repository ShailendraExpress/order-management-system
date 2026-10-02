import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaCheckCircle, FaShoppingBag, FaArrowLeft, FaBoxOpen, FaTruck, FaRegCalendarAlt, FaIdCard } from 'react-icons/fa';
import { formatPrice } from '../utils/helpers'; 

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract data passed from the Checkout page
    const orderData = location.state?.orderData;

    // Use passed data or fallback to defaults
    const orderId = orderData?.orderNumber || `ORD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    // Get date from orderData if exists, else today's date
    const orderDate = orderData?.date || new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    // Get transaction ID if exists
    const transactionId = orderData?.transactionId || 'N/A';

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
        
    }, []);

    // Security Check: If accessed directly without placing an order
    if (!orderData) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
                <FaBoxOpen className="text-6xl text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Recent Orders Found</h2>
                <p className="text-gray-500 mb-6">Looks like you haven't placed an order recently.</p>
                <button 
                    onClick={() => navigate('/products')}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    Return to Shop
                </button>
            </div>
        );
    }

    return (
        // Changed to min-h-[80vh] so footer stays at bottom without causing unnecessary scroll
        <div className="min-h-[70vh] bg-gray-100 flex items-center justify-center py-10 px-4 sm:px-6 font-sans">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform transition-all">
                
                {/* --- HEADER SECTION (Green part height reduced) --- */}
                <div className="bg-green-600 px-8 py-6 text-center relative overflow-hidden">
                    {/* Subtle background pattern/circles for premium look */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white"></div>
                        <div className="absolute bottom-10 -right-10 w-32 h-32 rounded-full bg-white"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-3 animate-bounce">
                            <FaCheckCircle className="text-4xl text-green-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                            Order Placed Successfully!
                        </h1>
                        <p className="text-green-100 text-base">
                            Thank you for shopping with us. Your order is confirmed.
                        </p>
                    </div>
                </div>

                {/* --- BODY SECTION (RECEIPT) --- */}
                <div className="p-6 sm:p-10">
                    
                    {/* Order ID & Date Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
                        <div className="text-center sm:text-left mb-3 sm:mb-0">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Order Number</p>
                            <p className="text-lg font-bold text-gray-900">{orderId}</p>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-gray-300"></div>
                        <div className="text-center sm:text-right flex items-center gap-2">
                            <FaRegCalendarAlt className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Date</p>
                                <p className="text-sm font-bold text-gray-900">{orderDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Box (Dashed Receipt Style) */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 mb-8 relative">
                        {/* Receipt cutouts */}
                        <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white rounded-full border-r-2 border-dashed border-gray-300 transform -translate-y-1/2"></div>
                        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-white rounded-full border-l-2 border-dashed border-gray-300 transform -translate-y-1/2"></div>

                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <FaShoppingBag className="text-blue-500" /> Payment Summary
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Total Amount:</span>
                                <span className="font-extrabold text-xl text-gray-900">{formatPrice(orderData.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Payment Method:</span>
                                <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                                    {orderData.method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                                </span>
                            </div>
                            {/* Transaction ID & Date Display */}
                            <div className="flex justify-between items-center text-gray-700 pt-2 border-t border-dashed">
                                <span className="font-medium flex items-center gap-2"><FaIdCard className="text-blue-500" /> Transaction ID:</span>
                                <span className="font-bold text-gray-900 text-sm">{transactionId}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Status / Timeline */}
                    <div className="mb-10">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">What happens next?</h3>
                        <div className="flex justify-between items-center relative">
                            {/* Connecting Line */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full"></div>
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1/3 h-1 bg-green-500 z-0 rounded-full"></div>
                            
                            {/* Step 1 */}
                            <div className="relative z-10 flex flex-col items-center bg-white px-2">
                                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md mb-2">
                                    <FaCheckCircle className="text-lg" />
                                </div>
                                <span className="text-xs font-bold text-gray-900 text-center">Order<br/>Placed</span>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 flex flex-col items-center bg-white px-2">
                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2">
                                    <FaBoxOpen className="text-lg" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 text-center">Processing<br/>Order</span>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 flex flex-col items-center bg-white px-2">
                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2">
                                    <FaTruck className="text-lg" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 text-center">Out for<br/>Delivery</span>
                            </div>
                        </div>
                    </div>

                    {/* --- ACTION BUTTONS --- */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/my-orders" 
                            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md focus:ring-4 focus:ring-gray-200"
                        >
                            Track Order Details
                        </Link>
                        
                        <Link 
                            to="/products" 
                            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-800 font-bold border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all"
                        >
                            <FaArrowLeft className="text-sm" /> Continue Shopping 
                        </Link>
                    </div>

                </div>

                {/* --- FOOTER --- */}
                <div className="bg-gray-50 border-t border-gray-100 p-6 text-center">
                    <p className="text-xs text-gray-500">
                        A confirmation email has been sent to your registered address. <br className="hidden sm:block" />
                        Need help? <Link to="/contact" className="text-blue-600 font-semibold hover:underline">Contact our support team</Link>.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default OrderSuccess;