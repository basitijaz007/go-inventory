<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockEntry;
use App\Models\StockLedger;
use App\Support\StockMath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockEntryController extends Controller
{
    public function index(): JsonResponse
    {
        $entries = StockEntry::query()
            ->with(['product:id,name,grade,packing_size,packs_per_carton'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(function (StockEntry $entry): array {
                return [
                    'id' => $entry->id,
                    'date' => $entry->date?->format('Y-m-d'),
                    'product_id' => $entry->product_id,
                    'product_name' => $entry->product?->name,
                    'product_grade' => $entry->product?->grade,
                    'product_packing_size' => $entry->product?->packing_size,
                    'cartons' => $entry->cartons,
                    'packs' => $entry->packs,
                    'total_packs' => $entry->total_packs,
                    'note' => $entry->note,
                ];
            });

        return response()->json($entries);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'date' => ['required', 'date'],
            'cartons' => ['required', 'integer', 'min:0'],
            'packs' => ['required', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $entry = DB::transaction(function () use ($validated): StockEntry {
            /** @var Product $product */
            $product = Product::query()
                ->whereKey($validated['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $totalPacks = StockMath::totalPacks(
                $validated['cartons'],
                $product->packs_per_carton,
                $validated['packs'],
            );

            if ($totalPacks <= 0) {
                throw ValidationException::withMessages([
                    'cartons' => ['Total packs must be greater than zero.'],
                ]);
            }

            $entry = StockEntry::query()->create([
                'product_id' => $product->id,
                'date' => $validated['date'],
                'cartons' => $validated['cartons'],
                'packs' => $validated['packs'],
                'total_packs' => $totalPacks,
                'note' => $validated['note'] ?? null,
            ]);

            $product->current_total_packs += $totalPacks;
            $product->save();

            StockLedger::query()->create([
                'product_id' => $product->id,
                'date' => $validated['date'],
                'transaction_type' => 'STOCK_IN',
                'reference_type' => 'stock_entry',
                'reference_id' => $entry->id,
                'qty_in' => $totalPacks,
                'qty_out' => 0,
                'balance' => $product->current_total_packs,
                'remarks' => $validated['note'] ?? null,
            ]);

            return $entry->load('product:id,name,grade,packing_size,packs_per_carton');
        });

        return response()->json([
            'id' => $entry->id,
            'date' => $entry->date?->format('Y-m-d'),
            'product_id' => $entry->product_id,
            'product_name' => $entry->product?->name,
            'product_grade' => $entry->product?->grade,
            'product_packing_size' => $entry->product?->packing_size,
            'cartons' => $entry->cartons,
            'packs' => $entry->packs,
            'total_packs' => $entry->total_packs,
            'note' => $entry->note,
        ], 201);
    }
}
