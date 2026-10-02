import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BsFillGridFill, BsList } from 'react-icons/bs';
import { productsActions } from '../../store/products-slice';
import { uiActions } from '../../store/ui-slice';

const Sort = () => {
    const dispatch = useDispatch();
    const totalProducts = useSelector((state) => state.products.totalProducts);
    const sort = useSelector((state) => state.products.sort);
    
    // ADDED: Grid view ki state chahiye active button highlight karne ke liye
    const gridView = useSelector((state) => state.ui.gridView); 

    const toggleHandler = () => {
        dispatch(uiActions.toggleView());
    };

    const sortProducts = (e) => {
        const value = e.target.value;
        dispatch(productsActions.sortProducts(value));
    };

    return (
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full w-full bg-transparent'>
            
            {/* LEFT SIDE: View Toggles & Result Count */}
            <div className='flex items-center gap-4'>
                
                {/* Modern View Toggle Container (iOS / Amazon Style) */}
                <div className='flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200'>
                    <button 
                        type="button"
                        // Agar gridView true hai to shadow aur blue text do
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                            gridView 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-700'
                        }`} 
                        onClick={() => { if(!gridView) toggleHandler(); }} // Sirf tabhi call karo jab zarurat ho
                    >
                        <BsFillGridFill className="text-lg" />
                    </button>
                    
                    <button 
                        type="button"
                        // Agar gridView false (list view) hai to shadow aur blue text do
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                            !gridView 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-700'
                        }`} 
                        onClick={() => { if(gridView) toggleHandler(); }}
                    >
                        <BsList className="text-lg" />
                    </button>
                </div>

                {/* Clean Products Found Text */}
                <p className='text-sm text-slate-600'>
                    <span className="font-bold text-slate-900">{totalProducts}</span> Products Found
                </p>
            </div>

            {/* RIGHT SIDE: Sort Dropdown */}
            <div className='flex items-center gap-3'>
                <label htmlFor="sort" className='text-sm font-semibold text-slate-500 whitespace-nowrap'>
                    Sort by:
                </label>
                
                <div className="relative">
                    <select 
                        name="sort" 
                        id="sort" 
                        value={sort} 
                        onChange={sortProducts}
                        className='appearance-none bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 pl-4 pr-9 cursor-pointer outline-none transition-shadow'
                    >
                        {/* Values same rakhi hain taaki Redux kaam karta rahe, bas text clean kiya hai */}
                        <option value="price-lowest">Price: Low to High</option>
                        <option value="price-highest">Price: High to Low</option>
                        <option value="name-a">Name (A - Z)</option>
                        <option value="name-z">Name (Z - A)</option>
                    </select>
                    
                    {/* Custom Dropdown Arrow */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Sort;