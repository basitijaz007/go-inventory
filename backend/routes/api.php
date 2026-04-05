<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\LedgerController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\StockEntryController;
use App\Http\Controllers\Api\SystemController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

Route::apiResource('products', ProductController::class)
    ->only(['index', 'store', 'update', 'destroy']);

Route::get('/inventory', [InventoryController::class, 'index']);

Route::get('/stock-entries', [StockEntryController::class, 'index']);
Route::post('/stock-entries', [StockEntryController::class, 'store']);

Route::get('/sales', [SaleController::class, 'index']);
Route::post('/sales', [SaleController::class, 'store']);

Route::get('/ledger/{productId}', [LedgerController::class, 'byProduct']);

Route::get('/reports/sales', [ReportController::class, 'sales']);

Route::post('/system/backup', [SystemController::class, 'backup']);
Route::post('/system/restore', [SystemController::class, 'restore']);
