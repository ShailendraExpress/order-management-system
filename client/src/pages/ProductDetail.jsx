import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiChevronRight, FiShield, FiTruck, FiRotateCcw } from 'react-icons/fi';

import ProductImages from '../components/productDetail/ProductImages';
import Stars from '../components/productDetail/Stars';
import AddToCart from '../components/productDetail/AddToCart';
import SimilarProducts from '../components/productDetail/SimilarProducts';
import { getProductDetails } from '../store/actions/products-actions';
import { formatPrice } from '../utils/helpers';
import TheSpinner from '../layout/TheSpinner';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { x: '-100vw', transition: { ease: 'easeInOut' } }
};

const ProductDetail = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.ui.productDetailLoading);
    
    useEffect(() => {
        dispatch(getProductDetails(productId));
    }, [dispatch, productId]);
    
    const product = useSelector((state) => state.products.productDetails) || {};
    const {
        id,
        name,
        description,
        price,
        brand,
        sku,
        images,
        stock,
        category
    } = product;

    const stockCount = Number(stock || 1);
    const isOutOfStock = stockCount <= 0;

    return (
        <motion.main 
            className='min-h-screen bg-slate-50/75 pb-24 pt-6 font-sans text-slate-800'
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Main Container */}
            <div className='max-w-[1580px] w-[94vw] mx-auto'>
                
                {/* Modern Breadcrumb Navigation */}
                <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-6 space-x-2 font-medium">
                    <Link to='/' className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                        <FiHome size={14} /> Home
                    </Link>
                    <FiChevronRight size={14} className="text-slate-400" />
                    <Link to='/products' className="hover:text-slate-900 transition-colors">Products</Link>
                    <FiChevronRight size={14} className="text-slate-400" />
                    <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
                        {name || 'Product Details'}
                    </span>
                </nav>

                {loading ? (
                    <div className="flex justify-center items-center h-[55vh] bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                        <TheSpinner />
                    </div>
                ) : (
                    <>
                        <div className='bg-white shadow-xs rounded-2xl border border-slate-200/80 overflow-hidden'>
                            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10'>
                                
                                {/* Product Images - Left Column */}
                                <div className='lg:col-span-5 flex justify-center items-start'>
                                    <div className='sticky top-24 w-full'>
                                        <ProductImages images={images} />
                                    </div>
                                </div>

                                {/* Product Info - Right Column */}
                                <div className='lg:col-span-7 flex flex-col'>
                                    
                                    {/* Title & Brand */}
                                    <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight tracking-tight'>
                                        {name}
                                    </h1>
                                    {brand && (
                                        <p className='text-xs sm:text-sm font-semibold text-blue-600 hover:underline cursor-pointer mb-4 tracking-wide uppercase'>
                                            Visit the {brand} Store
                                        </p>
                                    )}

                                    {/* Ratings */}
                                    <div className='flex items-center mb-5 pb-5 border-b border-slate-100'>
                                        <Stars />
                                    </div>

                                    {/* Price */}
                                    <div className='mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-100'>
                                        <div className='flex items-baseline gap-3'>
                                            <h4 className='text-3xl sm:text-4xl font-extrabold text-slate-900'>
                                                {formatPrice(price)}
                                            </h4>
                                        </div>
                                        <p className='text-xs text-slate-500 mt-1 font-medium'>Inclusive of all taxes & government duties</p>
                                    </div>

                                    {/* Stock & Meta Data */}
                                    <div className='space-y-4 mb-6'>
                                        {isOutOfStock ? (
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
                                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                                Out of Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                In Stock & Ready to Dispatch
                                            </span>
                                        )}
                                        
                                        <div className='grid grid-cols-3 gap-y-2 text-sm max-w-sm bg-white p-4 rounded-xl border border-slate-100 shadow-2xs'>
                                            <div className='font-bold text-slate-500 text-xs uppercase tracking-wider'>Brand</div>
                                            <div className='col-span-2 text-slate-900 font-semibold uppercase'>{brand || 'N/A'}</div>
                                            
                                            <div className='font-bold text-slate-500 text-xs uppercase tracking-wider mt-2'>SKU</div>
                                            <div className='col-span-2 text-slate-900 font-mono text-xs mt-2'>{sku || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <hr className='border-slate-100 mb-6' />

                                    {/* Description / About this item */}
                                    <div className='mb-8'>
                                        <h3 className='text-sm font-bold uppercase tracking-wider text-slate-900 mb-3'>About this item</h3>
                                        <p className='text-slate-600 text-sm sm:text-base leading-relaxed'>
                                            {description}
                                        </p>
                                    </div>

                                    {/* Trust Badges */}
                                    <div className='grid grid-cols-3 gap-3 mb-8 text-center'>
                                        <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1.5'>
                                            <FiTruck size={20} className='text-slate-700' />
                                            <span className='text-[11px] font-semibold text-slate-600'>Free Delivery</span>
                                        </div>
                                        <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1.5'>
                                            <FiRotateCcw size={20} className='text-slate-700' />
                                            <span className='text-[11px] font-semibold text-slate-600'>7 Days Return</span>
                                        </div>
                                        <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1.5'>
                                            <FiShield size={20} className='text-slate-700' />
                                            <span className='text-[11px] font-semibold text-slate-600'>1 Year Warranty</span>
                                        </div>
                                    </div>

                                    {/* Add to Cart Action Area (E-commerce "Buy Box") */}
                                    <div className='mt-auto pt-2'>
                                        <div className='bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 shadow-xs'>
                                            <AddToCart product={product} />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Similar Products Section */}
                        <SimilarProducts currentProductId={id} currentCategory={category} />
                    </>
                )}
            </div>
        </motion.main>
    );
};

export default ProductDetail;