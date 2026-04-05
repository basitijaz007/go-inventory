<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class RegisterProductSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['name' => 'GO Flash 4T', 'grade' => 'SG, JASO MA2', 'packing_size' => '0.7 L', 'packs_per_carton' => 12],
            ['name' => 'GO Flash 4T', 'grade' => 'SG, JASO MA3', 'packing_size' => '1 L', 'packs_per_carton' => 12],
            ['name' => 'GO Performa', 'grade' => 'SF', 'packing_size' => '0.7 L', 'packs_per_carton' => 12],

            ['name' => 'GO Extra', 'grade' => 'SG/CD 20W-50', 'packing_size' => '3 L', 'packs_per_carton' => 4],
            ['name' => 'GO Extra', 'grade' => 'SG/CD 20W-50', 'packing_size' => '4 L', 'packs_per_carton' => 4],

            ['name' => 'GO Extreme', 'grade' => 'SP-RC 10W-40', 'packing_size' => '3 L', 'packs_per_carton' => 4],
            ['name' => 'GO Extreme', 'grade' => 'SP-RC 10W-40', 'packing_size' => '4 L', 'packs_per_carton' => 4],
            ['name' => 'GO Extreme', 'grade' => 'SP-RC, SAC, GF-6 5W-30', 'packing_size' => '3 L', 'packs_per_carton' => 4],
            ['name' => 'GO Extreme', 'grade' => 'SP-RC, SAC, GF-6 5W-30', 'packing_size' => '4 L', 'packs_per_carton' => 4],

            ['name' => 'GO Deluxe 7000', 'grade' => 'CI-4 / SL', 'packing_size' => '4 L', 'packs_per_carton' => 4],
            ['name' => 'GO Deluxe 7000', 'grade' => 'CI-4 / SL', 'packing_size' => '10 L', 'packs_per_carton' => 1],

            ['name' => 'GO Deluxe 5000', 'grade' => 'CF-4 / SG', 'packing_size' => '4 L', 'packs_per_carton' => 4],
            ['name' => 'GO Deluxe 5000', 'grade' => 'CF-4 / SG', 'packing_size' => '208 L', 'packs_per_carton' => 1],

            ['name' => 'GO Deluxe 3000', 'grade' => 'CF / SF', 'packing_size' => '10 L', 'packs_per_carton' => 1],
            ['name' => 'GO Deluxe 1000', 'grade' => 'CD / SF', 'packing_size' => '4 L', 'packs_per_carton' => 4],
            ['name' => 'GO Deluxe 1000', 'grade' => 'CD / SF', 'packing_size' => '20 L', 'packs_per_carton' => 1],

            ['name' => 'GO MP-50', 'grade' => 'CC / SC', 'packing_size' => '20 L', 'packs_per_carton' => 1],
            ['name' => 'GO MP-50', 'grade' => 'CC / SC', 'packing_size' => '208 L', 'packs_per_carton' => 1],

            ['name' => 'Hydrolix AW 68', 'grade' => 'ISO Grade', 'packing_size' => '20 L', 'packs_per_carton' => 1],
            ['name' => 'GO MP-50 Multipurpose', 'grade' => 'CC', 'packing_size' => '950 ml', 'packs_per_carton' => 12],
        ];

        foreach ($defaults as $item) {
            Product::query()->firstOrCreate(
                [
                    'name' => $item['name'],
                    'grade' => $item['grade'],
                    'packing_size' => $item['packing_size'],
                ],
                [
                    'price_per_pack' => 0,
                    'packs_per_carton' => $item['packs_per_carton'],
                    'current_total_packs' => 0,
                    'low_stock_threshold' => 10,
                    'is_active' => true,
                ]
            );
        }
    }
}
