import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';

import CartItem from './CartItem';
import { formatPrice } from '../../utils/helpers';
import { cartActions } from '../../store/cart-slice'; // Path check kar lijiyega

const CartContent = ({ cart, totalPrice }) => {
    const dispatch = useDispatch();

    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
    
    // Naya state amount ke liye (taaki percentage aur fixed dono kaam kare)
    const [discountAmount, setDiscountAmount] = useState(0); 
    const [appliedCode, setAppliedCode] = useState('');

    // Total items count
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) {
            setCouponMessage({ text: 'Please enter a valid code', type: 'error' });
            return;
        }

        try {
            // Laravel Backend API Call
            const response = await axios.post('http://127.0.0.1:8000/api/apply-coupon', {
                code: couponCode,
                cart_total: totalPrice
            });

            if (response.data.status) {
                const { discount_type, discount_value, code } = response.data.data;
                
                let calculatedDiscount = 0;
                let percentForRedux = 0;

                // Check type of discount (Percentage or Fixed)
                if (discount_type === 'percentage') {
                    calculatedDiscount = (totalPrice * discount_value) / 100;
                    percentForRedux = discount_value;
                } else {
                    calculatedDiscount = discount_value;
                    // Redux checkout logic ke liye percentage convert karna
                    percentForRedux = (discount_value / totalPrice) * 100; 
                }

                // Update Local States
                setDiscountAmount(calculatedDiscount);
                setAppliedCode(code);
                setCouponMessage({ text: response.data.message, type: 'success' });

                // Update Redux Store
                dispatch(cartActions.applyDiscount({ 
                    percent: percentForRedux, 
                    code: code 
                }));
            }
        } catch (error) {
            // Error handling theek ki gayi hai yahan par 👇
            const errorMsg = error.response?.data?.message || 'Invalid or expired coupon';
            
            // Pura removeCoupon() call karne ki bajaye, sirf discount reset karein
            setAppliedCode('');
            setDiscountAmount(0);
            dispatch(cartActions.removeDiscount());
            
            // Aur ERROR message ko set karein (taaki red line dikhe)
            setCouponMessage({ text: errorMsg, type: 'error' }); 
        }
    };

    const removeCoupon = () => {
        setCouponCode('');
        setAppliedCode('');
        setDiscountAmount(0);
        setCouponMessage({ text: '', type: '' });
        
        // Remove from Redux
        dispatch(cartActions.removeDiscount());
    };

    // --- CALCULATIONS ---
    const priceAfterDiscount = totalPrice - discountAmount;
    
    // Indian GST Calculations (9% CGST + 9% SGST) = 18% Total
    const GST_RATE = 0.09; 
    const cgstAmount = priceAfterDiscount * GST_RATE;
    const sgstAmount = priceAfterDiscount * GST_RATE;
    
    // Final Payable Amount
    const finalTotal = priceAfterDiscount + cgstAmount + sgstAmount;

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start font-sans">
            
            {/* Left Column: Cart Items Container */}
            <div className="flex-grow w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">Shopping Cart ({totalItems} Items)</h2>
                </div>
                
                <div className="flex flex-col p-4 gap-6">
                    {cart.map((item) => (
                        <CartItem key={item.id} item={item} />
                    ))}
                </div>
                
                {/* Delivery Info Strip */}
                <div className="bg-green-50 p-3 text-sm text-green-700 flex items-center justify-center gap-2 border-t border-green-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Your order is eligible for <strong>FREE Delivery.</strong></span>
                </div>
            </div>

            {/* Right Column: Professional Price Details */}
            <div className="w-full lg:w-[380px] shrink-0 sticky top-4">
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                    
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm">Price Details</h3>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex flex-col gap-4 text-sm text-slate-700 mb-6">
                            <div className="flex justify-between">
                                <span>Price ({totalItems} items)</span>
                                <span>{formatPrice(totalPrice)}</span>
                            </div>

                            {/* Discount Highlight */}
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount ({appliedCode})</span>
                                    <span>− {formatPrice(discountAmount)}</span>
                                </div>
                            )}

                            {/* GST Taxes */}
                            <div className="flex justify-between">
                                <span>CGST (9%)</span>
                                <span>{formatPrice(cgstAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>SGST (9%)</span>
                                <span>{formatPrice(sgstAmount)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Delivery Charges</span>
                                <span className="text-green-600 font-medium">
                                    <span className="line-through text-slate-400 mr-2">₹100.00</span>
                                    Free
                                </span>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="border-t border-dashed border-slate-300 py-4 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-slate-900">Total Amount</span>
                                <span className="font-bold text-2xl text-slate-900">{formatPrice(finalTotal)}</span>
                            </div>
                        </div>

                        {/* Savings Box */}
                        {discountAmount > 0 && (
                            <div className="mb-6 text-green-700 font-bold text-sm bg-green-50 p-3 rounded-md border border-green-100 text-center">
                                You will save {formatPrice(discountAmount)} on this order
                            </div>
                        )}

                        {/* COUPON INPUT */}
                        <div className="mb-6">
                            {discountAmount > 0 ? (
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <span className="text-sm font-bold text-slate-700">
                                        Code: <span className="text-green-600">{appliedCode}</span> applied
                                    </span>
                                    <button onClick={removeCoupon} className="text-xs text-red-500 font-bold hover:underline uppercase">
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter Coupon Code"
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            setCouponMessage({ text: '', type: '' });
                                        }}
                                        className="flex-grow border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase placeholder:normal-case"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-700 transition-colors"
                                    >
                                        APPLY
                                    </button>
                                </form>
                            )}
                            {couponMessage.text && discountAmount === 0 && (
                                <p className={`mt-2 text-xs font-medium ${couponMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                    {couponMessage.text}
                                </p>
                            )}
                        </div>

                        {/* Place Order Button */}
                        <Link 
                            to="/checkout"
                            className="flex items-center justify-center w-full bg-[#fb641b] text-white text-center py-3.5 rounded-md font-bold text-[15px] hover:bg-[#e05615] transition-colors shadow-sm"
                        >
                            PLACE ORDER
                        </Link>

                        <div className="mt-5 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-slate-500 justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-semibold text-slate-600">Safe and Secure Payments. Easy returns.</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartContent;