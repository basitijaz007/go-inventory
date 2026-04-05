export function totalPacks(cartons: number, packsPerCarton: number, packs: number): number {
  return cartons * packsPerCarton + packs;
}

export function splitPacks(total: number, packsPerCarton: number): { cartons: number; packs: number } {
  if (packsPerCarton <= 0) {
    return { cartons: 0, packs: total };
  }

  return {
    cartons: Math.floor(total / packsPerCarton),
    packs: total % packsPerCarton,
  };
}

export function formatCartonsAndPacks(total: number, packsPerCarton: number): string {
  const { cartons, packs } = splitPacks(total, packsPerCarton);
  if (packs === 0) {
    return `${cartons} carton${cartons === 1 ? "" : "s"}`;
  }

  if (cartons === 0) {
    return `${packs} pack${packs === 1 ? "" : "s"}`;
  }

  return `${cartons} carton${cartons === 1 ? "" : "s"} + ${packs} pack${packs === 1 ? "" : "s"}`;
}

export function formatStockCalculation(total: number, packsPerCarton: number): string {
  if (packsPerCarton <= 0) {
    return `${total} packs`;
  }

  const { cartons, packs } = splitPacks(total, packsPerCarton);
  return `${cartons} x ${packsPerCarton} + ${packs} = ${total} packs`;
}
