import React from 'react';
import ProductAmount from './ProductAmount';
import { formatPrice } from '../../utils/helpers';

const CartItem = ({ item }) => {
    return (
        <div className='flex items-center gap-6 p-4 bg-white border border-slate-100 rounded-2xl'>
            <img src={item.images[0]?.image} alt={item.name} className='w-24 h-24 object-cover rounded-xl'/>
            <div className='flex-grow'>
                <h3 className='font-bold text-lg'>{item.name}</h3>
                <p className='text-sm text-slate-500 uppercase'>{item.brand}</p>
                <p className='font-bold text-blue-600 mt-1'>{formatPrice(item.price)}</p>
            </div>
            <div className='flex flex-col items-end gap-2'>
                <ProductAmount quantity={item.quantity} id={item.id} />
                <span className='font-bold text-lg'>{formatPrice(item.totalPrice)}</span>
            </div>
        </div>
    );
};
export default CartItem;