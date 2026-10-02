<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\AdminNotification;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
  public function placeOrder(Request $request)
{
    $request->validate([
        'total_price' => 'required|numeric',
        'payment_method' => 'required|string',
        'items' => 'required|array', 
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.quantity' => 'required|integer|min:1',
        'items.*.price' => 'required|numeric',
    ]);

    try {
        DB::beginTransaction();

        $customerId = $request->user()->id; 

        // 1. Razorpay ID nikalna (Agar online order hai)
        $razorpayId = null;
        if ($request->has('payment_details') && isset($request->payment_details['razorpay_payment_id'])) {
            $razorpayId = $request->payment_details['razorpay_payment_id'];
        }

        // 2. Logic: Agar COD hai toh 'unpaid', agar Online hai toh 'success'
        $isOnline = ($request->payment_method === 'online'); 
        
        $order = Order::create([
            'customer_id' => $customerId,
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'total_price' => $request->total_price,
            'payment_method' => $request->payment_method,
            'status' => 'pending',
            'payment_status' => $isOnline ? 'success' : 'unpaid', // Yahan badlav kiya
            'transaction_id' => $razorpayId, // Yahan ID save hogi
        ]);

        foreach ($request->items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
            ]);
        }

        DB::commit();

        try {
            AdminNotification::create([
                'type' => 'new_order',
                'title' => 'New Order Received',
                'message' => 'New order ' . $order->order_number . ' has been placed.',
                'url' => '/admin/orders',
                'data' => ['order_id' => $order->id, 'order_number' => $order->order_number],
            ]);

            if ($isOnline) {
                AdminNotification::create([
                    'type' => 'payment_success',
                    'title' => 'Payment Successful',
                    'message' => 'Payment received for order ' . $order->order_number . '.',
                    'url' => '/admin/orders',
                    'data' => ['order_id' => $order->id, 'order_number' => $order->order_number],
                ]);
            }
        } catch (\Throwable $notificationError) {
            Log::warning('Admin order notification failed: ' . $notificationError->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Order successfully placed!',
            'order_number' => $order->order_number
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Something went wrong!!',
            'error' => $e->getMessage()
        ], 500);
    }
}

    // 👇 YEH NAYA FUNCTION HAI (Dashboard par orders bhejne ke liye) 👇
    public function index()
    {
        try {
            // Saare orders fetch karein, latest wale sabse upar, aur customer details ke sath
            $orders = Order::with('customer')->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $orders
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Orders fetch karne mein error aayi!',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    // OrderController.php

// 1. ORDER DETAILS ke liye (ID use karega)
public function showOrder($id)
{
    try {
        $order = Order::with(['customer', 'items.product'])
                      ->where('id', $id)
                      ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $order], 200);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// 2. TRANSACTION DETAILS ke liye (Order Number use karega)
public function getTransactionByOrderNumber($orderNumber)
{
    try {
        $order = Order::with(['customer'])
                      ->where('order_number', $orderNumber)
                      ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $order], 200);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

public function show($orderNumber) // $id ki jagah $orderNumber
{
    try {
        // Query mein bhi $orderNumber use karein
        $order = Order::with(['customer', 'items.product'])
                      ->where('order_number', $orderNumber) 
                      ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $order], 200);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

    // 2. Update Order Status
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
           'status' => 'required|string|in:pending,processing,shipped,out_for_delivery,delivered,cancelled'
        ]);

        try {
            $order = Order::where('id', $id)->orWhere('order_number', $id)->first();

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found'], 404);
            }

            $order->status = $request->status;
            $order->save();

            return response()->json([
                'success' => true, 
                'message' => 'Order status updated successfully!',
                'data' => $order
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function myOrders(Request $request)
    {
        try {
            $customerId = $request->user()->id; 

            // YAHAN CHECK KAREIN: kya where condition lagi hai?
            $orders = Order::with('items.product')
                        ->where('customer_id', $customerId) 
                        ->orderBy('created_at', 'desc')
                        ->get();

            return response()->json([
                'success' => true,
                'data' => $orders
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

   // Customer ke ek single order ki details fetch 
   // Customer ke ek single order ki details fetch 
    public function myOrderDetails(Request $request, $id)
    {
        try {
            // 1. Logged-in customer ki ID nikalna
            $customerId = $request->user()->id;

            // 👇 YAHAN CHANGE KIYA HAI: 'items.review' ko with() se hata diya hai
            $order = Order::with(['items.product', 'items.returnRequest', 'customer']) 
                        ->where('customer_id', $customerId)
                        ->where('id', $id)
                        ->first();

            // 2. Agar order database mein nahi hai
            if (!$order) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Order not found or unauthorized access.'
                ], 404);
            }

            // 👇 YEH NAYA LOGIC HAI: Is Order ke saare reviews ek sath fetch karein
            $reviews = \App\Models\Review::where('order_id', $order->id)->get();

            // Har Order Item ke sath uska specific review attach karein
            foreach ($order->items as $item) {
                // Product ID match karke review ko item object mein daal dein
                $item->review = $reviews->where('product_id', $item->product_id)->first();
            }

            // 3. Success response bhejna
            return response()->json([
                'success' => true,
                'data' => $order
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Something went wrong: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // ORDER RETURN SYSTEM
    // ==========================================

    public function requestReturn(Request $request)
    {
        // 1. Validate the incoming FormData
        $request->validate([
            'order_id' => 'required|integer',
            'item_id' => 'required|integer',
            'product_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'action' => 'required|string', // refund or replacement
            'reason' => 'required|string',
            'comment' => 'nullable|string',
            'images' => 'nullable|array|max:3', // Max 3 images
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048' // Each image max 2MB
        ]);

        $customer = $request->user('customer');

        // 2. Handle Image Uploads
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                // Save images inside 'storage/app/public/returns' directory
                $path = $image->store('returns', 'public');
                $imagePaths[] = $path;
            }
        }

        // 3. Create the Return Request in Database
        $returnRequest = \App\Models\ReturnRequest::create([
            'order_id' => $request->order_id,
            'item_id' => $request->item_id,
            'product_id' => $request->product_id,
            'customer_id' => $customer->id,
            'quantity' => $request->quantity,
            'action' => $request->action,
            'reason' => $request->reason,
            'comment' => $request->comment,
            'images' => $imagePaths, // Saved as JSON automatically
            'status' => 'pending'
        ]);

        // Optional: If you have a 'return_status' column in your order_items table, 
        // you can update it here so the customer sees "PENDING" on the frontend item list.
        /*
        \DB::table('order_items')->where('id', $request->item_id)->update([
            'return_status' => 'pending'
        ]);
        */

        try {
            \App\Models\AdminNotification::create([
                'type' => 'return_request',
                'title' => 'New Return Request',
                'message' => 'A return request has been submitted for order #' . $returnRequest->order_id . '.',
                'url' => '/admin/returns',
                'data' => ['return_request_id' => $returnRequest->id, 'order_id' => $returnRequest->order_id],
            ]);
        } catch (\Throwable $notificationError) {
            Log::warning('Admin return notification failed: ' . $notificationError->getMessage());
        }

return response()->json([
            'success' => true,
            'message' => 'Return request submitted successfully.',
            'data' => $returnRequest
        ], 201);
    }


    // ==========================================
    // ADMIN: FETCH ALL RETURN REQUESTS
    // ==========================================
    public function getAllReturns()
    {
        try {
            // Fetch all returns with customer and product details, newest first
            $returns = \App\Models\ReturnRequest::with(['customer', 'product'])
                        ->orderBy('created_at', 'desc')
                        ->get();

            return response()->json([
                'success' => true,
                'data' => $returns
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Failed to fetch returns: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // ADMIN: FETCH SINGLE RETURN DETAILS
    // ==========================================
    public function getReturnDetails($id)
    {
        try {
            // Return request ke sath product, customer aur order item ki detail nikalna
            $returnDetail = \App\Models\ReturnRequest::with(['customer', 'product', 'orderItem'])
                            ->where('id', $id)
                            ->first();

            if (!$returnDetail) {
                return response()->json([
                    'success' => false,
                    'message' => 'RMA Data not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $returnDetail
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch details: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // ADMIN: APPROVE OR REJECT RETURN REQUEST
    // ==========================================

  public function updateReturnStatus(Request $request, $id)
{
    $request->validate([
        'status' => 'required|in:pending,approved,rejected,refunded,replaced',
        'admin_note' => 'nullable|string',
        'customer_message' => 'nullable|string' // Naya field validation
    ]);

    try {
        $returnDetail = \App\Models\ReturnRequest::find($id);

        if (!$returnDetail) {
            return response()->json(['success' => false, 'message' => 'RMA Data not found'], 404);
        }

        $returnDetail->status = $request->status;
        $returnDetail->admin_note = $request->admin_note; 
        $returnDetail->customer_message = $request->customer_message; // Customer msg save
        $returnDetail->save();

        DB::table('order_items')->where('id', $returnDetail->item_id)->update([
            'return_status' => $request->status 
        ]);

        return response()->json([
            'success' => true,
            'message' => 'RMA Status updated successfully',
            'data' => $returnDetail
        ], 200);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

    // ==========================================
    // CUSTOMER: CANCEL ORDER
    // ==========================================
    public function cancelMyOrder(Request $request, $id)
    {
        try {
            $customerId = $request->user()->id;
            
            // Check if order belongs to this customer
            $order = \App\Models\Order::where('customer_id', $customerId)->where('id', $id)->first();

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found or unauthorized.'], 404);
            }
            

            if (!in_array(strtolower($order->status), ['pending', 'processing'])) {
        return response()->json([
            'success' => false, 
            'message' => 'This order cannot be cancelled as it is already ' . $order->status . '.'
        ], 400);
    }

            // Update status to cancelled
            $order->status = 'cancelled';
            $order->save();

            return response()->json([
                'success' => true, 
                'message' => 'Order cancelled successfully.',
                'data' => $order
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

  

public function getTransactions() {
    try {
        // orders table se saara data uthayein
        $orders = Order::with('customer')
                    ->latest()
                    ->get();

        $transactions = $orders->map(function($order) {
            return [
                // AGAR DB MEIN COLUMN 'transaction_id' HAI TO YE USE KAREIN
                'id' => $order->transaction_id ?? 'N/A', 
                
                'orderId' => $order->order_number,
                'customer' => $order->customer ? $order->customer->name : 'Guest',
                'method' => $order->payment_method,
                'amount' => $order->total_price,
                
                // Status yahan se aayega
                'status' => $order->payment_status ?? 'unpaid', 
                
                'date' => $order->created_at->format('Y-m-d')
            ];
        });

        return response()->json(['status' => true, 'data' => $transactions]);
        
    } catch (\Exception $e) {
        return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
    }
}
}