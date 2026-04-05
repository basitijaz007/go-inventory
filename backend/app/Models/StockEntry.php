<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'date',
        'cartons',
        'packs',
        'total_packs',
        'note',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'cartons' => 'integer',
        'packs' => 'integer',
        'total_packs' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
