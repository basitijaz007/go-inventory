<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockLedger;
use App\Support\StockMath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function index(): JsonResponse
    {
        $sales = Sale::query()
            ->with(['items.product:id,name,grade,packing_size,packs_per_carton'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        return response()->json($sales);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'invoice_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.cartons' => ['required', 'integer', 'min:0'],
            'items.*.packs' => ['required', 'integer', 'min:0'],
        ]);

        $sale = DB::transaction(function () use ($validated): Sale {
            $runningTotal = 0.0;
            $preparedItems = [];

            foreach ($validated['items'] as $line) {
                /** @var Product $product */
                $product = Product::query()
                    ->whereKey($line['product_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $totalPacks = StockMath::totalPacks(
                    $line['cartons'],
                    $product->packs_per_carton,
                    $line['packs']
                );

                if ($totalPacks <= 0) {
                    throw ValidationException::withMessages([
                        'items' => ['Each sale item must have quantity greater than zero.'],
                    ]);
                }

                if ($totalPacks > $product->current_total_packs) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "Insufficient stock for {$product->name} {$product->packing_size}. " .
                            "Available: {$product->current_total_packs}, requested: {$totalPacks}.",
                        ],
                    ]);
                }

                $pricePerPack = (float) $product->price_per_pack;
                $subtotal = round($totalPacks * $pricePerPack, 2);
                $runningTotal += $subtotal;

                $preparedItems[] = [
                    'product' => $product,
                    'cartons' => $line['cartons'],
                    'packs' => $line['packs'],
                    'total_packs' => $totalPacks,
                    'price_per_pack' => $pricePerPack,
                    'subtotal' => $subtotal,
                ];
            }

            $sale = Sale::query()->create([
                'date' => $validated['date'],
                'invoice_no' => $validated['invoice_no'] ?? null,
                'total_amount' => round($runningTotal, 2),
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($preparedItems as $preparedItem) {
                /** @var Product $product */
                $product = $preparedItem['product'];

                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'cartons' => $preparedItem['cartons'],
                    'packs' => $preparedItem['packs'],
                    'total_packs' => $preparedItem['total_packs'],
                    'price_per_pack' => $preparedItem['price_per_pack'],
                    'subtotal' => $preparedItem['subtotal'],
                ]);

                $product->current_total_packs -= $preparedItem['total_packs'];
                $product->save();

                StockLedger::query()->create([
                    'product_id' => $product->id,
                    'date' => $validated['date'],
                    'transaction_type' => 'SALE',
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'qty_in' => 0,
                    'qty_out' => $preparedItem['total_packs'],
                    'balance' => $product->current_total_packs,
                    'remarks' => $validated['notes'] ?? null,
                ]);
            }

            return $sale->load('items.product:id,name,grade,packing_size,packs_per_carton');
        });

        return response()->json($sale, 201);
    }
}
