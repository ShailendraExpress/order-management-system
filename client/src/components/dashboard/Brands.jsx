import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import swal from "sweetalert";
import api, { getCsrfCookie } from "../../utils/api";

// Icons
import { MdOutlineBrandingWatermark } from "react-icons/md";
import { FiSearch, FiCheck, FiEdit2, FiTrash2, FiFolderPlus } from "react-icons/fi";

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBrand, setEditingBrand] = useState(null);

  // Secure fetch brands function with CSRF handshake and array validation
  const fetchBrands = useCallback(async () => {
    try {
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }
      const res = await api.get('/api/v1/brands');
      setBrands(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Error fetching brands securely:", err);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Formik configuration for adding or updating brands
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { title: editingBrand ? editingBrand.title : "" },
    validationSchema: Yup.object({ title: Yup.string().required("Brand title is required") }),
    onSubmit: async (values, { resetForm }) => {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }
        
        // Secure sanitization of input values
        const sanitizedTitle = String(values.title || "").trim();

        if (editingBrand) {
          await api.patch(`/api/v1/brands/${editingBrand.id}`, { title: sanitizedTitle });
          swal("Updated!", "Brand updated successfully.", "success");
        } else {
          await api.post('/api/v1/brands', { title: sanitizedTitle });
          swal("Added!", "New brand created.", "success");
        }
        fetchBrands(); // Refresh list safely
        setEditingBrand(null);
        resetForm();
      } catch (err) {
        swal("Error", "Something went wrong", "error");
      }
    },
  });

  // Null-safe search filtering logic
  const filteredBrands = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return brands.filter((b) => {
      const titleMatch = b.title ? String(b.title).toLowerCase().includes(query) : false;
      return titleMatch;
    });
  }, [brands, searchTerm]);

  // Secure Delete Handler with CSRF check
  const handleDelete = async (id) => {
    if (!id) return;

    const willDelete = await swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this brand!",
      icon: "warning",
      buttons: true,
      dangerMode: true
    });
    
    if (willDelete) {
      try {
        if (typeof getCsrfCookie === 'function') {
          await getCsrfCookie();
        }
        await api.delete(`/api/v1/brands/${id}`);
        fetchBrands();
        swal("Deleted!", "Brand has been removed.", "success");
      } catch (error) {
        const errorMsg = error.response?.data?.message || "Could not delete brand.";
        swal("Action Failed", errorMsg, "error");
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <MdOutlineBrandingWatermark className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Brand Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage all registered manufacturers and brands.</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
          Total Brands: <strong className="text-slate-900">{brands.length}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* FORM CARD */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs sticky top-24">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
            <FiFolderPlus className="text-slate-600" />
            {editingBrand ? "Edit Brand" : "Add New Brand"}
          </h2>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <input
              type="text"
              {...formik.getFieldProps("title")}
              placeholder="e.g. Sony"
              className="w-full h-[42px] px-3.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none transition-all"
            />
            {formik.touched.title && formik.errors.title && <p className="text-xs text-rose-500">{formik.errors.title}</p>}
            
            <div className="flex gap-2">
              {editingBrand && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBrand(null);
                    formik.resetForm();
                  }}
                  className="w-1/3 inline-flex items-center justify-center h-[42px] px-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all active:scale-98 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className={`${editingBrand ? 'w-2/3' : 'w-full'} inline-flex items-center justify-center gap-2 h-[42px] px-5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all active:scale-98 border border-slate-900 cursor-pointer`}>
                <FiCheck className="text-base text-slate-300" />
                <span>{editingBrand ? "Update Brand" : "Save Brand"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* TABLE CARD */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Brand Inventory</h2>
            <input
              placeholder="Search brands..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-[38px] px-3 border border-slate-300 rounded-lg text-xs w-48 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50/75 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Brand Details</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Products</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-100">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium">
                       <p className="text-sm font-bold text-slate-800">No Brands found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          No Brand matches "{searchTerm}". Try another keyword or create a new taxonomy above.
                        </p>
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors duration-150 text-sm">

                      {/* Brand Details */}
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{b.title}</span>
                          <span className="text-xs font-mono text-slate-400 mt-0.5">ID: #{b.id}</span>
                        </div>
                      </td>

                      {/* Product Count with Rounded Rectangle Badges */}
                      <td className="px-6 py-3.5">
                        {b.products_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {b.products_count} items
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            0 items
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        {b.is_active || b.is_active === undefined ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-300">
                            Hidden
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => setEditingBrand(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-xs font-medium transition-all shadow-2xs active:scale-98 cursor-pointer"
                          >
                            <FiEdit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-medium transition-all shadow-2xs active:scale-98 cursor-pointer"
                          >
                            <FiTrash2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Brands;