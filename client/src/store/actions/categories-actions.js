import api from "../../utils/api";
import { categoriesActions } from "../categories-slice";

export const fetchCategories = () => async (dispatch) => {
  try {
    // Laravel API se categories fetch karna
    const response = await api.get('/api/v1/categories');
    
    // Agar API response me { categories: [...] } aata hai ya direct [...] aata hai, dono handle ho jayenge
    const data = response.data.categories || response.data.data || [];
    
    // Redux store me save karna
    dispatch(categoriesActions.setCategories(data));
  } catch (error) {
    console.error("Categories fetch failed:", error);
  }
};