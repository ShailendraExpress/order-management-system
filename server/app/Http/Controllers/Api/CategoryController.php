<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    // 1. GET ALL CATEGORIES 
   public function index(Request $request)
{

    $query = Category::withCount('products')->latest();

   
    if ($request->boolean('active')) {
        $query->where('is_active', 1);
    }

  
    $categories = $query->get();

    return response()->json([
        'status' => true,
        'message' => 'Categories fetched successfully.',
        'data' => $categories
    ], 200);
}

    // 2. CREATE NEW CATEGORY 
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $category = Category::create([
            'title' => $request->title,
            
            'slug' => $request->slug ? Str::slug($request->slug) : Str::slug($request->title),
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Category created successfully!',
            'data' => $category
        ], 201);
    }

    // 3. GET SINGLE CATEGORY (React me Edit Form load karne ke liye)
    public function show(Category $category)
    {
        return response()->json([
            'status' => true,
            'data' => $category
        ], 200);
    }

    // 4. UPDATE CATEGORY 
    public function update(Request $request, Category $category)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $category->update([
            'title' => $request->title,
            'slug' => Str::slug($request->slug),
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Category updated successfully!',
            'data' => $category
        ], 200);
    }

    // 5. DELETE CATEGORY 
   public function destroy(Category $category)
{
    // CHECK: Agar category ke andar products hain, toh delete mat karo
    if ($category->products()->count() > 0) {
        return response()->json([
            'status' => false,
            'message' => 'Cannot delete! This category contains products.'
        ], 400); // 400 error status frontend ke 'catch' block mein jayega
    }

    $category->delete();

    return response()->json([
        'status' => true,
        'message' => 'Category deleted successfully!'
    ], 200);
}
}