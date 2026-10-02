import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ReactPaginate from 'react-paginate';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';

import ListView from './ListView';
import GridView from './GridView';
import TheSpinner from '../../layout/TheSpinner';
// HATA DIYA: import './style.css'; -> Yahi wo blue background laa raha tha!

const ProductsList = ({ itemsPerPage }) => {
    const gridView = useSelector((state) => state.ui.gridView);
    const products = useSelector((state) => state.products.filteredProducts);
    const loading = useSelector((state) => state.ui.productsLoading);

    const [itemOffset, setItemOffset] = useState(0);

    const endOffset = itemOffset + itemsPerPage;
    const currentItems = products.slice(itemOffset, endOffset);
    const pageCount = Math.ceil(products.length / itemsPerPage);

    const handlePageClick = (event) => {
        const newOffset = (event.selected * itemsPerPage) % products.length;
        setItemOffset(newOffset);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll to top
    };

    if (loading) return <TheSpinner />;

    if (products.length < 1) {
        return (
            <div className='flex flex-col items-center justify-center py-20 text-gray-500'>
                <p className='text-lg font-medium'>Sorry, no products matched your search.</p>
            </div>
        );
    }

    const ProductView = gridView ? GridView : ListView;

    return (
        <div className="flex flex-col w-full">
            {/* Products Display */}
            <ProductView products={currentItems} />

            {/* Modern E-commerce Pagination (No external CSS needed) */}
            <div className="mt-12 flex justify-center items-center py-8">
                <ReactPaginate
                    onPageChange={handlePageClick}
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                    pageCount={pageCount}
                    breakLabel={'...'}
                    nextLabel={<ArrowForwardIosIcon style={{ fontSize: 12 }} />}
                    previousLabel={<ArrowBackIosIcon style={{ fontSize: 12, marginLeft: '4px' }} />}
                    
                    // Tailwind Styling Applied Directly to Links
                    containerClassName={'flex gap-2 items-center'}
                    
                    // Normal Pages (1, 2, 3...)
                    pageLinkClassName={'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm'}
                    
                    // Active Page (Current Page)
                    activeLinkClassName={'!bg-blue-600 !border-blue-600 !text-white hover:!bg-blue-700'}
                    
                    // Previous & Next Buttons
                    previousLinkClassName={'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm'}
                    nextLinkClassName={'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm'}
                    
                    // Disabled State (When on first or last page)
                    disabledLinkClassName={'opacity-40 cursor-not-allowed hover:bg-white hover:text-gray-500'}
                    
                    // Break Label (...)
                    breakLinkClassName={'flex items-end justify-center px-2 text-gray-500 font-bold tracking-widest'}
                />
            </div>
        </div>
    );
};

export default ProductsList;