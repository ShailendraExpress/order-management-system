import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';
import axios from 'axios';
import { FaCreditCard, FaMoneyBillWave, FaShieldAlt, FaLock } from 'react-icons/fa';

import { formatPrice } from '../../utils/helpers';
import { cartActions } from '../../store/cart-slice';

// Razorpay Script Loader
const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const CheckoutContent = ({ totalPrice, name }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux Data
    const cartItems = useSelector((state) => state.cart.items);
    const discountPercent = useSelector((state) => state.cart.discountPercent || 0);
    const appliedCoupon = useSelector((state) => state.cart.appliedCoupon || '');

    // Calculations
    const discountAmount = (totalPrice * discountPercent) / 100;
    const priceAfterDiscount = totalPrice - discountAmount;
    const GST_RATE = 0.09; 
    const cgstAmount = priceAfterDiscount * GST_RATE;
    const sgstAmount = priceAfterDiscount * GST_RATE;
    const finalTotal = priceAfterDiscount + cgstAmount + sgstAmount;

    // UI States
    const [loading, setLoading] = useState(false);
    const [razorpayKey, setRazorpayKey] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('online'); // Default is 'online'

    // Address States (Structured and Professional)
    const [addressDetails, setAddressDetails] = useState({
        street: '',
        city: '',
        pinCode: '',
        landmark: '',
    });

    // Handle input change for address fields
    const handleAddressChange = (e) => {
        setAddressDetails({ ...addressDetails, [e.target.name]: e.target.value });
    };

    // Fetch Razorpay Key
    useEffect(() => {
        let isMounted = true;
        axios.get('http://127.0.0.1:8000/api/payment-config')
            .then(res => {
                if (isMounted) setRazorpayKey(res.data.key);
            })
            .catch(err => console.error("Key fetch failed"));
        return () => { isMounted = false; };
    }, []);

// Final API Call to Server
const finalOrderSubmit = async (paymentResponse = null) => {
    console.log("DEBUG: Payment Response received:", paymentResponse);
    try {
        const token = localStorage.getItem('customer_token');
        
        // Format address into a single string for the backend
        const formattedAddress = `${addressDetails.street}, ${addressDetails.landmark ? addressDetails.landmark + ', ' : ''}${addressDetails.city} - ${addressDetails.pinCode}`;

        const payload = {
            customer_id: 1, 
            total_price: finalTotal,
            coupon_applied: appliedCoupon,
            discount_amount: discountAmount,
            payment_method: paymentMethod,
            delivery_address: formattedAddress,
            payment_details: paymentResponse, 
            items: cartItems.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        const response = await axios.post('http://127.0.0.1:8000/api/place-order', payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 1. Backend se aaya hua order_number yahan capture karein
        const serverOrderNumber = response.data.order_number;

        dispatch(cartActions.clearCart());
        
        swal({
            title: "Order Placed Successfully!",
            // 2. Swals mein Order Number dikhayein
            text: `Order ID: ${serverOrderNumber}\nTotal: ${formatPrice(finalTotal)}\nThank you for shopping with us!`,
            icon: "success",
            buttons: {
                confirm: { text: "View Order Receipt", className: "bg-green-600 hover:bg-green-700 text-white" }
            }
        }).then(() => {

            // Yahan hum extract kar rahe hain ID
    const transId = paymentResponse && paymentResponse.razorpay_payment_id 
                    ? paymentResponse.razorpay_payment_id 
                    : 'Cash on Delivery';
            // 3. Navigate state mein orderNumber pass karein
            navigate('/order-success', {
                state: {
                    orderData: {
                        totalAmount: finalTotal,
                        method: paymentMethod,
                        orderNumber: serverOrderNumber ,
                        transactionId: transId,
                        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    }
                }
            });
        });
    } catch (error) {
        console.error("Order Save Error", error);
        swal("Order Failed", "Failed to save order in database. Please try again.", "error");
    } finally {
        setLoading(false);
    }
};

    // Handle Place Order Button Click
    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        // 1. Strict Validations for Address
        const { street, city, pinCode } = addressDetails;
        if (!street.trim() || !city.trim() || !pinCode.trim()) {
            swal("Incomplete Address", "Please fill in all mandatory address fields (Street, City, PIN).", "warning");
            return;
        }

        // Validate PIN code (assuming 6 digit Indian PIN codes)
        if (pinCode.length !== 6 || isNaN(pinCode)) {
            swal("Invalid PIN", "Please enter a valid 6-digit PIN code.", "warning");
            return;
        }

        setLoading(true);

        try {
            // 2. COD Logic (Direct order submit, NO Razorpay)
            if (paymentMethod === 'cod') {
                await finalOrderSubmit();
            } 
            // 3. Online Payment Logic -> Open Razorpay
            else {
                const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
                if (!res) {
                    swal("Error", "Razorpay SDK failed to load. Check your internet connection.", "error");
                    setLoading(false);
                    return;
                }

                const token = localStorage.getItem('customer_token');
                
                // Fetch Razorpay Order ID from backend
                const { data } = await axios.post('http://127.0.0.1:8000/api/create-razorpay-order', 
                    { amount: finalTotal }, 
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                // Razorpay Popup Options
                const options = {
                    key: razorpayKey, 
                    amount: finalTotal * 100,
                    currency: "INR",
                    name: "MyShop",
                    description: "Secure Order Checkout",
                    order_id: data.order_id,
                    handler: async function (response) {
                        // Execute this function upon successful payment
                        await finalOrderSubmit(response);
                    },
                    prefill: {
                        name: name,
                        email: "customer@example.com",
                        contact: "9999999999" // Use actual dynamic phone number if available
                    },
                    theme: { color: "#2563EB" } // Professional Blue Theme
                };

                const rzp = new window.Razorpay(options);
                
                rzp.on('payment.failed', function (response) {
                    swal("Payment Failed", response.error.description, "error");
                    setLoading(false);
                });

                rzp.open();
            }
        } catch (error) {
            console.error(error);
            swal("Error!", "Something went wrong while initiating payment.", "error");
            setLoading(false);
        }
    };

    return (
        <div className="font-sans max-w-[1500px] w-[95vw] lg:w-[90vw] mx-auto py-8">
            
            {/* Added Secure Badge Header */}
            <div className="mb-8 flex items-center gap-2 text-slate-500">
                <FaShieldAlt className="text-xl text-green-600" />
                <span className="text-sm font-bold uppercase tracking-widest text-slate-700">Secure Checkout</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* --- LEFT COLUMN: Address & Payments --- */}
                <div className="flex-1 space-y-6 sm:space-y-8">

                    {/* 1. Address Section (Professional Grid Layout) */}
                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">1. Delivery Address</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                <input type="text" value={name} disabled className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Street Address <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="street"
                                    value={addressDetails.street}
                                    onChange={handleAddressChange}
                                    placeholder="Flat, House no., Building, Company, Apartment"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="city"
                                    value={addressDetails.city}
                                    onChange={handleAddressChange}
                                    placeholder="e.g. New Delhi"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">PIN Code <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="pinCode"
                                    maxLength="6"
                                    value={addressDetails.pinCode}
                                    onChange={handleAddressChange}
                                    placeholder="6-digit PIN"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Landmark (Optional)</label>
                                <input
                                    type="text"
                                    name="landmark"
                                    value={addressDetails.landmark}
                                    onChange={handleAddressChange}
                                    placeholder="e.g. Near Apollo Hospital"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Payment Methods Section */}
                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">2. Select a Payment Method</h2>

                        <div className="space-y-4">
                            {/* Option 1: Pay Online */}
                            <div className={`border rounded-lg transition-all ${paymentMethod === 'online' ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}>
                                <label className="p-4 flex items-center gap-4 cursor-pointer w-full">
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'online'}
                                        onChange={() => setPaymentMethod('online')}
                                        className="w-4 h-4 text-blue-600 cursor-pointer focus:ring-blue-500"
                                    />
                                    <FaCreditCard className={`text-xl ${paymentMethod === 'online' ? 'text-blue-600' : 'text-gray-500'}`} />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">Pay Online (UPI, Cards, Wallets)</span>
                                        <span className="text-xs text-gray-500 mt-0.5">Secure payment via Razorpay</span>
                                    </div>
                                </label>
                            </div>

                            {/* Option 2: Cash on Delivery (COD) */}
                            <div className={`border rounded-lg transition-all ${paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}>
                                <label className="p-4 flex items-center gap-4 cursor-pointer w-full">
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        className="w-4 h-4 text-blue-600 cursor-pointer focus:ring-blue-500"
                                    />
                                    <FaMoneyBillWave className={`text-xl ${paymentMethod === 'cod' ? 'text-blue-600' : 'text-gray-500'}`} />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">Cash on Delivery (COD)</span>
                                        <span className="text-xs text-gray-500 mt-0.5">Pay at your doorstep</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: Order Summary --- */}
                <div className="w-full lg:w-[400px]">
                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">Order Summary</h2>

                        <div className="space-y-4 text-sm text-gray-600 mb-6">
                            <div className="flex justify-between items-center">
                                <span>Subtotal:</span> <span className="font-medium text-gray-900">{formatPrice(totalPrice)}</span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="flex justify-between items-center bg-green-50 p-2.5 -mx-2.5 rounded-lg border border-green-100">
                                    <span className="text-green-800 font-medium">Discount ({appliedCoupon}):</span>
                                    <span className="font-bold text-green-700">− {formatPrice(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span>CGST (9%):</span> <span className="font-medium text-gray-900">{formatPrice(cgstAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>SGST (9%):</span> <span className="font-medium text-gray-900">{formatPrice(sgstAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Delivery:</span> <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">FREE</span>
                            </div>
                            
                            <div className="border-t border-dashed border-gray-300 pt-4 flex justify-between items-end mt-4">
                                <span className="text-lg font-bold text-gray-900">Order Total:</span>
                                <span className="text-2xl font-extrabold text-gray-900">{formatPrice(finalTotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className={`w-full py-4 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-[0.98] ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? 'Processing...' : 'Place Your Order'}
                        </button>

                        <p className="text-xs text-gray-500 text-center mt-5 flex flex-col gap-1">
                            <span>By placing your order, you agree to our</span>
                            <span className="text-blue-600 cursor-pointer hover:underline">Conditions of Use & Privacy Notice.</span>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CheckoutContent;