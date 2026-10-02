<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RevenueReportsController extends Controller
{
    public function getRevenueReports(Request $request)
    {
        $range = $request->get('range', '30days');
        
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

        // Financial Metrics Calculations
        $grossRevenue = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        $upiRevenue = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->where('payment_method', 'upi')
            ->sum('total_price');

        $codRevenue = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->where('payment_method', 'cod')
            ->sum('total_price');

        $pendingCollections = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'unpaid')
            ->sum('total_price');

        // Detailed Transaction Revenue Ledger
        $transactions = Order::whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'DESC')
            ->select('order_number', 'total_price', 'status', 'payment_method', 'payment_status', 'created_at')
            ->get();

        return response()->json([
            'status' => true,
            'data' => [
                'gross_revenue' => round($grossRevenue, 2),
                'upi_revenue' => round($upiRevenue, 2),
                'cod_revenue' => round($codRevenue, 2),
                'pending_collections' => round($pendingCollections, 2),
                'transactions' => $transactions
            ]
        ], 200);
    }
}