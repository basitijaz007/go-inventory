<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function sales(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $from = $validated['from'] ?? now()->startOfMonth()->toDateString();
        $to = $validated['to'] ?? now()->toDateString();

        $sales = Sale::query()
            ->with(['items.product:id,name,grade,packing_size'])
            ->whereBetween('date', [$from, $to])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        $summary = [
            'from' => $from,
            'to' => $to,
            'total_sales_amount' => (float) $sales->sum('total_amount'),
            'total_invoices' => $sales->count(),
            'total_items_sold_packs' => (int) SaleItem::query()
                ->whereHas('sale', function ($query) use ($from, $to): void {
                    $query->whereBetween('date', [$from, $to]);
                })
                ->sum('total_packs'),
        ];

        return response()->json([
            'summary' => $summary,
            'sales' => $sales,
        ]);
    }
}
