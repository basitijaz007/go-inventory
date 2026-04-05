<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->date('date');
            $table->unsignedInteger('cartons');
            $table->unsignedInteger('packs');
            $table->unsignedInteger('total_packs');
            $table->string('note', 255)->nullable();
            $table->timestamps();
            $table->index(['product_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_entries');
    }
};
