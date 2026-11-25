<?php

use App\Http\Controllers\Api\V1\LeadController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => response()->json(['status' => 'ok', 'service' => 'LeadFlow CRM API', 'version' => '1.0.0']));
    Route::apiResource('leads', LeadController::class);
});
