<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // Database query ke liye zaroori
use App\Models\Shipment; 

class WebhookController extends Controller
{
    public function handleShiprocket(Request $request)
    {
        // 1. Token Check
        $expectedToken = 'test_token_123'; 
        $incomingToken = $request->header('x-api-key');

        if ($incomingToken !== $expectedToken) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // 2. Data Get Karein
        $payload = $request->all();
        Log::info('Shiprocket Webhook Received:', $payload);

        // 3. Database Update Logic
        // Shiprocket apne webhook mein dono bhejta hai: 'shipment_id' aur 'awb'
        $shiprocketShipmentId = $payload['shipment_id'] ?? null;
        $newStatus = $payload['current_status'] ?? null;

        if ($shiprocketShipmentId && $newStatus) {
            
            // Aapke DB ki 'shipments' table mein 'shipment_id' wale column se dhundhein
            $shipment = Shipment::where('shipment_id', $shiprocketShipmentId)->first();

            if ($shipment) {
                // Main Shipment table update karein
                $shipment->status = $newStatus;
                
                // Agar AWB aya hai aur aapka tracking_id khali hai, toh usko bhi update kar dein
                if(isset($payload['awb'])) {
                    $shipment->tracking_id = $payload['awb'];
                }
                $shipment->save();

                // 4. Tracking Logs table mein naya step add karein (Dashboard Timeline ke liye)
                DB::table('shipment_tracking_logs')->insert([
                    'shipment_id' => $shipment->id, // Aapke DB ka internal ID (e.g., 2)
                    'status' => $newStatus,
                    'location' => $payload['current_location_name'] ?? 'In Transit',
                    'message' => 'Status automatically updated via Shiprocket Webhook',
                    'scan_time' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::info("Shipment updated in both tables for Shiprocket ID: {$shiprocketShipmentId}");
            } else {
                Log::warning("Shiprocket Webhook: Shipment ID {$shiprocketShipmentId} aapke DB mein nahi mila.");
            }
        }

        return response()->json(['success' => true, 'message' => 'Webhook Processed Successfully'], 200);
    }
}