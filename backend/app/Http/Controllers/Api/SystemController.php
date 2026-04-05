<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class SystemController extends Controller
{
    public function backup(): JsonResponse
    {
        if (config('database.default') !== 'sqlite') {
            return response()->json([
                'message' => 'Automatic backup endpoint currently supports SQLite. For MySQL use mysqldump.',
            ], 422);
        }

        $databasePath = config('database.connections.sqlite.database');
        if (!is_string($databasePath) || $databasePath === ':memory:' || !File::exists($databasePath)) {
            return response()->json(['message' => 'SQLite database file not found.'], 422);
        }

        $relativePath = 'backups/lubricants_backup_' . now()->format('Ymd_His') . '.sqlite';
        Storage::disk('local')->put($relativePath, File::get($databasePath));

        return response()->json([
            'success' => true,
            'file' => $relativePath,
            'absolute_path' => storage_path('app/' . $relativePath),
        ]);
    }

    public function restore(Request $request): JsonResponse
    {
        if (config('database.default') !== 'sqlite') {
            return response()->json([
                'message' => 'Automatic restore endpoint currently supports SQLite only.',
            ], 422);
        }

        $validated = $request->validate([
            'backup' => ['required', 'file'],
        ]);

        $databasePath = config('database.connections.sqlite.database');
        if (!is_string($databasePath) || $databasePath === ':memory:') {
            return response()->json(['message' => 'Invalid SQLite database path.'], 422);
        }

        $uploadedFile = $validated['backup'];

        DB::disconnect('sqlite');
        File::copy($uploadedFile->getRealPath(), $databasePath);

        return response()->json([
            'success' => true,
            'message' => 'Database restored. Restart the app to reload all connections.',
        ]);
    }
}
