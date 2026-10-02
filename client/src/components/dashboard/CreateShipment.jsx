import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiTruck, FiCheck, FiInfo, FiBox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import swal from "sweetalert";
import api from "../../utils/api";

const CreateShipment = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      orderId: "",
      carrier: "",
      trackingId: "",
      weight: "",
      dimensions: "",
      notes: ""
    },
    validationSchema: Yup.object({
      orderId: Yup.string().required("Order ID is required"),
      carrier: Yup.string().required("Please select a carrier"),
      
      // LOGIC UPDATE: Sirf "local" carrier ke liye hi tracking ID required hai
      trackingId: Yup.string().when("carrier", {
        is: (val) => val && val.toLowerCase() === "local",
        then: () => Yup.string().required("Tracking ID is required for local delivery"),
        otherwise: () => Yup.string().notRequired(),
      }),
      
      weight: Yup.number().typeError("Weight must be a number").positive("Must be greater than zero").required("Weight is required"),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await api.post('/api/admin/shipments', values);
        
        if (response.data.success) {
            swal("Success!", "Shipment published!", "success").then(() => {
                navigate('/admin/dashboard/shipping/shipmentmanagement'); 
            });
        }
      } catch (error) {
        console.error("Full Error:", error.response); 
        
        if (error.response?.status === 404) {
            swal("Error", "URL nahi mila (404). Backend route check karein.", "error");
        } else if (error.response?.status === 401) {
            swal("Error", "Unauthorized! Login expire ho gaya hai.", "error");
        } else {
            swal("Error", "Server Error: " + (error.response?.data?.message || error.message), "error");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Helper variables check karne ke liye ki kya selected hai
  const selectedCarrier = formik.values.carrier.toLowerCase();
  const isLocalCarrier = selectedCarrier === "local";
  const isApiCarrier = ["shiprocket", "delhivery", "bluedart", "ecom"].includes(selectedCarrier);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <FiTruck className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Create New Shipment</h1>
            <p className="text-xs text-slate-500 mt-0.5">Initialize outbound logistics for pending orders.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            disabled={isSubmitting}
            className="h-[42px] px-5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Discard
          </button>
          <button 
            onClick={formik.handleSubmit} 
            disabled={isSubmitting}
            className="h-[42px] px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <FiCheck />
            )}
            {isSubmitting ? 'Publishing...' : 'Publish Shipment'}
          </button>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MAIN FORM */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FiTruck className="text-slate-400" /> Shipment Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Order ID <span className="text-rose-500">*</span></label>
                  <input 
                    {...formik.getFieldProps("orderId")} 
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-1 transition-all ${formik.touched.orderId && formik.errors.orderId ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-slate-900'}`} 
                    placeholder="e.g. ORD-7722" 
                  />
                  {formik.touched.orderId && formik.errors.orderId && (
                    <p className="text-rose-500 text-[11px] font-medium mt-1">{formik.errors.orderId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Carrier <span className="text-rose-500">*</span></label>
                  <select 
                    {...formik.getFieldProps("carrier")} 
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-1 transition-all ${formik.touched.carrier && formik.errors.carrier ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-slate-900'}`}
                  >
                    <option value="">Select Carrier</option>
                    {/* Yahan Local Delivery Add Kiya Hai */}
                    <option value="local">Local Delivery</option>
                    <option value="shiprocket">Shiprocket</option>
                    <option value="delhivery">Delhivery</option>
                    <option value="bluedart">BlueDart</option>
                    <option value="ecom">Ecom Express</option>
                  </select>
                  {formik.touched.carrier && formik.errors.carrier && (
                    <p className="text-rose-500 text-[11px] font-medium mt-1">{formik.errors.carrier}</p>
                  )}
                </div>
              </div>

              {/* Box Sirf Local Delivery ke case mein dikhega */}
              {isLocalCarrier && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Tracking ID (AWB) <span className="text-rose-500">*</span></label>
                  <input 
                    {...formik.getFieldProps("trackingId")} 
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-1 transition-all ${formik.touched.trackingId && formik.errors.trackingId ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-slate-900'}`} 
                    placeholder="Enter barcode or tracking number" 
                  />
                  {formik.touched.trackingId && formik.errors.trackingId && (
                    <p className="text-rose-500 text-[11px] font-medium mt-1">{formik.errors.trackingId}</p>
                  )}
                </div>
              )}

              {/* Sabhi API carriers (Shiprocket, Delhivery, etc.) ke liye Auto-generated message dikhega */}
              {isApiCarrier && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2 text-sm text-amber-700">
                    <FiBox className="flex-shrink-0" />
                    Tracking ID will be automatically generated by the Carrier API.
                </div>
              )}

            </div>
          </div>

          {/* SIDE CARD */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FiBox className="text-slate-400" /> Package Specs
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Weight (kg) <span className="text-rose-500">*</span></label>
                  <input 
                    {...formik.getFieldProps("weight")} 
                    type="number" 
                    step="0.01"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-1 transition-all ${formik.touched.weight && formik.errors.weight ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-slate-900'}`} 
                    placeholder="0.0" 
                  />
                   {formik.touched.weight && formik.errors.weight && (
                    <p className="text-rose-500 text-[11px] font-medium mt-1">{formik.errors.weight}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">LxWxH (cm)</label>
                  <input 
                    {...formik.getFieldProps("dimensions")} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-900" 
                    placeholder="20x15x10" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Internal Notes (Optional)</label>
                <textarea 
                  {...formik.getFieldProps("notes")} 
                  rows="3" 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-slate-900" 
                  placeholder="Any specific instructions for warehouse staff..."
                />
              </div>
            </div>

            {/* INFO CARD */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 shadow-sm">
              <FiInfo className="text-blue-600 flex-shrink-0 mt-0.5 text-lg" />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Ensure the details are correct. Once published, the system will automatically notify the customer via email.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateShipment;