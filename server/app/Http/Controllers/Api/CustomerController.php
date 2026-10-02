<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    // 1. GET ALL CUSTOMERS (With Orders Count for Dashboard List)
    public function index()
    {
        try {
            // Eager load order count so frontend gets accurate data
            $customers = Customer::withCount('orders')->latest()->get();

            return response()->json([
                'status' => true,
                'message' => 'Customers list fetched successfully.',
                'data' => $customers
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch customers: ' . $e->getMessage()
            ], 500);
        }
    }

    // 2. CREATE NEW CUSTOMER (POST)
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:customers,email',
                'phone' => 'required|string|max:15',
                'password' => 'required|string|min:6',
                'gender' => 'nullable|string',
                'dob' => 'nullable|date',
                'customer_group' => 'nullable|string',
                'address_line1' => 'nullable|string',
                'address_line2' => 'nullable|string',
                'city' => 'nullable|string',
                'state' => 'nullable|string',
                'pincode' => 'nullable|string',
                'country' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'email_verified' => 'nullable|boolean',
                'newsletter' => 'nullable|boolean',
            ]);

            // Securely Hash the assigned password before saving
            $validatedData['password'] = Hash::make($request->password);
            
            // Set defaults if null
            $validatedData['customer_group'] = $validatedData['customer_group'] ?? 'Regular';
            $validatedData['is_active'] = $request->has('is_active') ? $request->is_active : 1;

            $customer = Customer::create($validatedData);

            return response()->json([
                'status' => true,
                'message' => 'Customer profile registered successfully!',
                'data' => $customer
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    // 3. SHOW SINGLE CUSTOMER DETAILS (For Edit Pre-fill)
    public function show($id)
    {
        $customer = Customer::with('orders')->find($id);

        if (!$customer) {
            return response()->json([
                'status' => false,
                'message' => 'Customer not found.'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $customer
        ], 200);
    }

    // 4. UPDATE CUSTOMER PROFILE (PUT/PATCH)
    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'status' => false,
                'message' => 'Customer not found.'
            ], 404);
        }

        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:customers,email,' . $id,
                'phone' => 'required|string|max:15',
                'password' => 'nullable|string|min:6',
                'gender' => 'nullable|string',
                'dob' => 'nullable|date',
                'customer_group' => 'nullable|string',
                'address_line1' => 'nullable|string',
                'address_line2' => 'nullable|string',
                'city' => 'nullable|string',
                'state' => 'nullable|string',
                'pincode' => 'nullable|string',
                'country' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'email_verified' => 'nullable|boolean',
                'newsletter' => 'nullable|boolean',
            ]);

            // Handle password update securely
            if ($request->filled('password')) {
                $validatedData['password'] = Hash::make($request->password);
            } else {
                unset($validatedData['password']);
            }

            $customer->update($validatedData);

            return response()->json([
                'status' => true,
                'message' => 'Customer profile updated successfully.',
                'data' => $customer
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    // 5. DELETE CUSTOMER PROFILE
    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'status' => false,
                'message' => 'Customer not found.'
            ], 404);
        }

        // Security Check: Active orders check
        if (method_exists($customer, 'orders') && $customer->orders()->count() > 0) {
            return response()->json([
                'status' => false,
                'message' => 'Cannot delete customer! Active orders are associated with this profile.'
            ], 400);
        }

        $customer->delete();

        return response()->json([
            'status' => true,
            'message' => 'Customer profile deleted successfully.'
        ], 200);
    }

    // ==========================================
    // CUSTOMER AUTHENTICATION & PROFILE METHODS
    // ==========================================

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $customer = Customer::where('email', $request->email)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid email or password.'
            ], 401);
        }

        $token = $customer->createToken('customer_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login successful',
            'token' => $token,
            'customer' => $customer
        ], 200);
    }

    public function getCustomerProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user('customer') 
        ], 200);
    }

    public function updateCustomerProfile(Request $request)
    {
        $user = $request->user('customer') ?? $request->user();
        
        if(!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:customers,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
        ]);

        return response()->json(['success' => true, 'message' => 'Profile updated', 'data' => $user], 200);
    }

    // ==========================================
    // ADDRESS BOOK MANAGEMENT
    // ==========================================

    public function getCustomerAddresses(Request $request)
    {
        $user = $request->user('customer') ?? $request->user();
        $addresses = Address::where('customer_id', $user->id)->get();
        return response()->json(['success' => true, 'data' => $addresses], 200);
    }

    public function addCustomerAddress(Request $request)
    {
        $user = $request->user('customer') ?? $request->user();
        
        $request->validate([
            'address_line' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'pincode' => 'required|string',
            'type' => 'required|string',
        ]);

        $address = Address::create([
            'customer_id' => $user->id,
            'address_line' => $request->address_line,
            'city' => $request->city,
            'state' => $request->state,
            'pincode' => $request->pincode,
            'type' => $request->type,
        ]);

        return response()->json(['success' => true, 'data' => $address], 201);
    }

    public function updateCustomerAddress(Request $request, $id)
    {
        $user = $request->user('customer') ?? $request->user();
        $address = Address::where('id', $id)->where('customer_id', $user->id)->first();

        if (!$address) {
            return response()->json(['success' => false, 'message' => 'Address not found'], 404);
        }

        $address->update($request->only('address_line', 'city', 'state', 'pincode', 'type'));

        return response()->json(['success' => true, 'data' => $address], 200);
    }

    public function deleteCustomerAddress(Request $request, $id)
    {
        $user = $request->user('customer') ?? $request->user();
        $address = Address::where('id', $id)->where('customer_id', $user->id)->first();

        if ($address) {
            $address->delete();
        }

        return response()->json(['success' => true, 'message' => 'Address deleted'], 200);
    }

    // ==========================================
    // ACCOUNT SECURITY (CHANGE PASSWORD)
    // ==========================================
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed', 
        ]);

        $user = $request->user('customer') ?? $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Your current password does not match our records.'
            ], 400); 
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Password updated successfully.'
        ], 200);
    }
}