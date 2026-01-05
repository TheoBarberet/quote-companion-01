// Transport pricing data from grille_tarifaire_transport_plastique.xlsx

export interface TransportTarif {
  mode: string;
  societe: string;
  distanceType: string;
  distanceMin?: number;
  distanceMax?: number;
  poidsMax: number;
  volumeMax: number;
  uniteFacturation: string;
  tarifUnitaire: number;
  commentaires: string;
}

export const transportTarifs: TransportTarif[] = [
  {
    mode: 'Routier',
    societe: 'Transports Alpha',
    distanceType: '0–200',
    distanceMin: 0,
    distanceMax: 200,
    poidsMax: 24,
    volumeMax: 90,
    uniteFacturation: '€/km',
    tarifUnitaire: 1.2,
    commentaires: 'Camion complet standard',
  },
  {
    mode: 'Routier',
    societe: 'Transports Beta',
    distanceType: '200–600',
    distanceMin: 200,
    distanceMax: 600,
    poidsMax: 24,
    volumeMax: 90,
    uniteFacturation: '€/km',
    tarifUnitaire: 1.0,
    commentaires: 'National longue distance',
  },
  {
    mode: 'Routier',
    societe: 'Logistique Express',
    distanceType: 'National',
    distanceMin: 0,
    distanceMax: 9999,
    poidsMax: 20,
    volumeMax: 70,
    uniteFacturation: '€/km',
    tarifUnitaire: 2.0,
    commentaires: 'Livraison 24h',
  },
  {
    mode: 'Ferroviaire',
    societe: 'SNCF Fret',
    distanceType: '500–1000',
    distanceMin: 500,
    distanceMax: 1000,
    poidsMax: 60,
    volumeMax: 120,
    uniteFacturation: '€/t-km',
    tarifUnitaire: 0.1,
    commentaires: 'Train complet',
  },
  {
    mode: 'Ferroviaire',
    societe: 'EuroCargo Rail',
    distanceType: '800+',
    distanceMin: 800,
    distanceMax: 9999,
    poidsMax: 70,
    volumeMax: 140,
    uniteFacturation: '€/t-km',
    tarifUnitaire: 0.08,
    commentaires: 'Gros volumes',
  },
  {
    mode: 'Aérien',
    societe: 'AirCargo Express',
    distanceType: 'Europe',
    distanceMin: 0,
    distanceMax: 2000,
    poidsMax: 5,
    volumeMax: 30,
    uniteFacturation: '€/kg ou €/m3',
    tarifUnitaire: 3.5,
    commentaires: 'Marchandise volumineuse',
  },
  {
    mode: 'Aérien',
    societe: 'GlobalAir',
    distanceType: 'Intercontinental',
    distanceMin: 2000,
    distanceMax: 99999,
    poidsMax: 10,
    volumeMax: 40,
    uniteFacturation: '€/kg ou €/m3',
    tarifUnitaire: 5.5,
    commentaires: 'Urgent / valeur élevée',
  },
];

export interface TransportCalculResult {
  cout: number;
  societe: string;
  coutKm: number;
}

export function calculateTransportCost(
  mode: string,
  distance: number,
  volume: number
): TransportCalculResult | null {
  // Filter tarifs by mode
  const modeTarifs = transportTarifs.filter(
    (t) => t.mode.toLowerCase() === mode.toLowerCase()
  );

  if (modeTarifs.length === 0) return null;

  // Find the best matching tarif based on distance and volume limits
  let bestTarif: TransportTarif | null = null;

  for (const tarif of modeTarifs) {
    const inDistanceRange =
      distance >= (tarif.distanceMin ?? 0) &&
      distance <= (tarif.distanceMax ?? 99999);
    const volumeOk = volume <= tarif.volumeMax;

    if (inDistanceRange && volumeOk) {
      // Prefer the cheapest option
      if (!bestTarif || tarif.tarifUnitaire < bestTarif.tarifUnitaire) {
        bestTarif = tarif;
      }
    }
  }

  // IMPORTANT: pas de fallback permissif.
  // Si aucun tarif ne correspond à la distance ET au volume, on retourne null.
  if (!bestTarif) return null;
  if (!bestTarif) return null;

  // Simple calculation: always distance * cost per km
  const coutKm = bestTarif.tarifUnitaire;
  const cout = distance * coutKm;

  return {
    cout: Math.round(cout * 100) / 100,
    societe: bestTarif.societe,
    coutKm,
  };
}
