import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FiTag, FiCheck, FiArrowLeft, FiInfo, FiPercent, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert'; 

// Import secure custom api utility with Sanctum cookie handshake
import api, { getCsrfCookie } from '../../utils/api';

const CreateCoupon = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      code: '',
      discountType: 'percentage', // 'percentage' or 'fixed'
      discountValue: '',
      minOrderAmount: '',
      usageLimit: '',
      expiryDate: '',
      status: 'Active',
    },
    validationSchema: Yup.object({
      code: Yup.string()
        .matches(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric (e.g., SUMMER50)")
        .required('Coupon code is required'),
      discountValue: Yup.number()
        .typeError('Must be a number')
        .positive('Must be greater than 0')
        .required('Discount value is required'),
      minOrderAmount: Yup.number()
        .typeError('Must be a number')
        .min(0, 'Cannot be negative')
        .nullable()
        .optional(),
      usageLimit: Yup.number()
        .typeError('Must be a number')
        .positive('Must be at least 1')
        .integer('Must be a whole number')
        .nullable()
        .optional(),
      expiryDate: Yup.date()
        .min(new Date(), 'Expiry date cannot be in the past')
        .required('Expiry date is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);

      try {
        // Secure CSRF Cookie handshake for Laravel Sanctum authentication
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        // Secure sanitization of input values
        const sanitizedData = {
          ...values,
          code: String(values.code || "").trim().toUpperCase(),
          discountValue: Number(values.discountValue),
          minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : null,
          usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
        };

        // Send POST request securely via global api utility instance (matches /api/v1/coupons route)
        const response = await api.post('/api/v1/coupons', sanitizedData);

        if (response.data?.status || response.data?.success || response.status === 201 || response.status === 200) {
          swal("Success!", "Coupon created successfully!", "success");
          resetForm();
          navigate(-1); 
        }

      } catch (error) {
        console.error('Error creating coupon securely:', error);
        const errorMsg = error.response?.data?.message || "Something went wrong. Please try again.";
        swal("Error!", errorMsg, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <FiTag className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Create New Coupon</h1>
            <p className="text-xs text-slate-500 mt-0.5">Generate a promotional discount code for your store checkout.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            disabled={loading}
            className="h-[42px] px-5 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            Discard
          </button>
          
          {/* Submit Button with Loading State */}
          <button 
            type="button"
            onClick={formik.handleSubmit} 
            disabled={loading}
            className={`h-[42px] px-6 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 shadow-xs transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loading ? (
               <span>Saving...</span> 
            ) : (
              <>
                <FiCheck className="text-base text-slate-300" /> Save & Publish
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: MAIN FORM */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Settings Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                General Settings
              </h2>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Coupon Code <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  {...formik.getFieldProps("code")} 
                  onChange={(e) => formik.setFieldValue("code", e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border font-mono uppercase ${
                    formik.touched.code && formik.errors.code ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`} 
                  placeholder="e.g. MEGA2026" 
                />
                {formik.touched.code && formik.errors.code && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.code}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Discount Type
                  </label>
                  <select 
                    {...formik.getFieldProps("discountType")} 
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount Off (₹ / $)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Discount Value <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      {formik.values.discountType === 'percentage' ? <FiPercent /> : <FiDollarSign />}
                    </div>
                    <input 
                      type="number"
                      step="any"
                      {...formik.getFieldProps("discountValue")} 
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border font-mono ${
                        formik.touched.discountValue && formik.errors.discountValue ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                      } rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`} 
                      placeholder={formik.values.discountType === 'percentage' ? "e.g. 20" : "e.g. 500"} 
                    />
                  </div>
                  {formik.touched.discountValue && formik.errors.discountValue && (
                    <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.discountValue}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Restrictions & Limits Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Requirements & Limits
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Minimum Order Amount
                  </label>
                  <input 
                    type="number"
                    {...formik.getFieldProps("minOrderAmount")} 
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" 
                    placeholder="e.g. 1499 (Optional)" 
                  />
                  {formik.touched.minOrderAmount && formik.errors.minOrderAmount && (
                    <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.minOrderAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Total Usage Limit
                  </label>
                  <input 
                    type="number"
                    {...formik.getFieldProps("usageLimit")} 
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" 
                    placeholder="e.g. 1000 (Optional)" 
                  />
                  {formik.touched.usageLimit && formik.errors.usageLimit && (
                    <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.usageLimit}</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: STATUS & DATES */}
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Status & Expiry
              </h2>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Coupon Status
                </label>
                <select 
                  {...formik.getFieldProps("status")} 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-medium"
                >
                  <option value="Active">Active immediately</option>
                  <option value="Draft">Save as Draft / Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Expiry Date <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date"
                  {...formik.getFieldProps("expiryDate")} 
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${
                    formik.touched.expiryDate && formik.errors.expiryDate ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all`} 
                />
                {formik.touched.expiryDate && formik.errors.expiryDate && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{formik.errors.expiryDate}</p>
                )}
              </div>
            </div>

            {/* INFO ALERT CARD */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-4 flex gap-3 text-slate-700 shadow-2xs">
              <FiInfo className="text-blue-600 text-lg flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1">
                <p className="font-bold text-blue-950">How Coupons Route Works</p>
                <p>Once published, customers can enter this uppercase code during the checkout process to automatically deduct the specified discount.</p>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
};

export default CreateCoupon;