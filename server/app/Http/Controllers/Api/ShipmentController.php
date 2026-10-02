<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\ShipmentTrackingLog;
use App\Services\ShiprocketService;

class ShipmentController extends Controller
{
    /**
     * Create a new shipment and sync it with Shiprocket.
     *
     * @param Request $request
     * @param ShiprocketService $shiprocket
     * @return \Illuminate\Http\JsonResponse
     */
    public function createShipment(Request $request, ShiprocketService $shiprocket)
    {
        Log::info('Shipment Request Data Initialized:', $request->all());
        
        $request->validate([
            'orderId' => 'required|string',
            'carrier' => 'required|string',
            'weight'  => 'required|numeric'
        ]);

        try {
            // 1. Verify the associated order (including customer details)
            $order = Order::with('customer')->where('order_number', $request->orderId)->first();

            if (!$order) {
                return response()->json(['success' => false, 'message' => "Order not found."], 404);
            }

            // 2. Prepare the payload for Shiprocket
            // @TODO: Replace hardcoded fallback values (e.g., billing details, product specs) with dynamic data from $order
            $shiprocketOrderData = [
                "order_id"              => (string)("ORD-" . time()),
                "order_date"            => now()->format('Y-m-d H:i'),
                "pickup_location"       => "Home",
                "source"                => "Manual", 
                "order_type"            => "1",
                "billing_customer_name" => $order->customer->name ?? "Test",
                "billing_last_name"     => "User",
                "billing_address"       => "Sector 22, Gurgaon",
                "billing_city"          => "Gurugram",
                "billing_pincode"       => "122022",
                "billing_state"         => "Haryana",
                "billing_country"       => "India",
                "billing_email"         => $order->customer->email ?? "test@example.com",
                "billing_phone"         => $order->customer->phone ?? "9876543210",
                "shipping_is_billing"   => true,
                "order_items"           => [
                    [
                        "name"          => "Product",
                        "sku"           => "PROD1",
                        "units"         => 1,
                        "selling_price" => "100"
                    ]
                ],
                "payment_method"        => "Prepaid",
                "sub_total"             => 100,
                "length"                => 10,
                "breadth"               => 10,
                "height"                => 10,
                "weight"                => (float) $request->weight
            ];

            // 3. Dispatch the request to Shiprocket Service
            Log::info("Dispatching Payload to Shiprocket:", $shiprocketOrderData);
            $shiprocketResponse = $shiprocket->createCustomOrder($shiprocketOrderData);

            // 4. Wrap database operations in a transaction to ensure atomicity
            DB::beginTransaction();

            // Extract AWB and Shipment ID from the response or fallback to request
            $trackingId = $shiprocketResponse['awb_code'] ?? $request->trackingId;
            $shipmentId = $shiprocketResponse['shipment_id'] ?? null;

            // Persist the shipment record
            $shipment = Shipment::create([
                'order_id'    => $order->id,
                'carrier'     => 'Shiprocket',
                'tracking_id' => $trackingId,
                'shipment_id' => $shipmentId,
                'weight'      => $request->weight,
                'dimensions'  => $request->dimensions,
                'notes'       => $request->notes,
                'status'      => 'Packed & Ready'
            ]);

            // Update associated order status
            $order->status = 'shipped';
            $order->save();

            // Generate the initial tracking log
            ShipmentTrackingLog::create([
                'shipment_id' => $shipment->id,
                'status'      => 'Packed & Ready',
                'location'    => 'Your Warehouse',
                'message'     => 'Shipment processed via Shiprocket. AWB Generated.',
                'scan_time'   => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Shipment successfully synchronized with Shiprocket.',
                'data'    => $shipment
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Shipment Creation Failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to process shipment. ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Retrieve a paginated or complete list of shipments.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            // Eager load order and customer details for comprehensive listing
            $shipments = Shipment::with('order.customer')->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data'    => $shipments
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch shipments list: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching shipments.'
            ], 500);
        }
    }

    /**
     * Retrieve comprehensive details for a specific shipment.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            // Eager load related order, customer, and sequentially ordered tracking logs
            $shipment = Shipment::with(['order.customer', 'logs' => function ($query) {
                $query->orderBy('created_at', 'desc'); 
            }])->find($id);

            if (!$shipment) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Requested shipment record could not be found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data'    => $shipment
            ], 200);

        } catch (\Exception $e) {
            Log::error("Failed to fetch details for Shipment ID [{$id}]: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving shipment details.'
            ], 500);
        }
    }
}