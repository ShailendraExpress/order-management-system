import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers';

const CartSummary = ({ totalPrice }) => {
    // FIX: Customer Auth use karein, Admin nahi
    const isCustomerAuth = useSelector((state) => state.auth.isCustomerAuthenticated);

    return (
        <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24'>
            <h2 className='text-xl font-bold mb-6 uppercase tracking-wider'>Order Summary</h2>
            <div className='space-y-4 text-slate-600'>
                <div className='flex justify-between'><span>Subtotal</span><span className='font-semibold'>{formatPrice(totalPrice)}</span></div>
                <div className='flex justify-between'><span>Shipping</span><span className='text-green-600 font-semibold'>Free</span></div>
                <div className='border-t pt-4 flex justify-between font-bold text-lg text-slate-900'>
                    <span>Total</span><span>{formatPrice(totalPrice)}</span>
                </div>
            </div>
            
            <Link to={isCustomerAuth ? '/checkout' : '/login'} 
                  className='block w-full text-center mt-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition'>
                {isCustomerAuth ? 'Proceed to Checkout' : 'Login to Checkout'}
            </Link>
        </div>
    );
};
export default CartSummary;