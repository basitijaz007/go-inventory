<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('grade');
            $table->string('packing_size');
            $table->decimal('price_per_pack', 12, 2);
            $table->unsignedInteger('packs_per_carton');
            $table->unsignedInteger('current_total_packs')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['name', 'grade', 'packing_size'], 'products_unique_variant');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
