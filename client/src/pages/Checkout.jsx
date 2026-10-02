import React from "react";
import { useSelector } from "react-redux";
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FaLock, FaShieldAlt } from 'react-icons/fa';

import CheckoutContent from "../components/cart/CheckoutContent";
import CartEmpty from '../components/cart/CartEmpty';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { x: '-100vw', transition: { ease: 'easeInOut' } }
};

const Checkout = () => {
    const navigate = useNavigate();
    
    // Redux State
    const totalPrice = useSelector((state) => state.cart.totalPrice);
    const cart = useSelector((state) => state.cart.items);
    
    // Checking Auth State
    const isCustomerAuth = useSelector((state) => state.auth.isCustomerAuthenticated);
    const customer = useSelector((state) => state.auth.customer) || {};
    const { name } = customer;

    // Premium "Not Logged In" State
    if (!isCustomerAuth || !name) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 font-sans">
                {/* Secure Header for Unauth User */}
                <div className="mb-8 flex items-center gap-2 text-slate-500">
                    <FaShieldAlt className="text-xl text-green-600" />
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-700">Secure Checkout</span>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-10 text-center relative overflow-hidden"
                >
                    <div className="w-16 h-16 bg-orange-50 text-[#fb641b] rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaLock className="text-2xl" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Login or Signup</h2>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                        Please sign in to your account to securely complete your payment and order process.
                    </p>
                    
                    <button 
                        onClick={() => navigate('/login')} 
                        className="w-full flex justify-center items-center py-3.5 px-4 rounded-md shadow-sm text-[15px] font-bold text-white bg-[#fb641b] hover:bg-[#e05615] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fb641b] transition-colors active:scale-[0.98]"
                    >
                        CONTINUE TO LOGIN
                    </button>
                    
                    <p className="mt-6 text-xs text-slate-400 font-medium">
                        By continuing, you agree to our Terms of Use and Privacy Policy.
                    </p>
                </motion.div>
            </div>
        );
    }

    // Main Checkout Page (Authenticated)
    return (
        <motion.div
            className="min-h-screen bg-slate-50 pb-20 pt-6 font-sans"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Main Container - Width exactly matched with Products/Cart page */}
            <div className='max-w-[1500px] w-[95vw] lg:w-[90vw] mx-auto'>
                
                {/* Modern Breadcrumb Navigation & Secure Badge (Line removed from here) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <nav className="flex items-center text-sm text-slate-500 space-x-2">
                        <Link to='/' className="hover:text-[#fb641b] transition-colors">Home</Link>
                        <span className="text-slate-400">›</span>
                        <Link to='/cart' className="hover:text-[#fb641b] transition-colors">Cart</Link>
                        <span className="text-slate-400">›</span>
                        <span className="text-slate-900 font-bold">Secure Checkout</span>
                    </nav>

                    {/* Trust Indicator Badge */}
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                        <FaShieldAlt className="text-sm" />
                        <span className="text-xs font-bold uppercase tracking-wider">100% Safe Payments</span>
                    </div>
                </div>

                {/* Checkout Content Container */}
                <div className="w-full">
                    {cart.length < 1 ? (
                        <CartEmpty />
                    ) : (
                        <CheckoutContent totalPrice={totalPrice} name={name} />
                    )}
                </div>

            </div>
        </motion.div>
    );
};

export default Checkout;