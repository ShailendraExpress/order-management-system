<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Image;
use App\Models\Product;
use App\Models\Thumbnail;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): \Illuminate\Http\JsonResponse
    {
        $products = Product::with('images')
            ->select('products.*', 'thumbnails.thumbnail')
            ->leftJoin('thumbnails', 'products.id', '=', 'thumbnails.product_id')
            ->orderBy('products.id', 'desc')
            ->get();

        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'description' => 'required|string',
            'price' => 'required',
            'stock' => 'required|integer|min:0',
            'category' => 'required|string',
            'brand' => 'required|string',
            'shipping' => 'boolean',
            'sku' => 'string|nullable',
        ]);

        $product = Product::create($fields);
        $id = $product->id;
        $baseUrl = env('APP_URL', 'http://localhost:8000') . '/storage/';

        if ($request->hasFile('thumbnail')) {
            $thumbnail = $request->file('thumbnail');
            $tnName = $id . '_thumbnail_' . time() . '.' . $thumbnail->extension();
            $path = $thumbnail->storeAs('uploads/products/' . $id, $tnName, 'public');

            Thumbnail::create([
                'product_id' => $id,
                'thumbnail' => $baseUrl . $path
            ]);
        }

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $imageName = $id . '_image_' . time() . rand(1, 1000) . '.' . $image->extension();
                $path = $image->storeAs('uploads/products/' . $id, $imageName, 'public');

                Image::create([
                    'product_id' => $id,
                    'image' => $baseUrl . $path
                ]);
            }
        }

        return response()->json(['message' => 'Product created successfully', 'product' => $product], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param $id
     * @return \Illuminate\Http\Response
     */
    public function getProduct($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response([
                'message' => 'No Product with the ID: ' . $id
            ], 401);
        }
        $product->images;
        return response($product, 200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param Request $request
     * @param $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json(['message' => 'Product not found'], 404);
            }

            // Update basic fields
            $product->name = $request->input('name', $product->name);
            $product->description = $request->input('description', $product->description);
            $product->price = $request->input('price', $product->price);
            $product->stock = $request->input('stock', $product->stock);
            $product->category = $request->input('category', $product->category);
            $product->brand = $request->input('brand', $product->brand);

            if ($request->has('shipping')) {
                $product->shipping = $request->input('shipping') ? 1 : 0;
            }

            $product->save();

            $baseUrl = env('APP_URL', 'http://localhost:8000') . '/storage/';

            // Thumbnail update logic
            if ($request->hasFile('thumbnail')) {
                $thumbnail = $request->file('thumbnail');
                $tnName = $id . '_thumbnail_' . time() . '.' . $thumbnail->extension();
                $path = $thumbnail->storeAs('uploads/products/' . $id, $tnName, 'public');

                Thumbnail::updateOrCreate(
                    ['product_id' => $id],
                    ['thumbnail' => $baseUrl . $path]
                );
            }

            return response()->json([
                'message' => 'Product updated successfully',
                'product' => $product
            ], 200);
        } catch (\Exception $e) {
            // Yeh line 500 error ka exact reason batayegi Laravel ke log mein
            \Log::error('Product Update Error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Server Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        $hasOrders = \DB::table('order_items')->where('product_id', $id)->exists();

        if ($hasOrders) {
            return response()->json([
                'status' => false,
                'message' => "Product '{$product->name}' cannot be deleted because it has already been ordered by a customer."
            ], 400);
        }

        $product->delete();

        return response()->json([
            'status' => true,
            'message' => 'Product has been successfully removed.'
        ]);
    }
}
