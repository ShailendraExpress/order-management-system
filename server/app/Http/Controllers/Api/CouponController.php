<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CouponController extends Controller
{
    // 1. Fetch all coupons (For Admin CouponManagement Page)
    public function index()
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => true,
            'data' => $coupons
        ], 200);
    }

    // 2. Create a new coupon (For Admin CreateCoupon Page)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:coupons,code',
            'discountType' => 'required|in:percentage,fixed',
            'discountValue' => 'required|numeric|min:0',
            'minOrderAmount' => 'nullable|numeric|min:0',
            'usageLimit' => 'nullable|integer|min:1',
            'expiryDate' => 'required|date|after_or_equal:today',
            'status' => 'required|in:Active,Draft'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        // Map React camelCase keys to Database snake_case columns
        $coupon = Coupon::create([
            'code' => strtoupper($request->code),
            'discount_type' => $request->discountType,
            'discount_value' => $request->discountValue,
            'min_order_amount' => $request->minOrderAmount,
            'usage_limit' => $request->usageLimit,
            'expiry_date' => $request->expiryDate,
            'status' => $request->status,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Coupon created successfully!',
            'data' => $coupon
        ], 201);
    }

    // 3. Apply/Validate Coupon (For Customer Cart Page)
    public function applyCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'cart_total' => 'required|numeric'
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon) {
            return response()->json(['status' => false, 'message' => 'Invalid coupon code.'], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json(['status' => false, 'message' => 'This coupon is expired or inactive.'], 400);
        }

        if ($coupon->min_order_amount && $request->cart_total < $coupon->min_order_amount) {
            return response()->json([
                'status' => false, 
                'message' => "Minimum order amount of ₹{$coupon->min_order_amount} required."
            ], 400);
        }

        return response()->json([
            'status' => true,
            'message' => 'Coupon applied successfully!',
            'data' => [
                'code' => $coupon->code,
                'discount_type' => $coupon->discount_type,
                'discount_value' => $coupon->discount_value
            ]
        ], 200);
    }

    public function destroy($id)
{
    $coupon = Coupon::find($id);

    if (!$coupon) {
        return response()->json(['status' => false, 'message' => 'Coupon not found'], 404);
    }

    $coupon->delete();

    return response()->json(['status' => true, 'message' => 'Coupon deleted successfully'], 200);
}

// Get single coupon for editing
    public function show($id)
    {
        $coupon = Coupon::find($id);
        
        if (!$coupon) {
            return response()->json(['status' => false, 'message' => 'Coupon not found'], 404);
        }

        return response()->json(['status' => true, 'data' => $coupon], 200);
    }

    // Update existing coupon
    public function update(Request $request, $id)
    {
        $coupon = Coupon::find($id);

        if (!$coupon) {
            return response()->json(['status' => false, 'message' => 'Coupon not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:coupons,code,' . $id, // Ignore current ID while checking unique
            'discountType' => 'required|in:percentage,fixed',
            'discountValue' => 'required|numeric|min:0',
            'minOrderAmount' => 'nullable|numeric|min:0',
            'usageLimit' => 'nullable|integer|min:1',
            'expiryDate' => 'required|date',
            'status' => 'required|in:Active,Draft,Expired'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'message' => $validator->errors()->first()], 422);
        }

        $coupon->update([
            'code' => strtoupper($request->code),
            'discount_type' => $request->discountType,
            'discount_value' => $request->discountValue,
            'min_order_amount' => $request->minOrderAmount,
            'usage_limit' => $request->usageLimit,
            'expiry_date' => $request->expiryDate,
            'status' => $request->status,
        ]);

        return response()->json(['status' => true, 'message' => 'Coupon updated successfully!', 'data' => $coupon], 200);
    }
}