import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import swal from "sweetalert";
import api, { getCsrfCookie } from "../../utils/api";

// Icons
import { 
  FiUserCheck, FiCheck, FiUser, FiMail, FiPhone, FiLock, 
  FiMapPin, FiCalendar, FiShield, FiTag, FiCheckCircle
} from "react-icons/fi";
import { HiChevronDoubleLeft } from "react-icons/hi";

const EditCustomer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Formik Initialization with default safe values
  const formik = useFormik({
    enableReinitialize: true,
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
      is_active: 1,
      email_verified: 0,
      newsletter: 1,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Full name is required"),
      email: Yup.string().email("Invalid email format").required("Email is required"),
      phone: Yup.string().matches(/^[0-9]+$/, "Must be only digits").min(10, "Minimum 10 digits").required("Phone number is required"),
      password: Yup.string().min(6, "Password must be at least 6 characters").nullable().optional().transform((val) => (val === "" ? null : val)),
      pincode: Yup.string().matches(/^[0-9]+$/, "Must be numbers").nullable().optional(),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Secure CSRF Cookie handshake for Laravel Sanctum authentication
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        // Update customer profile using the global secure API instance
        const response = await api.put(`/api/v1/customers/${id}`, values);
        
        if (response.data.status || response.data.success) {
          swal({
            title: "Profile Updated!",
            text: `${values.name}'s account has been successfully updated.`,
            icon: "success",
            button: "Back to Customers",
          }).then(() => {
            navigate("/admin/dashboard/allcustomers"); 
          });
        }
      } catch (error) {
        console.error("API Error updating customer:", error);
        const errorMsg = error.response?.data?.message || "Failed to update customer profile.";
        swal("Update Failed", errorMsg, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch Existing Customer Data on Component Mount
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setFetching(true);
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }

        const response = await api.get(`/api/v1/customers/${id}`);
        
        if (response.data.status || response.data.success) {
          const cust = response.data.data;
          
          formik.setValues({
            name: cust.name || "",
            email: cust.email || "",
            phone: cust.phone || "",
            password: "",
            gender: cust.gender || "Male",
            dob: cust.dob || "",
            customer_group: cust.customer_group || "Regular",
            address_line1: cust.address_line1 || "",
            address_line2: cust.address_line2 || "",
            city: cust.city || "",
            state: cust.state || "",
            pincode: cust.pincode || "",
            country: cust.country || "India",
            is_active: cust.is_active !== undefined ? Number(cust.is_active) : 1,
            email_verified: cust.email_verified !== undefined ? Number(cust.email_verified) : 0,
            newsletter: cust.newsletter !== undefined ? Number(cust.newsletter) : 1,
          });
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
        swal("Error", "Could not fetch customer details.", "error");
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchCustomerDetails();
    } else {
      setFetching(false);
    }
  }, [id]);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* PAGE HEADER - Remains sticky and always visible to prevent white screen layouts */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <FiUserCheck className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Edit Customer Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5">Modify buyer account details, addresses, and status.</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center h-[42px] px-5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={formik.handleSubmit}
            disabled={loading || fetching}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer border border-slate-900"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
            ) : (
              <><FiCheck className="text-base text-slate-300" /> <span>Update Profile</span></>
            )}
          </button>
        </div>
      </div>

      {/* CONTENT AREA - Displays inline loader while fetching data without disturbing the header */}
      {fetching ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-20 text-center shadow-xs">
          <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2 align-middle"></div>
          <span className="text-sm font-semibold text-slate-500">Loading customer profile details...</span>
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: MAIN DETAILS (CREDENTIALS & ADDRESS) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CREDENTIALS SECTION */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <FiShield className="text-slate-500" /> Account Credentials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <FiUser className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                    <input type="text" {...formik.getFieldProps("name")} className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.name && formik.errors.name ? "border-rose-500" : "border-slate-300"} rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none`} />
                  </div>
                  {formik.touched.name && formik.errors.name && <p className="text-xs text-rose-500 mt-1">{formik.errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <FiMail className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                    <input type="email" {...formik.getFieldProps("email")} className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.email && formik.errors.email ? "border-rose-500" : "border-slate-300"} rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none`} />
                  </div>
                  {formik.touched.email && formik.errors.email && <p className="text-xs text-rose-500 mt-1">{formik.errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Phone <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <FiPhone className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                    <input type="text" {...formik.getFieldProps("phone")} className={`w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border ${formik.touched.phone && formik.errors.phone ? "border-rose-500" : "border-slate-300"} rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none`} />
                  </div>
                  {formik.touched.phone && formik.errors.phone && <p className="text-xs text-rose-500 mt-1">{formik.errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">New Password (Optional)</label>
                  <div className="relative">
                    <FiLock className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                    <input type="password" {...formik.getFieldProps("password")} placeholder="Leave blank to keep old password" className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                  </div>
                  {formik.touched.password && formik.errors.password && <p className="text-xs text-rose-500 mt-1">{formik.errors.password}</p>}
                </div>
              </div>
            </div>

            {/* SHIPPING ADDRESS SECTION */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <FiMapPin className="text-slate-500" /> Default Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Address Line 1</label>
                  <input type="text" {...formik.getFieldProps("address_line1")} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Address Line 2 (Optional)</label>
                  <input type="text" {...formik.getFieldProps("address_line2")} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">City / Town</label>
                  <input type="text" {...formik.getFieldProps("city")} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">State</label>
                  <input type="text" {...formik.getFieldProps("state")} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Pincode / ZIP</label>
                  <input type="text" {...formik.getFieldProps("pincode")} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Country</label>
                  <select {...formik.getFieldProps("country")} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer">
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="UAE">United Arab Emirates</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: DEMOGRAPHICS & ACCOUNT CONTROLS */}
          <div className="space-y-6">
            
            {/* DEMOGRAPHICS SECTION */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-5">
                Demographics
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Customer Group</label>
                  <div className="relative">
                    <FiTag className="absolute inset-y-0 left-3.5 my-auto text-slate-400" />
                    <select {...formik.getFieldProps("customer_group")} className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer">
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
                          className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer" 
                        /> {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ACCOUNT CONTROLS SECTION */}
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
                          checked={Number(formik.values.is_active) === st.value} 
                          className="sr-only peer" 
                        />
                        <div className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-xs font-bold text-slate-600 uppercase tracking-wider peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white transition-all">
                          {st.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Verification & Marketing Toggles */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 border border-slate-300 rounded bg-slate-50 group-hover:border-slate-400">
                      <input 
                        type="checkbox" 
                        checked={Number(formik.values.email_verified) === 1}
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
                        checked={Number(formik.values.newsletter) === 1}
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
      )}
    </div>
  );
};

export default EditCustomer;