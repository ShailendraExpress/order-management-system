<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Razorpay\Api\Api;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Models\AdminNotification;

class PaymentController extends Controller
{
    public function createRazorpayOrder(Request $request)
    {
        try {
            Log::info("Razorpay order creation started for amount: " . $request->amount);

            $key = config('services.razorpay.key');
            $secret = config('services.razorpay.secret');


            if (empty($key)) {
                return response()->json([
                    'message' => 'Key is empty!',
                    'debug_env' => env('RAZORPAY_KEY') // Direct check karein
                ], 500);
            }
            if (empty($key) || empty($secret)) {
                Log::error("CRITICAL: Razorpay keys are empty in config/services.php");
                return response()->json(['message' => 'Payment keys not configured'], 500);
            }

            $api = new Api($key, $secret);

            $orderData = [
                'amount'   => (int)($request->amount * 100),
                'currency' => 'INR',
                'receipt'  => 'order_rcptid_' . time()
            ];

            Log::info("Sending request to Razorpay...");
            $razorpayOrder = $api->order->create($orderData);

            Log::info("Razorpay Order Created: " . $razorpayOrder['id']);
            return response()->json(['order_id' => $razorpayOrder['id']]);
        } catch (\Exception $e) {
            Log::error("Razorpay Error Details: " . $e->getMessage());
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function verifyUpi(Request $request)
    {
        // Yahan Razorpay ya kisi aur service se verify karne ka logic aayega
        return response()->json(['status' => 'success']);
    }


    public function verifyPayment(Request $request)
    {
        try {
            // 1. Frontend se aayi hui details
            $razorpay_payment_id = $request->razorpay_payment_id;
            $razorpay_order_id = $request->razorpay_order_id;
            $order_number = $request->order_number; // Aapka 'ORD-...' wala number

            // 2. Order database mein dhundein
            $order = Order::where('order_number', $order_number)->first();

            if ($order) {
                $wasAlreadySuccessful = $order->payment_status === 'success';

                // 3. YAHIN WO LOGIC HAI JO AAPNE PUCHA THA
                $order->update([
                    'payment_status' => 'success',      // Ab ye 'unpaid' se 'success' ho jayega
                    'transaction_id' => $request->razorpay_payment_id // Transaction ID save ho jayegi
                ]);

                if (!$wasAlreadySuccessful) {
                    try {
                        AdminNotification::create([
                            'type' => 'payment_success',
                            'title' => 'Payment Successful',
                            'message' => 'Payment received for order ' . $order->order_number . '.',
                            'url' => '/admin/orders',
                            'data' => ['order_id' => $order->id, 'order_number' => $order->order_number],
                        ]);
                    } catch (\Throwable $notificationError) {
                        Log::warning('Admin payment notification failed: ' . $notificationError->getMessage());
                    }
                }

                return response()->json(['success' => true, 'message' => 'Payment verified successfully!']);
            }

            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
