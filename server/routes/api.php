<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use App\Services\ShiprocketService;

// Import Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ApiRequestController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\SalesAnalyticsController;
use App\Http\Controllers\Api\RevenueReportsController;
use App\Http\Controllers\Api\StaffUserController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\RefundController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\AdminNotificationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// User Identity Route (Secured with Sanctum)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// ========================================================================
// 1. PUBLIC ROUTES (No Authentication Required - Accessible to everyone)
// ========================================================================
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'getProduct']);
Route::get('/payment-config', function () {
    return response()->json(['key' => config('services.razorpay.key')]);
});

// Authentication & Registration Routes
Route::post('/login', [AuthController::class, 'login']); // Admin/Staff Login
Route::post('/register', [AuthController::class, 'register']); // Admin/Staff Register

Route::post('/customer/login', [CustomerAuthController::class, 'login']);
Route::post('/customer/register', [CustomerAuthController::class, 'register']);
Route::post('/customer/auth/google', [CustomerAuthController::class, 'googleLogin']);
Route::post('/customer/auth/send-otp', [CustomerAuthController::class, 'sendOtp']);
Route::post('/customer/auth/verify-otp', [CustomerAuthController::class, 'verifyOtp']);
Route::post('/apply-coupon', [CouponController::class, 'applyCoupon']);


// ========================================================================
// 2. ADMIN / STAFF SECURED ROUTES (v1 API Group with Granular Permissions)
// ========================================================================
Route::prefix('v1')->middleware(['auth:sanctum', 'log.api.request'])->group(function () {
    // ADMIN NOTIFICATIONS
    Route::get('/admin/notifications', [AdminNotificationController::class, 'index']);
    Route::patch('/admin/notifications/{id}/read', [AdminNotificationController::class, 'markAsRead']);
    Route::patch('/admin/notifications/read-all', [AdminNotificationController::class, 'markAllAsRead']);
    
    Route::get('/dashboard', [SalesAnalyticsController::class, 'getAnalytics']);
    Route::get('/admin/dashboard', [SalesAnalyticsController::class, 'getAnalytics']);

    // Common Routes (Accessible to all authenticated staff members)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/request-counts', [ApiRequestController::class, 'getRequestCounts']);
    Route::get('/global-search', [GlobalSearchController::class, 'search']);
    Route::get('/admin/global-search', [GlobalSearchController::class, 'search']);
    
    // ---------------------------------------------------
    // USER PROFILE & DYNAMIC PERMISSIONS SYNC ROUTE
    // (Returns latest Spatie roles and permissions on frontend page refresh)
    // ---------------------------------------------------
    Route::get('/user-profile', function (Request $request) {
        $user = $request->user();
        
        $permissions = $user->getAllPermissions()->pluck('name');
        $roles = $user->getRoleNames();

        $userData = $user->toArray();
        $userData['permissions'] = $permissions;
        $userData['roles'] = $roles;

        return response()->json([
            'status' => true,
            'user' => $userData
        ]);
    });

    Route::get('/test-my-role', function (Illuminate\Http\Request $request) {
        return response()->json([
            'email' => $request->user()->email,
            'roles_assigned' => $request->user()->getRoleNames(),
            'permissions_assigned' => $request->user()->getAllPermissions()->pluck('name'),
        ]);
    });

    // ---------------------------------------------------
    // INVENTORY MANAGEMENT (Synced with sidebar checkbox permissions)
    // ---------------------------------------------------
    Route::middleware('can:inventory_all_products')->group(function () {
        Route::get('/products', [ProductController::class, 'index']); // Fallback read access
    });

    Route::middleware('can:inventory_add_product')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    });

    Route::middleware('can:inventory_categories')->group(function () {
        Route::patch('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus']);
        Route::apiResource('categories', CategoryController::class);
    });

    Route::middleware('can:inventory_brands')->group(function () {
        Route::apiResource('brands', BrandController::class);
    });

    Route::middleware('can:inventory_stock_audit')->group(function () {
        // Stock audit specific endpoints can be placed here if needed
    });

    // ---------------------------------------------------
    // ORDER MANAGEMENT (Synced with modal options)
    // ---------------------------------------------------
    Route::middleware('can:orders_all_orders')->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'showOrder']);
        Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::get('/admin/order-details/{orderNumber}', [OrderController::class, 'show']);
    });

    // ---------------------------------------------------
    // RETURNS & RMA 
    // ---------------------------------------------------
    Route::middleware('can:orders_returns_rma')->group(function () {
        Route::get('/admin/returns', [OrderController::class, 'getAllReturns']);
        Route::get('/admin/returns/{id}', [OrderController::class, 'getReturnDetails']);
        Route::post('/admin/returns/{id}/status', [OrderController::class, 'updateReturnStatus']);
    });

    // ---------------------------------------------------
    // CUSTOMERS & PAYMENTS MODULE
    // ---------------------------------------------------
    Route::middleware('can:customers_list')->group(function () {
        Route::apiResource('customers', CustomerController::class);
    });

    Route::middleware('can:customers_reviews')->group(function () {
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::get('/admin/reviews', [ReviewController::class, 'getAllReviews']);
        Route::delete('/admin/reviews/{id}', [ReviewController::class, 'destroy']);
    });

    Route::middleware('can:customers_transactions')->group(function () {
        Route::get('/transactions', [OrderController::class, 'getTransactions']);
        Route::get('/admin/transaction-details/{orderNumber}', [OrderController::class, 'getTransactionByOrderNumber']);
    });

    Route::middleware('can:customers_refunds')->group(function () {
        Route::get('/refunds', [RefundController::class, 'index']);
    });

    // ---------------------------------------------------
    // LOGISTICS & ANALYTICS MODULE
    // ---------------------------------------------------
    Route::middleware('can:logistics_shipments')->group(function () {
        Route::post('/admin/shipments', [ShipmentController::class, 'createShipment']);
        Route::get('/admin/shipments', [ShipmentController::class, 'index']);
        Route::get('/admin/shipments/{id}', [ShipmentController::class, 'show']);
    });

    Route::middleware('can:logistics_sales_analytics')->group(function () {
        Route::get('/admin/sales-analytics', [SalesAnalyticsController::class, 'getAnalytics']);
    });

    Route::middleware('can:logistics_revenue_reports')->group(function () {
        Route::get('/admin/revenue-reports', [RevenueReportsController::class, 'getRevenueReports']);
    });

    // ---------------------------------------------------
    // SYSTEM MODULE (Coupons, Campaigns, Invoices, Staff, Settings)
    // ---------------------------------------------------
    Route::middleware('can:system_coupons')->group(function () {
        Route::apiResource('coupons', CouponController::class);
    });

    Route::middleware('can:system_marketing_campaigns')->group(function () {
        Route::get('/admin/campaigns', [CampaignController::class, 'index']);
        Route::post('/admin/campaigns', [CampaignController::class, 'store']);
        Route::patch('/admin/campaigns/{id}/status', [CampaignController::class, 'updateStatus']);
        Route::delete('/admin/campaigns/{id}', [CampaignController::class, 'destroy']);
    });

    Route::middleware('can:system_tax_invoices')->group(function () {
        Route::get('/admin/invoices', [InvoiceController::class, 'index']);
    });

    Route::middleware('can:system_staff_users')->group(function () {
        Route::apiResource('admin/staff', StaffUserController::class);
    });
});

