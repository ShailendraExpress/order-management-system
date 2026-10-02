<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
class ShiprocketService
{
    private $baseUrl = 'https://apiv2.shiprocket.in/v1/external';

    // 1. Token Generate Karna (Verified Credentials)
    public function getToken()
    {
        // Cache me check karein agar token pehle se hai
        if (Cache::has('shiprocket_token')) {
            return Cache::get('shiprocket_token');
        }

        // Direct credentials use kar rahe hain (No .env issues)
        $response = Http::post("{$this->baseUrl}/auth/login", [
            'email' => 'shailendrasinghcs0083@gmail.com',
            'password' => 'ca98#*gJ2tdR03R8$PKX$Bw59Tz2hZWt'
        ]);

        if ($response->successful()) {
            $token = $response->json()['token'];
            Cache::put('shiprocket_token', $token, now()->addDays(8));
            return $token;
        }

        throw new \Exception("Shiprocket Auth Failed: " . $response->body());
    }

public function createCustomOrder($orderData)
{
    $token = $this->getToken();

    $response = Http::withToken($token)
        ->post("{$this->baseUrl}/orders/create/adhoc", $orderData);

    Log::info('Shiprocket Debug', [
        'status' => $response->status(),
        'successful' => $response->successful(),
        'body' => $response->json()
    ]);

    Log::info('Shiprocket Response', [
        'status' => $response->status(),
        'body' => $response->body()
    ]);

    // ✅ Order create ho gaya to return karo
    if (isset($response->json()['order_id'])) {
        return $response->json();
    }

    // ❌ Sirf failure me exception throw karo
    throw new \Exception("Shiprocket Order Failed: " . $response->body());
}

}