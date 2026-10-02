<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SalesAnalyticsController extends Controller
{
    public function getAnalytics(Request $request)
    {
        $range = $request->get('range', '30days');
        
        // Default ranges 
        $startDate = now()->subDays(30)->startOfDay();
        $endDate = now()->endOfDay();

        if ($range == '7days') {
            $startDate = now()->subDays(7)->startOfDay();
        } elseif ($range == 'today') {
            $startDate = now()->today()->startOfDay();
        } elseif ($range == 'this_year') {
            $startDate = now()->startOfYear();
        } elseif ($range == 'custom' && $request->filled('start_date') && $request->filled('end_date')) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
        }

        // Summary Metrics 
        $totalRevenue = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled') 
            ->sum('total_price');                

        $totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();

        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Daily Sales Trend
        $salesTrend = Order::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, SUM(total_price) as revenue, COUNT(*) as orders_count')
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        return response()->json([
            'status' => true,
            'data' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_orders' => $totalOrders,
                'average_order_value' => round($averageOrderValue, 2),
                'sales_trend' => $salesTrend
            ]
        ], 200);
    }
}