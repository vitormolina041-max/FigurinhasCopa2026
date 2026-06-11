import { useMemo, useState } from "react";
import { CatalogoResumo } from "../components/CatalogoResumo";
import { FiltrosCatalogo } from "../components/FiltrosCatalogo";
import { FigurinhaCard } from "../components/FigurinhaCard";
import { FigurinhaLista } from "../components/FigurinhaLista";
import { GrupoPaisFigurinhas } from "../components/GrupoPaisFigurinhas";
import { HeaderPais } from "../components/HeaderPais";
import { SeletorVisualizacao, type CatalogViewMode } from "../components/SeletorVisualizacao";
import type { Figurinha, SortKey } from "../types/Figurinha";
import {
  compareFigurinhaNumero,
  compareFigurinhasByAlbum,
  comparePais as comparePaisAlbum,
  getPais as getPaisAlbum,
} from "../utils/figurinhaSorting";
import logoUrl from "./logo.png";

type CatalogoProps = {
  figurinhas: Figurinha[];
  notice: string;
  pendingStockIds: Set<string>;
  onAddToCart: (figurinha: Figurinha) => void;
};

const SEM_PAIS = "Sem país informado";
const COUNTRY_COLORS = ["#2fd06f", "#f0c85a", "#5bbcff", "#ff7e5e", "#b78cff", "#69e2c4", "#ffb357"];
const OFFICIAL_ALBUM_COUNTRY_ORDER = [
  "FWC",
  "MÉXICO",
  "ÁFRICA DO SUL",
  "COREIA DO SUL",
  "REPÚBLICA CHECA",
  "CANADÁ",
  "BÓSNIA E HERZEGOVINA",
  "CATAR",
  "SUÍÇA",
  "BRASIL",
  "MARROCOS",
  "HAITI",
  "ESCÓCIA",
  "ESTADOS UNIDOS",
  "PARAGUAI",
  "AUSTRÁLIA",
  "TURQUIA",
  "ALEMANHA",
  "CURAÇAO",
  "COSTA DO MARFIM",
  "EQUADOR",
  "HOLANDA",
  "JAPÃO",
  "SUÉCIA",
  "TUNÍSIA",
  "BÉLGICA",
  "EGITO",
  "IRÃ",
  "NOVA ZELÂNDIA",
  "ESPANHA",
  "CABO VERDE",
  "ARÁBIA SAUDITA",
  "URUGUAI",
  "FRANÇA",
  "SENEGAL",
  "IRAQUE",
  "NORUEGA",
  "ARGENTINA",
  "ARGÉLIA",
  "ÁUSTRIA",
  "JORDÂNIA",
  "PORTUGAL",
  "CONGO DR",
  "UZBEQUISTÃO",
  "COLÔMBIA",
  "INGLATERRA",
  "CROÁCIA",
  "GANA",
  "PANAMÁ",
];
const OFFICIAL_ALBUM_COUNTRY_INDEX = new Map(
  OFFICIAL_ALBUM_COUNTRY_ORDER.map((country, index) => [normalizeCountryName(country), index]),
);

function getPais(figurinha: Figurinha) {
  return figurinha.pais.trim() || SEM_PAIS;
}

function normalizeCountryName(country: string) {
  return country
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
}

function comparePais(a: string, b: string) {
  const firstIndex = OFFICIAL_ALBUM_COUNTRY_INDEX.get(normalizeCountryName(a));
  const secondIndex = OFFICIAL_ALBUM_COUNTRY_INDEX.get(normalizeCountryName(b));

  if (firstIndex !== undefined && secondIndex !== undefined) return firstIndex - secondIndex;
  if (firstIndex !== undefined) return -1;
  if (secondIndex !== undefined) return 1;

  return a.localeCompare(b, "pt-BR");
}

function getCountryColor(country: string) {
  const total = [...country].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COUNTRY_COLORS[total % COUNTRY_COLORS.length];
}

