import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaMinus, FaShoppingCart, FaCheck } from 'react-icons/fa';
import { cartActions } from '../../store/cart-slice';
import { useDispatch } from 'react-redux';

const AddToCart = ({ product }) => {
    const [amount, setAmount] = useState(1);
    const [isAdding, setIsAdding] = useState(false); // Loader state
    const [isAdded, setIsAdded] = useState(false);   // Success message state
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const increase = () => {
        setAmount((prevAmount) => prevAmount + 1);
    };

    const decrease = () => {
        setAmount((prevAmount) => {
            if (prevAmount === 1) return 1;
            return prevAmount - 1;
        });
    };

    const addItemsToCart = () => {
        setIsAdding(true); // Loader chalu karein

        // Kyunki Redux instant hota hai, loader dikhane ke liye hum thoda fake delay (800ms) daal rahe hain
        setTimeout(() => {
            const quantity = amount;
            const totalPrice = product.price * quantity;
            const payload = {
                ...product,
                quantity,
                totalPrice
            };
            dispatch(cartActions.addItemsToCart(payload));

            setIsAdding(false); // Loader band karein
            setIsAdded(true);   // Success message on karein

            // 2.5 seconds ke baad button ko wapas normal state me le aayein
            setTimeout(() => {
                setIsAdded(false);
                setAmount(1); // Optional: Quantity wapas 1 kar dein
            }, 2500);
            
        }, 800);
    };

    const handleBuyNow = () => {
        // Buy now me direct cart add karke page redirect kar denge
        const quantity = amount;
        const totalPrice = product.price * quantity;
        dispatch(cartActions.addItemsToCart({ ...product, quantity, totalPrice }));
        navigate('/cart');
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-4 w-full font-sans">
            
            {/* --- Standard E-commerce Quantity Selector --- */}
            <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-12 w-32 sm:w-36 flex-shrink-0">
                <button 
                    type="button" 
                    onClick={decrease} 
                    disabled={amount === 1 || isAdding || isAdded}
                    className={`flex-1 h-full flex justify-center items-center transition-colors ${
                        (amount === 1 || isAdding || isAdded)
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 active:bg-gray-200'
                    }`}
                >
                    <FaMinus className="text-xs" />
                </button>
                
                <div className="w-12 h-full flex justify-center items-center text-base font-bold text-gray-900 border-x border-gray-300 bg-gray-50 select-none">
                    {amount}
                </div>
                
                <button 
                    type="button" 
                    onClick={increase} 
                    disabled={isAdding || isAdded}
                    className={`flex-1 h-full flex justify-center items-center transition-colors ${
                        (isAdding || isAdded)
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600 active:bg-gray-200'
                    }`}
                >
                    <FaPlus className="text-xs" />
                </button>
            </div>

            {/* --- Dynamic Add To Cart Button --- */}
            <button 
                onClick={addItemsToCart}
                disabled={isAdding || isAdded}
                className={`flex-1 flex items-center justify-center gap-2 w-full h-12 rounded-lg font-medium text-sm transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                    isAdded 
                    ? 'bg-green-600 text-white cursor-default' // Success State
                    : isAdding 
                        ? 'bg-gray-800 text-gray-300 cursor-wait' // Loading State
                        : 'bg-gray-900 hover:bg-black text-white' // Default State
                }`}
            >
                {isAdded ? (
                    <>
                        <FaCheck className="text-base" />
                        Added to Cart
                    </>
                ) : isAdding ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Adding...
                    </>
                ) : (
                    <>
                        <FaShoppingCart className="text-base" />
                        Add to Cart
                    </>
                )}
            </button>

            {/* --- Brand Blue Buy Now Button --- */}
            <button 
                onClick={handleBuyNow}
                disabled={isAdding}
                className="flex-1 flex items-center justify-center w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:hidden lg:flex disabled:opacity-50"
            >
                Buy Now
            </button>

        </div>
    );
};

export default AddToCart;