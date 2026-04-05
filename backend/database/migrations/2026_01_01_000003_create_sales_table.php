<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table): void {
            $table->id();
            $table->date('date');
            $table->string('invoice_no', 100)->nullable()->unique();
            $table->decimal('total_amount', 12, 2);
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->index(['date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
