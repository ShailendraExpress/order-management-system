import React from 'react';
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import CartIcon from "./CartIcon";

const NavCartButton = () => {
    const totalQuantity = useSelector((state) => state.cart.totalQuantity);
    return (
        <Link to="/cart" className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
            <span className="w-5 h-5 text-slate-700"><CartIcon /></span>
            <span className='font-bold text-sm text-slate-700'>Cart</span>
            {totalQuantity > 0 && (
                <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {totalQuantity}
                </span>
            )}
        </Link>
    );
};
export default NavCartButton;