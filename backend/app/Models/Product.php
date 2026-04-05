<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'grade',
        'packing_size',
        'price_per_pack',
        'packs_per_carton',
        'current_total_packs',
        'low_stock_threshold',
        'is_active',
    ];

    protected $casts = [
        'price_per_pack' => 'decimal:2',
        'packs_per_carton' => 'integer',
        'current_total_packs' => 'integer',
        'low_stock_threshold' => 'integer',
        'is_active' => 'boolean',
    ];

    public function stockEntries(): HasMany
    {
        return $this->hasMany(StockEntry::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(StockLedger::class);
    }
}
