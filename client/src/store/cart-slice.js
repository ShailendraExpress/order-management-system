import { createSlice } from '@reduxjs/toolkit';

// 1. Safely retrieve the cart from Local Storage on initial load
const getLocalStorage = () => {
    try {
        const cart = localStorage.getItem('cart');
        if (cart) {
            const parsedCart = JSON.parse(cart);
            // Added safe fallback for new properties so old cart data doesn't break
            return {
                items: parsedCart.items || [],
                totalQuantity: parsedCart.totalQuantity || 0,
                totalPrice: parsedCart.totalPrice || 0,
                discountPercent: parsedCart.discountPercent || 0,  // Naya State
                appliedCoupon: parsedCart.appliedCoupon || ''      // Naya State
            };
        }
    } catch (error) {
        console.error("Error reading cart from localStorage", error);
    }
    
    // Default state if nothing is in local storage
    return {
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
        discountPercent: 0, // Naya State
        appliedCoupon: ''   // Naya State
    };
};

const initialState = getLocalStorage();

// 2. Helper function to keep Local Storage in sync with our Redux state
const saveToLocalStorage = (state) => {
    localStorage.setItem('cart', JSON.stringify(state));
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        
        // Add completely new item or add multiple quantities from Product Detail page
        addItemsToCart(state, action) {
            const newItem = action.payload;
            const existingItem = state.items.find((item) => item.id === newItem.id);
            
            // Ensure data types are strictly numbers to prevent calculation bugs
            const price = Number(newItem.price);
            const quantity = Number(newItem.quantity) || 1;
            const totalPrice = price * quantity;

            if (!existingItem) {
                state.items.push({
                    ...newItem,
                    price,
                    quantity,
                    totalPrice
                });
            } else {
                existingItem.quantity += quantity;
                existingItem.totalPrice += totalPrice;
            }
            
            state.totalPrice += totalPrice;
            state.totalQuantity += quantity;
            
            saveToLocalStorage(state);
        },

        // Increment single item quantity (+ button in Cart)
        addItemToCart(state, action) {
            const id = action.payload;
            const existingItem = state.items.find((item) => item.id === id);
            
            if (existingItem) {
                existingItem.quantity++;
                existingItem.totalPrice += existingItem.price;
                
                state.totalPrice += existingItem.price;
                state.totalQuantity++;
                
                saveToLocalStorage(state);
            }
        },

        // Decrement single item quantity or remove completely (- button in Cart)
        removeItemFromCart(state, action) {
            const id = action.payload;
            const existingItem = state.items.find((item) => item.id === id);
            
            if (existingItem) {
                if (existingItem.quantity === 1) {
                    state.items = state.items.filter((item) => item.id !== id);
                } else {
                    existingItem.quantity--;
                    existingItem.totalPrice -= existingItem.price;
                }
                
                state.totalPrice -= existingItem.price;
                state.totalQuantity--;
                
                saveToLocalStorage(state);
            }
        },

        // Empty the entire cart (After checkout or pressing "Clear Cart")
        clearCart(state) {
            state.items = [];
            state.totalQuantity = 0;
            state.totalPrice = 0;
            state.discountPercent = 0; // Checkout ke baad coupon hata do
            state.appliedCoupon = '';  // Checkout ke baad coupon hata do
            
            saveToLocalStorage(state);
        },

        // --- NEW COUPON REDUCERS ---
        applyDiscount(state, action) {
            state.discountPercent = action.payload.percent;
            state.appliedCoupon = action.payload.code;
            
            saveToLocalStorage(state); // Sync to local storage
        },
        
        removeDiscount(state) {
            state.discountPercent = 0;
            state.appliedCoupon = '';
            
            saveToLocalStorage(state); // Sync to local storage
        }
    }
});

// Export all actions including the new coupon ones
export const cartActions = cartSlice.actions;

export default cartSlice;