import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CartEmpty = () => {
    // Redux se directly auth state nikal rahe hain taaki koi error na aaye
    const isCustomerAuth = useSelector((state) => state.auth.isCustomerAuthenticated);

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-200 text-center font-sans">
            
            {/* Modern Empty Cart Icon */}
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-500 mb-8 max-w-md">
                Looks like you haven't added anything to your cart yet. Discover our latest products and start shopping!
            </p>

            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                
                {/* 
                  CONDITIONAL RENDERING: 
                  Sirf tabhi dikhega jab user LOGIN NAHI hoga (!isCustomerAuth)
                */}
                {!isCustomerAuth && (
                    <div className="w-full">
                        <p className="text-sm text-gray-500 mb-3">Already have an account?</p>
                        {/* 'a' tag ki jagah 'Link' lagaya hai taaki page refresh na ho */}
                        <Link 
                            to="/login" 
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black transition-colors"
                        >
                            Sign In to your account
                        </Link>
                    </div>
                )}
                
                {/* Continue Shopping Button - Theme changes automatically */}
                <Link 
                    to="/products" 
                    className={`w-full flex justify-center py-3 px-4 rounded-lg font-bold text-sm transition-colors shadow-sm ${
                        isCustomerAuth 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
};

export default CartEmpty;