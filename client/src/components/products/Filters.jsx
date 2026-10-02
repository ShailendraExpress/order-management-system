import React, { useEffect } from "react";
import { productsActions } from "../../store/products-slice";
import { useDispatch, useSelector } from "react-redux";
import { BRANDS, CATEGORIES } from "../../utils/constants";
import { formatPrice } from "../../utils/helpers";

const Filters = ({ filters }) => {
  const dispatch = useDispatch();
  const minPrice = useSelector((state) => state.products.minPrice);
  const maxPrice = useSelector((state) => state.products.maxPrice);

  const updateFilters = (e) => {
    let name = e.target.name;
    let value = e.target.value;

    if (name === "category") {
      value = e.target.textContent;
    }
    if (name === "company") {
      value = e.target.value.toLowerCase();
    }
    if (name === "price") {
      value = Number(value);
    }
    if (name === "shipping") {
      value = e.target.checked;
    }

    dispatch(
      productsActions.setFilters({
        ...filters,
        [name]: value,
      })
    );
  };

  const clearFilters = () => {
    dispatch(productsActions.clearFilter());
  };

  useEffect(() => {
    dispatch(productsActions.filterProducts(filters));
  }, [dispatch, filters]);

  return (
    <div className="w-full">
      
      {/* FILTER HEADER (Flipkart Style) */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        <button 
          onClick={clearFilters}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
        >
          Clear All
        </button>
      </div>

      <form className="space-y-7">
        
        {/* SEARCH BAR (Minimalist Line Style) */}
        <div>
          <input
            type="text"
            name="search"
            value={filters.search || ""}
            placeholder="Search products..."
            onChange={updateFilters}
            className="w-full pb-2 border-b-2 border-gray-200 focus:border-blue-600 bg-transparent outline-none text-sm font-medium transition-colors text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* CATEGORIES SECTION */}
        <div>
          <h4 className="mb-3 font-bold uppercase text-xs tracking-widest text-gray-500">
            Category
          </h4>
          <ul className="space-y-1">
            {CATEGORIES.map((c, index) => {
              const isActive = filters.category === c;
              return (
                <li key={index}>
                  <button
                    type="button"
                    name="category"
                    onClick={updateFilters}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
                    }`}
                  >
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* BRANDS / COMPANY (Radio Button List instead of Select) */}
        <div>
          <h4 className="mb-3 font-bold uppercase text-xs tracking-widest text-gray-500">
            Brand
          </h4>
          {/* Scrollable list agar brands zyada ho jayein */}
          <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
            {BRANDS.map((c, index) => {
              const currentCompany = filters.company || "all";
              return (
                <label key={index} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="company"
                    value={c}
                    checked={currentCompany === c}
                    onChange={updateFilters}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 capitalize">
                    {c}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* PRICE SLIDER */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold uppercase text-xs tracking-widest text-gray-500">
              Price
            </h4>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
              {formatPrice(filters.price)}
            </span>
          </div>
          
          <input
            type="range"
            name="price"
            onChange={updateFilters}
            min={minPrice}
            max={maxPrice}
            value={filters.price}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2 font-semibold">
            <span>{formatPrice(minPrice)}</span>
            <span>{formatPrice(maxPrice)}</span>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Filters;