<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_ledger', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->date('date');
            $table->string('transaction_type', 20);
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->unsignedInteger('qty_in')->default(0);
            $table->unsignedInteger('qty_out')->default(0);
            $table->unsignedInteger('balance');
            $table->string('remarks', 255)->nullable();
            $table->timestamps();

            $table->index(['product_id', 'date', 'id']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_ledger');
    }
};
