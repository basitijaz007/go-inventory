<?php

namespace App\Support;

final class StockMath
{
    public static function totalPacks(int $cartons, int $packsPerCarton, int $packs): int
    {
        return ($cartons * $packsPerCarton) + $packs;
    }

    /**
     * @return array{cartons:int,packs:int}
     */
    public static function splitToCartonsAndPacks(int $totalPacks, int $packsPerCarton): array
    {
        if ($packsPerCarton <= 0) {
            return ['cartons' => 0, 'packs' => $totalPacks];
        }

        return [
            'cartons' => intdiv($totalPacks, $packsPerCarton),
            'packs' => $totalPacks % $packsPerCarton,
        ];
    }
}
