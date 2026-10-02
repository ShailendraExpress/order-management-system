// src/utils/helpers.js

export const formatPrice = (number) => {
    // Number ko proper format mein convert karna
    const num = Number(number) || 0;

    // Indian style mein commas lagana (e.g., 1,50,000.00)
    const formattedNumber = num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Manually ₹ sign add karke return karna
    return "₹" + formattedNumber;
};