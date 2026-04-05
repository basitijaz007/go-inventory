<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->orderBy('grade')
            ->orderBy('packing_size')
            ->get();

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'grade' => ['required', 'string', 'max:120'],
            'packing_size' => ['required', 'string', 'max:120'],
            'price_per_pack' => ['required', 'numeric', 'min:0'],
            'packs_per_carton' => ['required', 'integer', 'min:1'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
        ]);

        $this->validateVariantUnique($validated);

        $product = Product::query()->create([
            ...$validated,
            'current_total_packs' => 0,
            'low_stock_threshold' => $validated['low_stock_threshold'] ?? 10,
            'is_active' => true,
        ]);

        return response()->json($product, 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'grade' => ['required', 'string', 'max:120'],
            'packing_size' => ['required', 'string', 'max:120'],
            'price_per_pack' => ['required', 'numeric', 'min:0'],
            'packs_per_carton' => ['required', 'integer', 'min:1'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->validateVariantUnique($validated, $product->id);

        $product->fill($validated);
        $product->save();

        return response()->json($product->refresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        $hasEntries = $product->stockEntries()->exists() || $product->saleItems()->exists();
        if ($hasEntries) {
            return response()->json([
                'message' => 'Product cannot be deleted because it has stock or sales history.',
            ], 422);
        }

        $product->delete();

        return response()->json(['success' => true]);
    }

    private function validateVariantUnique(array $data, ?int $ignoreId = null): void
    {
        validator($data, [
            'name' => [
                Rule::unique('products')
                    ->where(fn ($query) => $query
                        ->where('grade', $data['grade'])
                        ->where('packing_size', $data['packing_size']))
                    ->ignore($ignoreId),
            ],
        ])->validate();
    }
}