// Public Download Invoice Route
Route::get('/v1/admin/invoices/{invoice_no}/download', [InvoiceController::class, 'download']);


// ========================================================================
// 3. CUSTOMER SECURED ROUTES (For App/Web End Users)
// ========================================================================
Route::middleware('auth:customer')->group(function () {
    // Customer Order Actions
    Route::post('/place-order', [OrderController::class, 'placeOrder']);
    Route::post('/create-razorpay-order', [PaymentController::class, 'createRazorpayOrder']);
    Route::get('/my-orders', [OrderController::class, 'myOrders']);
    Route::get('/my-orders/{id}', [OrderController::class, 'myOrderDetails']);
    Route::post('/my-orders/{id}/cancel', [OrderController::class, 'cancelMyOrder']);
    Route::post('/orders/return-item', [OrderController::class, 'requestReturn']);

    // Customer Profile & Address Management
    Route::get('/customer/profile', [CustomerController::class, 'getCustomerProfile']);
    Route::put('/customer/profile', [CustomerController::class, 'updateCustomerProfile']);
    Route::get('/customer/addresses', [CustomerController::class, 'getCustomerAddresses']);
    Route::post('/customer/addresses', [CustomerController::class, 'addCustomerAddress']);
    Route::put('/customer/addresses/{id}', [CustomerController::class, 'updateCustomerAddress']);
    Route::delete('/customer/addresses/{id}', [CustomerController::class, 'deleteCustomerAddress']);
    Route::put('/customer/password', [CustomerController::class, 'updatePassword']);
});


// ========================================================================
// 4. EXTERNAL WEBHOOKS & 3RD PARTY SERVICES
// ========================================================================
Route::get('/get-shiprocket-channels', function (ShiprocketService $service) {
    $token = $service->getToken();
    $response = Http::withToken($token)
        ->get('https://apiv2.shiprocket.in/v1/external/channels');

    return $response->json();
});

// Shiprocket Webhook Integration
Route::post('/webhooks/shiprocket', [WebhookController::class, 'handleShiprocket']);
