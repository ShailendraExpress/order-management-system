import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import CartContent from '../components/cart/CartContent';
import CartEmpty from '../components/cart/CartEmpty';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0 }
};

const Cart = () => {
    const cart = useSelector((state) => state.cart.items);
    const totalPrice = useSelector((state) => state.cart.totalPrice);

    return (
        <motion.div 
            className="min-h-screen bg-gray-50 pb-20 pt-6 font-sans"
            variants={containerVariants}
            initial="hidden" 
            animate="visible"
            exit="exit"
        >
            {/* Main Container - Width perfectly matched with other pages */}
            <div className='max-w-[1500px] w-[95vw] lg:w-[90vw] mx-auto'>
                
                {/* Modern Breadcrumb Navigation - Exactly like Product Detail Page */}
                <nav className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
                    <Link to='/' className="hover:text-blue-600 hover:underline">Home</Link>
                    <span className="text-gray-400">›</span>
                    <span className="text-gray-900 font-medium">Cart</span>
                </nav>

                {/* CONTENT */}
                <div className="w-full">
                    {cart.length < 1 ? (
                        <CartEmpty />
                    ) : (
                        <CartContent cart={cart} totalPrice={totalPrice} />
                    )}
                </div>

            </div>
        </motion.div>
    );
};

export default Cart;