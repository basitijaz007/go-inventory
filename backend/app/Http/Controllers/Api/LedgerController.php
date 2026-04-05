<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockLedger;
use Illuminate\Http\JsonResponse;

class LedgerController extends Controller
{
    public function byProduct(int $productId): JsonResponse
    {
        $entries = StockLedger::query()
            ->where('product_id', $productId)
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        return response()->json($entries);
    }
}
