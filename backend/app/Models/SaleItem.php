<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_id',
        'cartons',
        'packs',
        'total_packs',
        'price_per_pack',
        'subtotal',
    ];

    protected $casts = [
        'cartons' => 'integer',
        'packs' => 'integer',
        'total_packs' => 'integer',
        'price_per_pack' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
