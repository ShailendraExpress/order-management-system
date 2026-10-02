<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    
  public function index(Request $request)
    {
        // 1. Sirf Query banayein (get() mat lagayen yahan)
        $query = Brand::withCount('products')->latest();
        
        // 2. Condition check karein
        if ($request->boolean('active')) {
            $query->where('is_active', 1);
        }

        // 3. Response bhejte waqt get() lagayen
        return response()->json([
            'status' => true,
            'data' => $query->get()
        ], 200);
    }
  
public function store(Request $request) 
{
    try {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:brands,title',
        ]);

        $validated['slug'] = Str::slug($request->title);
        $brand = Brand::create($validated);
        
        return response()->json(['message' => 'Brand created successfully', 'data' => $brand], 201);
    } catch (\Exception $e) {
        // Yeh line console mein batayegi ki error kya hai
        return response()->json(['error' => $e->getMessage()], 422);
    }
}

    
    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);
        
        $brand->update([
            'title' => $request->title ?? $brand->title,
            'is_active' => $request->is_active ?? $brand->is_active,
            'slug' => $request->title ? Str::slug($request->title) : $brand->slug
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Brand updated',
            'data' => $brand
        ], 200);
    }

    // DELETE
   public function destroy($id)
    {
        // 1. Brand dhoondo aur uske products count karo
        $brand = Brand::withCount('products')->findOrFail($id);

        // 2. Agar items 0 se zyada hain, toh error bhej do aur yahin ruk jao
        if ($brand->products_count > 0) {
            return response()->json([
                'status' => false,
                'message' => 'Cannot delete! This brand contains ' . $brand->products_count . ' items.'
            ], 400); // 400 status is very important
        }

        // 3. Agar items 0 hain, tabhi delete karo
        $brand->delete();

        return response()->json([
            'status' => true,
            'message' => 'Brand deleted successfully'
        ], 200);
    }
}