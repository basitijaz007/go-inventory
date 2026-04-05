<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('products', 'sku')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('sku');
            });
        }
    }

    public function down(): void
    {
        // SKU support intentionally removed.
    }
};
