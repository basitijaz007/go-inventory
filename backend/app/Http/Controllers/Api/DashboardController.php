<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();

        $todaySales = (float) Sale::query()
            ->whereDate('date', $today)
            ->sum('total_amount');

        $allProducts = Product::query()
            ->where('is_active', true)
            ->count();

        $lowStockProducts = Product::query()
            ->whereColumn('current_total_packs', '<=', 'low_stock_threshold')
            ->where('is_active', true)
            ->count();

        return response()->json([
            'todaySales' => $todaySales,
            'allProducts' => $allProducts,
            'lowStockProducts' => $lowStockProducts,
        ]);
    }
}
