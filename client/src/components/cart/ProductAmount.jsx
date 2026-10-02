import React from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { cartActions } from '../../store/cart-slice';

const ProductAmount = ({ quantity, id }) => {
    const dispatch = useDispatch();
    return (
        <div className='flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1'>
            <button onClick={() => dispatch(cartActions.removeItemFromCart(id))} className='p-1 hover:text-blue-600'><FaMinus size={10} /></button>
            <span className='font-bold w-6 text-center'>{quantity}</span>
            <button onClick={() => dispatch(cartActions.addItemToCart(id))} className='p-1 hover:text-blue-600'><FaPlus size={10} /></button>
        </div>
    );
};
export default ProductAmount;