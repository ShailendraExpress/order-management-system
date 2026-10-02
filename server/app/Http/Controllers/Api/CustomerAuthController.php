<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Google_Client; // Google package

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CustomerAuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Data Validation
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 2. Find Customer in the DB.
        $customer = Customer::where('email', $request->email)->first();

        // 3. Agar customer nahi mila ya password galat hai
        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ya Password galat hai.'
            ], 401);
        }

        // 4. Generate Token (This is the VIP pass of customer)
        $token = $customer->createToken('customer-app-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Customer Login Successful!',
            'customer' => $customer,
            'token' => $token
        ], 200);
    }


    // ==========================================
    // 1. GOOGLE LOGIN / SIGNUP
    // ==========================================
   public function googleLogin(Request $request)
{
    $request->validate(['token' => 'required']);

    try {
        $client = new \Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($request->token);

        if (!$payload) {
            return response()->json(['success' => false, 'message' => 'Google Token Verification Failed'], 401);
        }

        $customer = \App\Models\Customer::updateOrCreate(
            ['email' => $payload['email']],
            [
                'name' => $payload['name'],
                'google_id' => $payload['sub'],
                'password' => null
            ]
        );

        $token = $customer->createToken('customer-app-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'customer' => $customer
        ]);

    } catch (\Exception $e) {
        // Yahan se aapko exact error milega
        Log::error("Google Auth Error: " . $e->getMessage());
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

    // ==========================================
    // 2. SEND OTP (PHONE LOGIN)
    // ==========================================
    public function sendOtp(Request $request)
    {
        $request->validate(['phone' => 'required|numeric|digits:10']);

        // Generate 4 digit OTP
        $otp = rand(1000, 9999);

        // Cache me 5 minute ke liye OTP save karein
        Cache::put('otp_' . $request->phone, $otp, now()->addMinutes(5));

        // TODO: Yahan Twilio, Fast2SMS, ya Msg91 ka API code aayega SMS bhejne ke liye.
        // Abhi testing ke liye hum OTP ko Laravel log file me print kar rahe hain:
        Log::info("OTP for {$request->phone} is: {$otp}");

        return response()->json(['success' => true, 'message' => 'OTP sent successfully']);
    }

    // ==========================================
    // 3. VERIFY OTP & LOGIN/SIGNUP
    // ==========================================
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|numeric|digits:10',
            'otp' => 'required|numeric'
        ]);

        $cachedOtp = Cache::get('otp_' . $request->phone);

        if ($cachedOtp && $cachedOtp == $request->otp) {
            // OTP Sahi hai! Customer dhoondo ya naya banao
            $customer = \App\Models\Customer::firstOrCreate(
                ['phone' => $request->phone],
                ['name' => 'User_' . rand(1000,9999)] // Temporary name
            );

            // Cache se OTP hata do (security)
            Cache::forget('otp_' . $request->phone);

            $token = $customer->createToken('CustomerToken')->plainTextToken;
            return response()->json(['success' => true, 'token' => $token, 'customer' => $customer]);
        }

        return response()->json(['success' => false, 'message' => 'Invalid or expired OTP'], 400);
    }

public function register(Request $request)
{
    // Validation mein name include karein
    $request->validate([
        'name' => 'required|string|max:255', 
        'email' => 'required|email|unique:customers,email',
        'password' => 'required|min:6|confirmed',
    ]);

    // Customer create karte waqt name pass karein
    $customer = Customer::create([
        'name' => $request->name, 
        'email' => $request->email,
        'password' => Hash::make($request->password),
    ]);

    $token = $customer->createToken('customer_token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'customer' => $customer,
        'message' => 'Account created successfully'
    ], 201);
}
}