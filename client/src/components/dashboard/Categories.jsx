import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import swal from "sweetalert";

// API utility import
import api, { getCsrfCookie } from "../../utils/api";

// Icons
import { MdOutlineCategory } from "react-icons/md";
import { FiSearch, FiCheck, FiEdit2, FiTrash2, FiFolderPlus } from "react-icons/fi";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

  // ==========================================
  // 1. FETCH CATEGORIES (GET)
  // ==========================================
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      // Optional initial cookie handshake
      if (typeof getCsrfCookie === 'function') {
        await getCsrfCookie();
      }
      const response = await api.get('/api/v1/categories');
      if (response.data?.status || response.data?.success) {
        setCategories(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      swal("Error", "Could not load categories from database.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Null-safe filtered categories based on search input
  const filteredCategories = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return categories;

    return categories.filter((cat) => {
      const titleMatch = cat.title ? String(cat.title).toLowerCase().includes(query) : false;
      const slugMatch = cat.slug ? String(cat.slug).toLowerCase().includes(query) : false;
      const descMatch = cat.description ? String(cat.description).toLowerCase().includes(query) : false;
      return titleMatch || slugMatch || descMatch;
    });
  }, [categories, searchTerm]);

  // ==========================================
  // 2. INSTANT FORMIK SUBMISSION (POST / PUT)
  // ==========================================
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: editingCategory ? editingCategory.title : "",
      slug: editingCategory ? editingCategory.slug : "",
      description: editingCategory ? editingCategory.description || "" : "",
      is_active: editingCategory ? editingCategory.is_active : true,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Category title is required"),
      slug: Yup.string()
        .matches(/^[a-z0-9-]+$/, "Slug must be lowercase letters and hyphens only")
        .required("Category slug/ID is required"),
      description: Yup.string().max(120, "Keep description under 120 characters").required("Brief description required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        // NOTE: getCsrfCookie() yahan se hata diya hai taaki category instant add/update ho bina extra network delay ke.

        // Secure input sanitization
        const sanitizedTitle = String(values.title || "").trim();
        const sanitizedSlug = String(values.slug || "").trim();
        const sanitizedDescription = String(values.description || "").trim();

        const payload = {
          ...values,
          title: sanitizedTitle,
          slug: sanitizedSlug,
          description: sanitizedDescription,
        };

        if (editingCategory) {
          // UPDATE REQUEST (PUT)
          const response = await api.put(`/api/v1/categories/${editingCategory.id}`, payload);
          if (response.data?.status || response.data?.success) {
            setCategories((prev) =>
              prev.map((cat) => (cat.id === editingCategory.id ? response.data.data : cat))
            );
            swal("Updated!", `${sanitizedTitle} has been updated in database.`, "success");
            setEditingCategory(null);
          }
        } else {
          // CREATE REQUEST (POST) - Instant execution
          const response = await api.post('/api/v1/categories', payload);
          if (response.data?.status || response.data?.success) {
            setCategories((prev) => [response.data.data, ...prev]);
            swal("Published!", `${sanitizedTitle} added to database.`, "success");
          }
        }
        resetForm();
      } catch (error) {
        console.error("API Error:", error);
        const errorMsg = error.response?.data?.message || "Could not process category action.";
        swal("Error", errorMsg, "error");
      }
    },
  });

  // Auto-generate slug from title input safely
  const handleTitleChange = (e) => {
    const val = e.target.value;
    formik.setFieldValue("title", val);
    if (!editingCategory) {
      const generatedSlug = String(val).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      formik.setFieldValue("slug", generatedSlug);
    }
  };

  const handleEdit = useCallback((category) => {
    setEditingCategory(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ==========================================
  // 3. DELETE CATEGORY (DELETE)
  // ==========================================
  const handleDelete = useCallback(async (id, title) => {
    if (!id) return;

    if (window.confirm(`Are you sure you want to delete "${title || 'this category'}"?`)) {
      try {
        const response = await api.delete(`/api/v1/categories/${id}`);

        if (response.data?.status || response.data?.success) {
          setCategories((prev) => prev.filter((cat) => cat.id !== id));
          swal("Deleted!", "Category permanently removed.", "success");
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || "Could not delete category.";
        swal("Action Failed", errorMsg, "error");
      }
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 w-full flex-1 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* TOP HEADER CARD */}
      <div className="mb-6 bg-white border border-slate-200/80 rounded-xl px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
            <MdOutlineCategory className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Category Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Create, structure, and organize product classification hierarchy.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
            Total Categories: <strong className="text-slate-900">{categories.length}</strong>
          </span>
        </div>
      </div>

      {/* 2-COLUMN SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COLUMN: ADD / EDIT FORM CARD */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FiFolderPlus className="text-slate-600" />
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            {editingCategory && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  formik.resetForm();
                }}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Category Title */}
            <div>
              <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formik.values.title}
                onChange={handleTitleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Smart Watches"
                className={`w-full h-[42px] px-3.5 bg-slate-50/50 border ${formik.touched.title && formik.errors.title ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="text-xs font-medium text-rose-500 mt-1">{formik.errors.title}</p>
              )}
            </div>

            {/* Category Slug / ID */}
            <div>
              <label htmlFor="slug" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Slug / Key ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                {...formik.getFieldProps("slug")}
                placeholder="e.g. smart-watches"
                className={`w-full h-[42px] px-3.5 bg-slate-50/50 border ${formik.touched.slug && formik.errors.slug ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
              />
              {formik.touched.slug && formik.errors.slug && (
                <p className="text-xs font-medium text-rose-500 mt-1">{formik.errors.slug}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Brief Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                rows="3"
                {...formik.getFieldProps("description")}
                placeholder="Short summary of items inside this category..."
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${formik.touched.description && formik.errors.description ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                  } rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all resize-none`}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-xs font-medium text-rose-500 mt-1">{formik.errors.description}</p>
              )}
            </div>

            {/* Status Radio */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Visibility Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Active", value: true },
                  { label: "Hidden", value: false }
                ].map((st) => (
                  <label key={st.label} className="cursor-pointer">
                    <input
                      type="radio"
                      name="is_active"
                      value={st.value}
                      onChange={() => formik.setFieldValue("is_active", st.value)}
                      checked={formik.values.is_active === st.value}
                      className="sr-only peer"
                    />
                    <div className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50/50 text-center text-xs font-semibold text-slate-600 uppercase peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white hover:bg-slate-100 transition-all">
                      {st.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 h-[42px] px-5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-all active:scale-98 cursor-pointer border border-slate-900 disabled:opacity-50"
              >
                <FiCheck className="text-base text-slate-300" />
                <span>{editingCategory ? "Update Category" : "Save Category"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE CATEGORIES TABLE CARD */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[500px]">

          {/* Card Header & Search */}
          <div className="px-6 py-4 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Taxonomy Inventory
            </h2>

            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="text-slate-400 text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search category or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-9 pr-4 bg-slate-50 border border-slate-300 rounded-lg text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50/75 border-b border-slate-200/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Category Details
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Products
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium">
                      Loading categories from database...
                    </td>
                  </tr>
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors duration-150 text-sm">

                      <td className="px-6 py-3.5">
                        <div className="flex flex-col min-w-0 max-w-xs">
                          <span className="font-bold text-slate-900 truncate">
                            {cat.title}
                          </span>
                          <span className="text-xs font-mono text-slate-400 mt-0.5">
                            ID: #{cat.slug}
                          </span>
                          <span className="text-xs text-slate-500 mt-1 truncate">
                            {cat.description}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {cat.products_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {cat.products_count} items
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            0 items
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {cat.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-300">
                            Hidden
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(cat)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 text-xs font-medium transition-all shadow-2xs active:scale-98 cursor-pointer"
                          >
                            <FiEdit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.title)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-rose-50/60 hover:border-rose-200 hover:text-rose-600 text-xs font-medium transition-all shadow-2xs active:scale-98 cursor-pointer"
                          >
                            <FiTrash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="max-w-xs mx-auto flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center mb-3">
                          <FiSearch className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">No categories found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          No category matches "{searchTerm}". Try another keyword or create a new taxonomy above.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {filteredCategories.length} category classifications</span>
            <span>Taxonomy Sync: <strong className="text-emerald-600">Active (Live API)</strong></span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Categories;