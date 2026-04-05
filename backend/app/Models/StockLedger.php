<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLedger extends Model
{
    use HasFactory;

    protected $table = 'stock_ledger';

    protected $fillable = [
        'product_id',
        'date',
        'transaction_type',
        'reference_type',
        'reference_id',
        'qty_in',
        'qty_out',
        'balance',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'reference_id' => 'integer',
        'qty_in' => 'integer',
        'qty_out' => 'integer',
        'balance' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
