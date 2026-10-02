import axios from 'axios';

import { productsActions } from '../products-slice';
import { uiActions } from '../ui-slice';
import api from '../../utils/api';
import swal from 'sweetalert';

export const getProducts = () => {
    return async dispatch => {
        dispatch(uiActions.productsLoading());
        const fetchData = async () => {
            const response = await axios.get('http://localhost:8000/api/products');

            const data = await response.data;
            return data;
        };

        try {
            const response = await axios.get('http://localhost:8000/src/client.php');
            const products = await fetchData();
            dispatch(productsActions.replaceProducts(products));
            dispatch(uiActions.productsLoading());
            
            
        } catch (error) {
            console.log('failed to fetch products');
        }
    }
};


export const getProductDetails = (id) => {
    return async dispatch => {
        dispatch(uiActions.pDetailLoading());
        const fetchData = async () => {
            const response = await axios.get(`http://localhost:8000/api/products/${id}`);

            const data = await response.data;
            return data;
        };

        try {
            const productDetails = await fetchData();
            dispatch(productsActions.setProductDetails(productDetails));
            dispatch(uiActions.pDetailLoading());
        } catch (error) {
            console.log('failed to fetch product details');
        }
    }

};


export const addProduct = ({ product, token }) => {
    return async dispatch => {
        try {
            dispatch(uiActions.addPrductLoading());
            
            // Get CSRF cookie first (if required by Sanctum)
            await api.get('/sanctum/csrf-cookie');
            
            const response = await api.post('/api/v1/products', product, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: 'Bearer ' + token,
                },
            });

            const data = response.data;
            console.log('Product added successfully:', data);
            
            // Refresh product list in Redux
            dispatch(getProducts());
            
            return data; // Return data so the component knows it succeeded
            
        } catch (error) {
            console.error('Error adding product:', error);
            throw error; // Throw error so Formik/Component catches it and doesn't show fake success
        } finally {
            // Ensure loading spinner always stops, whether success or error
            dispatch(uiActions.addPrductLoading());
        }
    };
};




export const updateProduct = ({ product, id, token }) => {
    return async dispatch => {
        try {
            await api.get('/sanctum/csrf-cookie');
            

            const response = await api.post(`/api/v1/products/${id}`, product, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: 'Bearer ' + token,
                },
            });

            console.log('Updated successfully:', response.data);
            dispatch(getProducts()); 
            return response.data;
        } catch (error) {
            console.error('Update action error:', error.response?.data || error.message);
            throw error;
        }
    };
};




// DELETE PRODUCT ACTION WITH CLEAN ERROR HANDLING
export const deleteProduct = (id, token) => async (dispatch) => {
  try {
    // 1. Send secure API request to delete the product
    await api.delete(`/api/v1/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 2. Immediately fetch the fresh product list to update Redux state
    dispatch(getProducts()); 
    
    // 3. Show success SweetAlert notification when deletion succeeds
    swal("Deleted!", "The product has been permanently removed.", "success");
    
  } catch (error) {
    // Check if it's a 400 Bad Request (Product linked to customer orders)
    if (error.response && error.response.status === 400) {
      const errorMsg = error.response.data.message || "This product cannot be deleted.";
      // Show warning SweetAlert nicely without printing ugly red console errors
      swal("Cannot Delete!", errorMsg, "warning");
    } else {
      // For any other unexpected server errors
      console.error("Unexpected error deleting product:", error);
      const errorMsg = error.response?.data?.message || "An error occurred while deleting the product.";
      swal("Error!", errorMsg, "error");
    }
  }
};










