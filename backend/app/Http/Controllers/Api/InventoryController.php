<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Support\StockMath;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->orderBy('grade')
            ->orderBy('packing_size')
            ->get()
            ->map(function (Product $product): array {
                $split = StockMath::splitToCartonsAndPacks(
                    $product->current_total_packs,
                    $product->packs_per_carton
                );

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'grade' => $product->grade,
                    'packing_size' => $product->packing_size,
                    'price_per_pack' => (float) $product->price_per_pack,
                    'packs_per_carton' => $product->packs_per_carton,
                    'current_total_packs' => $product->current_total_packs,
                    'current_cartons' => $split['cartons'],
                    'current_packs' => $split['packs'],
                    'low_stock_threshold' => $product->low_stock_threshold,
                    'is_low_stock' => $product->current_total_packs <= $product->low_stock_threshold,
                    'is_active' => $product->is_active,
                ];
            });

        return response()->json($products);
    }
}
