import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import swal from "sweetalert";
import { useDispatch, useSelector } from "react-redux";
import api from "../../utils/api";

// Icons Import
import { FaDollarSign } from "react-icons/fa";
import { IoMdAddCircle } from "react-icons/io";
import { FiUploadCloud, FiCheck, FiPackage } from "react-icons/fi";
import { HiChevronDoubleLeft } from "react-icons/hi";

// Actions & Components Import
import { addProduct } from "../../store/actions/products-actions";
import TheSpinner from "../../layout/TheSpinner";

const AddProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token);
  
  // Local submission loading state to handle button spinner smoothly
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. ALL HOOKS AT THE TOP
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [dynamicBrands, setDynamicBrands] = useState([]);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/api/v1/categories?active=1'),
          api.get('/api/v1/brands')
        ]);

        // Check category response structure (if nested inside 'data' key)
        const categoriesList = Array.isArray(catRes.data?.data) ? catRes.data.data : [];

        // Check brand response structure
        const brandsList = Array.isArray(brandRes.data?.data) ? brandRes.data.data : [];

        setDynamicCategories(categoriesList);
        setDynamicBrands(brandsList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const createRandomSKU = () => {
    return "SKU-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  };

  const initialValues = {
    name: "",
    description: "",
    price: "",
    stock: 0,
    category: "",
    brand: "",
    shipping: false,
    thumbnail: null,
    images: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      name: Yup.string().required("Product title is required"),
      description: Yup.string().min(20, "Please provide at least 20 characters").required("Description is required"),
      price: Yup.number()
        .typeError("Must be a valid number")
        .required("Price is required")
        .positive("Price must be greater than 0"),
      stock: Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Stock is required"),
      category: Yup.string().required("Please select a category"),
      brand: Yup.string().required("Please select a brand"),
      thumbnail: Yup.mixed().required("Primary thumbnail is required"),
      images: Yup.array().min(1, "Upload at least 1 gallery image").max(4, "Maximum 4 images allowed"),
    }),
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true); // Start loading spinner

      const formData = new FormData();
      formData.append("thumbnail", values.thumbnail);

      values.images.forEach((file) => {
        formData.append("images[]", file);
      });

      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("stock", values.stock);
      formData.append("category", values.category);
      formData.append("brand", values.brand);
      formData.append("sku", createRandomSKU());
      formData.append("shipping", values.shipping ? 1 : 0);

      const payload = {
        product: formData,
        token,
      };

      try {
        await dispatch(addProduct(payload));
        resetForm();
        setThumbnailPreview(null);
        setGalleryPreviews([]);

  swal({
          title: "Product Published!",
          text: `${values.name} is now live on your store catalog.`,
          icon: "success",
          button: "OK", // Yahan 'OK' button aa jayega
        }).then(() => {
          // Jaise hi user 'OK' par click karega, wo seedha product catalog page par chale jayega
          navigate('/admin/dashboard/products');
        });
      } catch (error) {
        console.error("Failed to create product:", error);
        swal("Publish Failed", "Something went wrong communicating with the server.", "error");
      } finally {
        setIsSubmitting(false); // Always stop spinner whether success or failure
      }
    },
  });

  const handleThumbnailChange = useCallback((file) => {
    if (file) {
      formik.setFieldValue("thumbnail", file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  }, [formik]);

  const handleGalleryChange = useCallback((files) => {
    const newFiles = Array.from(files);

    // Combine previous and new files into Formik state (Max 4 limit)
    const combinedFiles = [...formik.values.images, ...newFiles].slice(0, 4);
    formik.setFieldValue("images", combinedFiles);

    // Generate new object URLs and append to previews list
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prevPreviews) => [...prevPreviews, ...newPreviews].slice(0, 4));

  }, [formik]);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* PAGE HEADER */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <IoMdAddCircle className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Add New Product</h1>
            <p className="text-xs text-slate-500 mt-0.5">Create a new product card and publish it to your catalog.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Back Navigation Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center h-[42px] px-5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <HiChevronDoubleLeft className="mr-1.5" /> Back
          </button>
          
          <button
            type="button"
            onClick={formik.handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap flex-shrink-0 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer border border-slate-900"
          >
            {isSubmitting ? <TheSpinner /> : <><FiCheck className="text-base text-slate-300 flex-shrink-0" /> <span>Publish Product</span></>}
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
                  placeholder="e.g. Apple MacBook Air M3 (16GB RAM, 512GB SSD)"
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${formik.touched.name && formik.errors.name ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
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
                  placeholder="Detail the product specifications, hardware performance, and box contents..."
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${formik.touched.description && formik.errors.description ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
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
                      placeholder="0.00"
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.price && formik.errors.price ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                        } rounded-lg text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                    />
                  </div>
                  {formik.touched.price && formik.errors.price && (
                    <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.price}</p>
                  )}
                </div>

                {/* Stock Quantity Input Field */}
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

                <div className="pt-6 sm:col-span-2">
                  <label className="relative flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      {...formik.getFieldProps("shipping")}
                      checked={formik.values.shipping}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
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
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${formik.touched.category && formik.errors.category ? "border-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                    } rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                >
                  <option value="" disabled>Select primary category</option>

                  {/* Dynamic Categories Mapping */}
                  {dynamicCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
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
                  {dynamicBrands.map((brand) => (
                    <label key={brand.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="brand"
                        value={brand.title}
                        onChange={formik.handleChange}
                        checked={formik.values.brand === brand.title}
                        className="sr-only peer"
                      />
                      <div className="px-3 py-2 border rounded-lg text-center text-xs peer-checked:bg-slate-900 peer-checked:text-white transition-all">
                        {brand.title}
                      </div>
                    </label>
                  ))}
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
                  Primary Thumbnail <span className="text-rose-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-xl p-4 text-center bg-slate-50/50 transition-colors group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleThumbnailChange(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {thumbnailPreview ? (
                    <div className="relative h-32 w-full flex items-center justify-center">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="max-h-full rounded-md object-contain shadow-2xs" />
                    </div>
                  ) : (
                    <div className="py-4">
                      <FiUploadCloud className="mx-auto text-2xl text-slate-400 group-hover:text-slate-900 transition-colors mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Click to upload thumbnail</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
                {formik.touched.thumbnail && formik.errors.thumbnail && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.thumbnail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Gallery Showcase (Max 4)
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
                    <p className="text-xs font-semibold text-slate-700">Upload gallery shots</p>
                  </div>
                </div>

                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {galleryPreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-white">
                        <img src={src} alt="Gallery item" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {formik.touched.images && formik.errors.images && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.images}</p>
                )}
              </div>

            </div>

          </div>

        </div>
      </form>
    </div>
  );
};

export default AddProduct;