export function Catalogo({ figurinhas, notice, pendingStockIds, onAddToCart }: CatalogoProps) {
  const [busca, setBusca] = useState("");
  const [pais, setPais] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ordenacao, setOrdenacao] = useState<SortKey>("numero");
  const [viewMode, setViewMode] = useState<CatalogViewMode>("pais");
  const [collapsedCountries, setCollapsedCountries] = useState<Set<string>>(() => new Set());

  const availableFigurinhas = useMemo(
    () => figurinhas.filter((figurinha) => figurinha.quantidade > 0),
    [figurinhas],
  );

  const paises = useMemo(
    () => Array.from(new Set(availableFigurinhas.map(getPaisAlbum))).sort(comparePaisAlbum),
    [availableFigurinhas],
  );

  const categorias = useMemo(
    () => Array.from(new Set(availableFigurinhas.map((item) => item.categoria))).sort((a, b) => a.localeCompare(b)),
    [availableFigurinhas],
  );

  const filteredFigurinhas = useMemo(() => {
    const normalizedSearch = busca.trim().toLowerCase();

    return [...availableFigurinhas]
      .filter((figurinha) => {
        const matchesSearch =
          !normalizedSearch ||
          figurinha.nome.toLowerCase().includes(normalizedSearch) ||
          figurinha.numero.toLowerCase().includes(normalizedSearch);
        const matchesPais = !pais || getPaisAlbum(figurinha) === pais;
        const matchesCategoria = !categoria || figurinha.categoria === categoria;

        return matchesSearch && matchesPais && matchesCategoria;
      })
      .sort((a, b) => {
        if (ordenacao === "preco") return a.preco - b.preco;
        if (ordenacao === "pais") {
          const countryComparison = comparePaisAlbum(getPaisAlbum(a), getPaisAlbum(b));
          return countryComparison || compareFigurinhaNumero(a, b);
        }
        if (ordenacao === "numero") return compareFigurinhasByAlbum(a, b);

        return String(a[ordenacao]).localeCompare(String(b[ordenacao]), "pt-BR", { numeric: true });
      });
  }, [availableFigurinhas, busca, categoria, ordenacao, pais]);

  const groupedFigurinhas = useMemo(() => {
    const groups = new Map<string, Figurinha[]>();

    filteredFigurinhas.forEach((figurinha) => {
      const key = getPaisAlbum(figurinha);
      groups.set(key, [...(groups.get(key) ?? []), figurinha]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => comparePaisAlbum(a, b))
      .map(([country, items]) => ({
        country,
        items: [...items].sort((a, b) => {
          if (ordenacao === "nome") {
            return String(a.nome || a.numero).localeCompare(String(b.nome || b.numero), "pt-BR", { numeric: true });
          }

          return compareFigurinhaNumero(a, b);
        }),
      }));
  }, [filteredFigurinhas, ordenacao]);

  function toggleCountry(country: string) {
    setCollapsedCountries((current) => {
      const next = new Set(current);
      if (next.has(country)) {
        next.delete(country);
      } else {
        next.add(country);
      }
      return next;
    });
  }

  function toggleAllCountries() {
    const allVisibleCountriesCollapsed = groupedFigurinhas.every(({ country }) => collapsedCountries.has(country));

    if (allVisibleCountriesCollapsed) {
      setCollapsedCountries(new Set());
      return;
    }

    setCollapsedCountries(new Set(groupedFigurinhas.map(({ country }) => country)));
  }

  function renderCatalogContent() {
    if (filteredFigurinhas.length === 0) {
      return <div className="empty-state">Nenhuma figurinha encontrada com os filtros selecionados.</div>;
    }

    if (viewMode === "lista") {
      return (
        <div className="country-groups compact-country-groups">
          {groupedFigurinhas.map(({ country, items }) => {
            const isExpanded = !collapsedCountries.has(country);
            const disponiveis = items.filter((figurinha) => figurinha.disponivel && figurinha.quantidade > 0).length;
            const estoque = items.reduce((sum, figurinha) => sum + figurinha.quantidade, 0);

            return (
              <section className="country-group" key={country}>
                <HeaderPais
                  color={getCountryColor(country)}
                  disponiveis={disponiveis}
                  expanded={isExpanded}
                  nome={country}
                  onToggle={() => toggleCountry(country)}
                  total={items.length}
                  estoque={estoque}
                />
                {isExpanded ? (
                  <FigurinhaLista
                    figurinhas={items}
                    pendingStockIds={pendingStockIds}
                    onAddToCart={onAddToCart}
                  />
                ) : null}
              </section>
            );
          })}
        </div>
      );
    }

    if (viewMode === "pais") {
      return (
        <div className="country-groups">
          {groupedFigurinhas.map(({ country, items }) => (
            <GrupoPaisFigurinhas
              color={getCountryColor(country)}
              expanded={!collapsedCountries.has(country)}
              figurinhas={items}
              key={country}
              nome={country}
              pendingStockIds={pendingStockIds}
              onAddToCart={onAddToCart}
              onToggle={() => toggleCountry(country)}
            />
          ))}
        </div>
      );
    }

    return (
      <section className="catalog-grid" aria-label="Lista de figurinhas">
        {filteredFigurinhas.map((figurinha) => (
          <FigurinhaCard
            key={figurinha.id}
            figurinha={figurinha}
            isPending={pendingStockIds.has(figurinha.id)}
            onAddToCart={onAddToCart}
          />
        ))}
      </section>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Álbum completo começa aqui</p>
          <h1>Escolha suas figurinhas da Copa</h1>
          <p>Busque por número, filtre por seleção e monte seu pedido com controle automático de estoque.</p>
        </div>
        <div className="hero-logo">
          <img src={logoUrl} alt="Logo Figurinhas da Copa" />
        </div>
      </section>

      <CatalogoResumo figurinhas={availableFigurinhas} />

      <section className="catalog-controls">
        <SeletorVisualizacao mode={viewMode} onModeChange={setViewMode} />
        {(viewMode === "pais" || viewMode === "lista") && groupedFigurinhas.length > 0 ? (
          <button className="secondary-button collapse-countries-button" onClick={toggleAllCountries} type="button">
            {groupedFigurinhas.every(({ country }) => collapsedCountries.has(country))
              ? "Expandir países"
              : "Recolher países"}
          </button>
        ) : null}
      </section>

      <FiltrosCatalogo
        busca={busca}
        pais={pais}
        categoria={categoria}
        ordenacao={ordenacao}
        paises={paises}
        categorias={categorias}
        onBuscaChange={setBusca}
        onPaisChange={setPais}
        onCategoriaChange={setCategoria}
        onOrdenacaoChange={setOrdenacao}
      />

      {notice ? <div className="notice">{notice}</div> : null}

      {renderCatalogContent()}
    </main>
  );
}
