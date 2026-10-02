<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;

class ReviewController extends Controller
{
   public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id'   => 'required|exists:orders,id',
            'rating'     => 'required|integer|min:1|max:5',
            'headline'   => 'nullable|string|max:255',
            'comment'    => 'nullable|string',
        ]);

        $customerId = auth()->id();

        // 👇 YAHAN CHANGE KIYA HAI: Naya banayega ya purana update karega
        $review = Review::updateOrCreate(
            [
                'customer_id' => $customerId,
                'product_id'  => $request->product_id,
                'order_id'    => $request->order_id,
            ],
            [
                'rating'   => $request->rating,
                'headline' => $request->headline,
                'comment'  => $request->comment,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Your review has been saved successfully!',
            'data'    => $review
        ], 200); // 200 status code for success
    

        // 3. Create the Review
        $review = Review::create([
            'customer_id' => $customerId,
            'product_id'  => $request->product_id,
            'order_id'    => $request->order_id,
            'rating'      => $request->rating,
            'headline'    => $request->headline,
            'comment'     => $request->comment,
        ]);

        // 4. Return success response to React
        return response()->json([
            'success' => true,
            'message' => 'Your review has been submitted successfully!',
            'data'    => $review
        ], 201);
    }

    // ==========================================
    // ADMIN: FETCH ALL REVIEWS
    // ==========================================
    public function getAllReviews()
    {
        try {
            // Reviews fetch karein, customer aur product table se detail ke sath
            $reviews = \App\Models\Review::with(['customer', 'product'])
                        ->orderBy('created_at', 'desc')
                        ->get();

            return response()->json([
                'success' => true,
                'data' => $reviews
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reviews: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // ADMIN: DELETE REVIEW
    // ==========================================
    public function destroy($id)
    {
        try {
            $review = \App\Models\Review::find($id);
            if (!$review) {
                return response()->json(['success' => false, 'message' => 'Review not found'], 404);
            }
            
            $review->delete();
            return response()->json(['success' => true, 'message' => 'Review deleted successfully'], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete review'], 500);
        }
    }
}