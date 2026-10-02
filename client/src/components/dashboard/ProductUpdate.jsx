import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import swal from "sweetalert";
import { useDispatch, useSelector } from "react-redux";

// Import secure global API instance and CSRF helper
import api, { getCsrfCookie } from "../../utils/api";

// Icons
import { FaDollarSign } from "react-icons/fa";
import { FiUploadCloud, FiCheck, FiPackage, FiEdit3, FiX } from "react-icons/fi";
import { HiChevronDoubleLeft } from "react-icons/hi";

// Actions & Components
import { updateProduct } from "../../store/actions/products-actions";

const ProductUpdate = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Extract product data safely from router state
  const { product } = location.state || {};

  const token = useSelector((state) => state.auth?.token);
  
  // Local loading state
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Local states for categories and brands (Loaded immediately)
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [dynamicBrands, setDynamicBrands] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  
  // Initialize existing thumbnail preview
  const [thumbnailPreview, setThumbnailPreview] = useState(product?.thumbnail || product?.image || null);

  // Initialize existing gallery image previews if available
  const existingGallery = product?.images && Array.isArray(product.images) 
    ? product.images.map(img => img.image) 
    : [];
  const [galleryPreviews, setGalleryPreviews] = useState(existingGallery);

  // Fetch Categories and Brands instantly with localStorage caching for zero delay
  useEffect(() => {
    let isMounted = true;

    const fetchMetadataFast = async () => {
      // 1. Check if cached data exists to render instantly
      const cachedCategories = localStorage.getItem('cached_categories');
      const cachedBrands = localStorage.getItem('cached_brands');

      if (cachedCategories && cachedBrands) {
        if (isMounted) {
          setDynamicCategories(JSON.parse(cachedCategories));
          setDynamicBrands(JSON.parse(cachedBrands));
          setIsLoadingMetadata(false);
        }
      }

      // 2. Fetch fresh data in background
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/api/v1/categories?active=1'),
          api.get('/api/v1/brands')
        ]);

        if (isMounted) {
          const cats = Array.isArray(catRes.data?.data) ? catRes.data.data : (Array.isArray(catRes.data) ? catRes.data : []);
          const brands = Array.isArray(brandRes.data?.data) ? brandRes.data.data : (Array.isArray(brandRes.data) ? brandRes.data : []);

          setDynamicCategories(cats);
          setDynamicBrands(brands);
          
          // Save to localStorage for instant load next time
          localStorage.setItem('cached_categories', JSON.stringify(cats));
          localStorage.setItem('cached_brands', JSON.stringify(brands));
        }
      } catch (error) {
        console.error("Error fetching form metadata:", error);
      } finally {
        if (isMounted) setIsLoadingMetadata(false);
      }
    };

    fetchMetadataFast();

    return () => {
      isMounted = false;
    };
  }, []);

  // Formik configuration with validation schema
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      stock: product?.stock || 0,
      category: product?.category || "",
      brand: product?.brand || "",
      shipping: product?.shipping === 1 || product?.shipping === true,
      thumbnail: null, 
      images: [],
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Product title is required"),
      description: Yup.string().min(20, "Please provide at least 20 characters").required("Description is required"),
      price: Yup.number().typeError("Must be a valid number").required("Price is required").positive("Price must be greater than 0"),
      stock: Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Stock is required"),
      category: Yup.string().required("Please select a category"),
      brand: Yup.string().required("Please select a brand"),
    }),
    onSubmit: async (values) => {
      setIsUpdating(true);

      const formData = new FormData();
      
      // Only append new thumbnail if it's an actual File object
      if (values.thumbnail instanceof File) {
        formData.append("thumbnail", values.thumbnail);
      }

      // Only append new gallery images if they are File objects
      if (values.images && values.images.length > 0) {
        values.images.forEach((file) => {
          if (file instanceof File) {
            formData.append("images[]", file);
          }
        });
      }

      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("stock", values.stock);
      formData.append("category", values.category);
      formData.append("brand", values.brand);
      formData.append("shipping", values.shipping ? 1 : 0);
      formData.append("_method", "PUT");

      try {
        const result = await dispatch(updateProduct({ product: formData, id: productId, token }));
        
        if (result?.error) {
          throw new Error("Server rejected the request.");
        }
        
        // Fast instant success notification
        swal({
          title: "Product Updated!",
          text: `${values.name} has been successfully updated.`,
          icon: "success",
          timer: 1200,
          buttons: false,
        });

        setTimeout(() => {
          navigate("/admin/dashboard/products");
        }, 1000);

      } catch (error) {
        console.error("Failed to update product:", error.response?.data || error);
        const errorMsg = error.response?.data?.message || "Something went wrong communicating with the server.";
        swal("Update Failed", errorMsg, "error");
        setIsUpdating(false);
      }
    },
  });

  // Toggle status handler properly placed after formik definition
  const handleToggleStatus = (e) => {
    const { name, checked } = e.target;
    formik.setFieldValue(name, checked);
  };

  // Handle thumbnail selection and preview generation
  const handleThumbnailChange = useCallback((file) => {
    if (file) {
      formik.setFieldValue("thumbnail", file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  }, [formik]);

  // Handle gallery image additions and preview generation (Max limit: 4)
  const handleGalleryChange = useCallback((files) => {
    const newFiles = Array.from(files);
    const combinedFiles = [...formik.values.images, ...newFiles].slice(0, 4);
    formik.setFieldValue("images", combinedFiles);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prevPreviews) => [...prevPreviews, ...newPreviews].slice(0, 4));
  }, [formik]);

  // Handle removal of gallery images
  const handleRemoveImage = (indexToRemove) => {
    const existingCount = galleryPreviews.length - formik.values.images.length;

    const newPreviews = galleryPreviews.filter((_, i) => i !== indexToRemove);
    setGalleryPreviews(newPreviews);

    if (indexToRemove >= existingCount) {
      const formikIndex = indexToRemove - existingCount;
      const newFormikImages = formik.values.images.filter((_, i) => i !== formikIndex);
      formik.setFieldValue("images", newFormikImages);
    }
  };

  if (!product) {
    navigate("/admin/dashboard/products");
    return null;
  }

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* PAGE HEADER */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <FiEdit3 className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Edit Product</h1>
            <p className="text-xs text-slate-500 mt-0.5">Modifying SKU: <span className="font-mono text-slate-700">{product.sku}</span></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isUpdating}
            className="inline-flex items-center justify-center h-[42px] px-5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold whitespace-nowrap transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <HiChevronDoubleLeft className="mr-1.5" /> Cancel
          </button>
          
          <button
            type="button"
            onClick={formik.handleSubmit}
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap flex-shrink-0 shadow-xs transition-all active:scale-98 disabled:opacity-70 cursor-pointer border border-slate-900 min-w-[140px]"
          >
            {isUpdating ? (
              <><span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span> <span>Saving...</span></>
            ) : (
              <><FiCheck className="text-base text-slate-300 flex-shrink-0" /> <span>Save Changes</span></>
            )}
          </button>
        </div>

      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: CORE DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Info Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                General Information
              </h2>

              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...formik.getFieldProps("name")}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${
                    formik.touched.name && formik.errors.name ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows="6"
                  {...formik.getFieldProps("description")}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${
                    formik.touched.description && formik.errors.description ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all resize-y`}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.description}</p>
                )}
              </div>
            </div>

            {/* Pricing & Logistics Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Pricing & Shipping
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                <div>
                  <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Base Price (USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FaDollarSign />
                    </div>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      {...formik.getFieldProps("price")}
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${
                        formik.touched.price && formik.errors.price ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                      } rounded-lg text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                    />
                  </div>
                  {formik.touched.price && formik.errors.price && (
                    <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.price}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="stock" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="stock"
                    min="0"
                    {...formik.getFieldProps("stock")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${
                      formik.touched.stock && formik.errors.stock ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                    } rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                  />
                  {formik.touched.stock && formik.errors.stock && (
                    <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.stock}</p>
                  )}
                </div>

                <div className="pt-2 sm:col-span-2">
                  <label className="relative flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      {...formik.getFieldProps("shipping")}
                      checked={formik.values.shipping}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-slate-800">Requires Physical Shipping</span>
                      <span className="block text-xs text-slate-500">Enable if product requires courier dispatch</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: MEDIA & TAXONOMY */}
          <div className="space-y-6">
            
            {/* Organization Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Organization
              </h2>

              <div>
                <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="category"
                  {...formik.getFieldProps("category")}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${
                    formik.touched.category && formik.errors.category ? "border-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer`}
                >
                  <option value="" disabled>
                    {isLoadingMetadata ? "Loading categories..." : "Select primary category"}
                  </option>
                  {dynamicCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.title || cat.name}</option>
                  ))}
                </select>
                {formik.touched.category && formik.errors.category && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {isLoadingMetadata ? (
                    <p className="text-xs text-slate-400 col-span-2 py-2">Loading brands...</p>
                  ) : (
                    dynamicBrands.map((brand) => (
                      <label key={brand.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="brand"
                          value={brand.title || brand.name}
                          onChange={formik.handleChange}
                          checked={formik.values.brand === (brand.title || brand.name)}
                          className="sr-only peer"
                        />
                        <div className="px-3 py-2 border rounded-lg text-center text-xs peer-checked:bg-slate-900 peer-checked:text-white hover:bg-slate-50 transition-all">
                          {brand.title || brand.name}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {formik.touched.brand && formik.errors.brand && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.brand}</p>
                )}
              </div>
            </div>

            {/* Media Uploads Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Product Assets
              </h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Update Thumbnail
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-xl p-4 text-center bg-slate-50/50 transition-colors group cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleThumbnailChange(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {thumbnailPreview ? (
                    <div className="relative h-32 w-full flex items-center justify-center">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="max-h-full rounded-md object-contain shadow-2xs" />
                      <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-xs font-bold text-slate-900 bg-white px-3 py-1.5 rounded-full shadow-sm">Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                      <FiUploadCloud className="mx-auto text-2xl text-slate-400 group-hover:text-slate-900 transition-colors mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Click to upload new thumbnail</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Update Gallery (Max 4)
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-xl p-4 text-center bg-slate-50/50 transition-colors group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleGalleryChange(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="py-2">
                    <FiPackage className="mx-auto text-2xl text-slate-400 group-hover:text-slate-900 transition-colors mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Upload new gallery shots</p>
                  </div>
                </div>

                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {galleryPreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-white group">
                        <img src={src} alt="Gallery item" className="w-full h-full object-cover" />
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                          title="Remove image"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </form>
    </div>
  );
};

export default ProductUpdate;