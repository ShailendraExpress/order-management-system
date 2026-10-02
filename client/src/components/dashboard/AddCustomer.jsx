import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import swal from "sweetalert";
import api, { getCsrfCookie } from "../../utils/api";

// Icons Import for UI elements
import { 
  FiUserPlus, FiCheck, FiUser, FiMail, FiPhone, FiLock, 
  FiMapPin, FiCalendar, FiShield, FiTag, FiCheckCircle
} from "react-icons/fi";
import { HiChevronDoubleLeft } from "react-icons/hi";

// Component definition for adding a new customer
const AddCustomer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Formik Initialization matching Database Columns exactly
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      gender: "Male",
      dob: "",
      customer_group: "Regular",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      is_active: 1,        // Database tinyint (1 = Active)
      email_verified: 0,    // Database tinyint (0 = Unverified, 1 = Verified)
      newsletter: 1,        // Database tinyint (1 = Subscribed)
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Full name is required"),
      email: Yup.string().email("Invalid email format").required("Email is required"),
      phone: Yup.string().matches(/^[0-9]+$/, "Must be only digits").min(10, "Minimum 10 digits").required("Phone number is required"),
      password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
      pincode: Yup.string().matches(/^[0-9]+$/, "Must be numbers").nullable().optional(),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Secure CSRF Cookie handshake for Laravel Sanctum authentication
        await getCsrfCookie();
        const response = await api.post('/api/v1/customers', values);
        
        // Check response status and show success notification
        if (response.data.status || response.data.success) {
          swal({
            title: "Customer Profile Created!",
            text: `${values.name}'s account is now live in the system.`,
            icon: "success",
            button: "View All Customers",
          }).then(() => {
            navigate("/admin/dashboard/allcustomers"); // Ensure route matches your App.js configuration
          });
        }
      } catch (error) {
        console.error("API Error:", error);
        const errorMsg = error.response?.data?.message || "Failed to create customer.";
        swal("Registration Failed", errorMsg, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* PAGE HEADER SECTION */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <FiUserPlus className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Create Customer Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5">Setup a complete buyer account with address and preferences.</p>
          </div>
        </div>

        {/* ACTION BUTTONS CONTAINER */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center h-[42px] px-5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <HiChevronDoubleLeft className="mr-1.5" /> Cancel
          </button>
          <button
            type="button"
            onClick={formik.handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer border border-slate-900"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
            ) : (
              <><FiCheck className="text-base text-slate-300" /> <span>Save Profile</span></>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: MAIN DETAILS (2/3 space ratio) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CARD 1: ACCOUNT CREDENTIALS */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
              <FiShield className="text-slate-500" /> Account Credentials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <FiUser className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                  <input type="text" {...formik.getFieldProps("name")} placeholder="e.g. Rahul Sharma" className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.name && formik.errors.name ? "border-rose-500" : "border-slate-300"} rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none`} />
                </div>
                {formik.touched.name && formik.errors.name && <p className="text-xs text-rose-500 mt-1">{formik.errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <FiMail className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                  <input type="email" {...formik.getFieldProps("email")} placeholder="rahul@example.com" className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.email && formik.errors.email ? "border-rose-500" : "border-slate-300"} rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none`} />
                </div>
                {formik.touched.email && formik.errors.email && <p className="text-xs text-rose-500 mt-1">{formik.errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Phone <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <FiPhone className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                  <input type="text" {...formik.getFieldProps("phone")} placeholder="10-digit mobile number" className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.phone && formik.errors.phone ? "border-rose-500" : "border-slate-300"} rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none`} />
                </div>
                {formik.touched.phone && formik.errors.phone && <p className="text-xs text-rose-500 mt-1">{formik.errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Initial Password <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <FiLock className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                  {/* SECURITY FIX: Changed input type from "text" to "password" to mask sensitive credentials */}
                  <input type="password" {...formik.getFieldProps("password")} placeholder="Assign a secure password" className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.password && formik.errors.password ? "border-rose-500" : "border-slate-300"} rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none`} />
                </div>
                {formik.touched.password && formik.errors.password && <p className="text-xs text-rose-500 mt-1">{formik.errors.password}</p>}
              </div>
            </div>
          </div>

          {/* CARD 2: ADDRESS MANAGEMENT */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
              <FiMapPin className="text-slate-500" /> Default Shipping Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Address Line 1</label>
                <input type="text" {...formik.getFieldProps("address_line1")} placeholder="Flat, House no., Building, Company, Apartment" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Address Line 2 (Optional)</label>
                <input type="text" {...formik.getFieldProps("address_line2")} placeholder="Area, Colony, Street, Sector, Village" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">City / Town</label>
                <input type="text" {...formik.getFieldProps("city")} placeholder="e.g. New Delhi" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">State</label>
                <input type="text" {...formik.getFieldProps("state")} placeholder="e.g. Delhi" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Pincode / ZIP</label>
                <input type="text" {...formik.getFieldProps("pincode")} placeholder="6 digits [0-9]" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Country</label>
                <select {...formik.getFieldProps("country")} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none">
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="UAE">United Arab Emirates</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TAXONOMY & STATUS (1/3 space ratio) */}
        <div className="space-y-6">
          
          {/* CARD 3: DEMOGRAPHICS */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5">
              Demographics
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Customer Group</label>
                <div className="relative">
                  <FiTag className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                  <select {...formik.getFieldProps("customer_group")} className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none">
                    <option value="Regular">Regular Customer</option>
                    <option value="VIP">VIP (Premium)</option>
                    <option value="Wholesale">Wholesale / B2B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Date of Birth</label>
                <div className="relative">
                  <FiCalendar className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                  <input type="date" {...formik.getFieldProps("dob")} className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none text-slate-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Gender</label>
                <div className="flex gap-4">
                  {["Male", "Female", "Other"].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g} 
                        checked={formik.values.gender === g}
                        onChange={formik.handleChange} 
                        className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900" 
                      /> {g}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: ACCOUNT SECURITY & STATUS */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5">
              Account Controls
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Account Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Active", value: 1 },
                    { label: "Suspended", value: 0 }
                  ].map((st) => (
                    <label key={st.label} className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="is_active" 
                        onChange={() => formik.setFieldValue("is_active", st.value)} 
                        checked={formik.values.is_active === st.value} 
                        className="sr-only peer" 
                      />
                      <div className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-xs font-bold text-slate-600 uppercase tracking-wider peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all">
                        {st.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggles Container */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 border border-slate-300 rounded bg-slate-50 group-hover:border-slate-400">
                    <input 
                      type="checkbox" 
                      checked={formik.values.email_verified === 1}
                      onChange={(e) => formik.setFieldValue("email_verified", e.target.checked ? 1 : 0)} 
                      className="peer sr-only" 
                    />
                    <FiCheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 peer-checked:text-emerald-500 absolute transition-all" />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">Email Verified</span>
                    <span className="block text-xs text-slate-500">Bypass email OTP verification</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 border border-slate-300 rounded bg-slate-50 group-hover:border-slate-400">
                    <input 
                      type="checkbox" 
                      checked={formik.values.newsletter === 1}
                      onChange={(e) => formik.setFieldValue("newsletter", e.target.checked ? 1 : 0)} 
                      className="peer sr-only" 
                    />
                    <FiCheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 peer-checked:text-slate-900 absolute transition-all" />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">Marketing Opt-in</span>
                    <span className="block text-xs text-slate-500">Subscribe to deals and offers</span>
                  </div>
                </label>
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default AddCustomer;