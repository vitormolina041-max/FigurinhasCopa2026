import type { Figurinha } from "../types/Figurinha";

export const SEM_PAIS = "Sem pa\u00eds informado";

const OFFICIAL_ALBUM_COUNTRY_ORDER = [
  "FWC",
  "MEXICO",
  "AFRICA DO SUL",
  "COREIA DO SUL",
  "REPUBLICA CHECA",
  "CANADA",
  "BOSNIA E HERZEGOVINA",
  "CATAR",
  "SUICA",
  "BRASIL",
  "MARROCOS",
  "HAITI",
  "ESCOCIA",
  "ESTADOS UNIDOS",
  "PARAGUAI",
  "AUSTRALIA",
  "TURQUIA",
  "ALEMANHA",
  "CURACAO",
  "COSTA DO MARFIM",
  "EQUADOR",
  "HOLANDA",
  "JAPAO",
  "SUECIA",
  "TUNISIA",
  "BELGICA",
  "EGITO",
  "IRA",
  "NOVA ZELANDIA",
  "ESPANHA",
  "CABO VERDE",
  "ARABIA SAUDITA",
  "URUGUAI",
  "FRANCA",
  "SENEGAL",
  "IRAQUE",
  "NORUEGA",
  "ARGENTINA",
  "ARGELIA",
  "AUSTRIA",
  "JORDANIA",
  "PORTUGAL",
  "CONGO DR",
  "UZBEQUISTAO",
  "COLOMBIA",
  "INGLATERRA",
  "CROACIA",
  "GANA",
  "PANAMA",
];

const OFFICIAL_ALBUM_COUNTRY_INDEX = new Map(
  OFFICIAL_ALBUM_COUNTRY_ORDER.map((country, index) => [country, index]),
);

const naturalCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

function isFigurinhaZero(figurinha: Figurinha) {
  const numericParts = figurinha.numero.match(/\d+/g);
  return Boolean(numericParts?.some((part) => Number(part) === 0));
}

export function getPais(figurinha: Figurinha) {
  return figurinha.pais.trim() || SEM_PAIS;
}

export function normalizeCountryName(country: string) {
  return country
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
}

export function comparePais(a: string, b: string) {
  const firstIndex = OFFICIAL_ALBUM_COUNTRY_INDEX.get(normalizeCountryName(a));
  const secondIndex = OFFICIAL_ALBUM_COUNTRY_INDEX.get(normalizeCountryName(b));

  if (firstIndex !== undefined && secondIndex !== undefined) return firstIndex - secondIndex;
  if (firstIndex !== undefined) return -1;
  if (secondIndex !== undefined) return 1;

  return naturalCollator.compare(a, b);
}

export function compareFigurinhaNumero(a: Figurinha, b: Figurinha) {
  const firstIsZero = isFigurinhaZero(a);
  const secondIsZero = isFigurinhaZero(b);
  if (firstIsZero !== secondIsZero) return firstIsZero ? -1 : 1;

  return naturalCollator.compare(a.numero, b.numero);
}

export function compareFigurinhasByAlbum(a: Figurinha, b: Figurinha) {
  const firstIsZero = isFigurinhaZero(a);
  const secondIsZero = isFigurinhaZero(b);
  if (firstIsZero !== secondIsZero) return firstIsZero ? -1 : 1;

  const countryComparison = comparePais(getPais(a), getPais(b));
  if (countryComparison !== 0) return countryComparison;

  const numberComparison = compareFigurinhaNumero(a, b);
  if (numberComparison !== 0) return numberComparison;

  return naturalCollator.compare(a.nome || a.numero, b.nome || b.numero);
}

export function sortFigurinhasByAlbum(figurinhas: Figurinha[]) {
  return [...figurinhas].sort(compareFigurinhasByAlbum);
}
