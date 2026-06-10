import { useMemo, useState } from "react";
import { CatalogoResumo } from "../components/CatalogoResumo";
import { FiltrosCatalogo } from "../components/FiltrosCatalogo";
import { FigurinhaCard } from "../components/FigurinhaCard";
import { FigurinhaLista } from "../components/FigurinhaLista";
import { GrupoPaisFigurinhas } from "../components/GrupoPaisFigurinhas";
import { SeletorVisualizacao, type CatalogViewMode } from "../components/SeletorVisualizacao";
import type { AvailabilityFilter, Figurinha, SortKey } from "../types/Figurinha";
import logoUrl from "./logo.png";

type CatalogoProps = {
  figurinhas: Figurinha[];
  notice: string;
  onAddToCart: (figurinha: Figurinha) => void;
};

const SEM_PAIS = "Sem país informado";
const COUNTRY_COLORS = ["#2fd06f", "#f0c85a", "#5bbcff", "#ff7e5e", "#b78cff", "#69e2c4", "#ffb357"];

function getPais(figurinha: Figurinha) {
  return figurinha.pais.trim() || SEM_PAIS;
}

function getCountryColor(country: string) {
  const total = [...country].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COUNTRY_COLORS[total % COUNTRY_COLORS.length];
}

export function Catalogo({ figurinhas, notice, onAddToCart }: CatalogoProps) {
  const [busca, setBusca] = useState("");
  const [pais, setPais] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponibilidade, setDisponibilidade] = useState<AvailabilityFilter>("todas");
  const [ordenacao, setOrdenacao] = useState<SortKey>("numero");
  const [viewMode, setViewMode] = useState<CatalogViewMode>("pais");
  const [collapsedCountries, setCollapsedCountries] = useState<Set<string>>(() => new Set());

  const paises = useMemo(
    () => Array.from(new Set(figurinhas.map(getPais))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [figurinhas],
  );

  const categorias = useMemo(
    () => Array.from(new Set(figurinhas.map((item) => item.categoria))).sort((a, b) => a.localeCompare(b)),
    [figurinhas],
  );

  const filteredFigurinhas = useMemo(() => {
    const normalizedSearch = busca.trim().toLowerCase();

    return [...figurinhas]
      .filter((figurinha) => {
        const matchesSearch =
          !normalizedSearch ||
          figurinha.nome.toLowerCase().includes(normalizedSearch) ||
          figurinha.numero.toLowerCase().includes(normalizedSearch);
        const matchesPais = !pais || getPais(figurinha) === pais;
        const matchesCategoria = !categoria || figurinha.categoria === categoria;
        const isAvailable = figurinha.disponivel && figurinha.quantidade > 0;
        const matchesAvailability =
          disponibilidade === "todas" ||
          (disponibilidade === "disponiveis" && isAvailable) ||
          (disponibilidade === "esgotadas" && !isAvailable);

        return matchesSearch && matchesPais && matchesCategoria && matchesAvailability;
      })
      .sort((a, b) => {
        if (ordenacao === "preco") return a.preco - b.preco;
        const first = ordenacao === "pais" ? getPais(a) : String(a[ordenacao]);
        const second = ordenacao === "pais" ? getPais(b) : String(b[ordenacao]);
        return first.localeCompare(second, "pt-BR", { numeric: true });
      });
  }, [busca, categoria, disponibilidade, figurinhas, ordenacao, pais]);

  const groupedFigurinhas = useMemo(() => {
    const groups = new Map<string, Figurinha[]>();

    filteredFigurinhas.forEach((figurinha) => {
      const key = getPais(figurinha);
      groups.set(key, [...(groups.get(key) ?? []), figurinha]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([country, items]) => ({
        country,
        items: [...items].sort((a, b) => {
          const sortKey = ordenacao === "nome" ? "nome" : "numero";
          return String(a[sortKey] || a.numero).localeCompare(String(b[sortKey] || b.numero), "pt-BR", {
            numeric: true,
          });
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

  function renderCatalogContent() {
    if (filteredFigurinhas.length === 0) {
      return <div className="empty-state">Nenhuma figurinha encontrada com os filtros selecionados.</div>;
    }

    if (viewMode === "lista") {
      return <FigurinhaLista figurinhas={filteredFigurinhas} onAddToCart={onAddToCart} />;
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
          <FigurinhaCard key={figurinha.id} figurinha={figurinha} onAddToCart={onAddToCart} />
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

      <CatalogoResumo figurinhas={figurinhas} />

      <section className="catalog-controls">
        <SeletorVisualizacao mode={viewMode} onModeChange={setViewMode} />
      </section>

      <FiltrosCatalogo
        busca={busca}
        pais={pais}
        categoria={categoria}
        disponibilidade={disponibilidade}
        ordenacao={ordenacao}
        paises={paises}
        categorias={categorias}
        onBuscaChange={setBusca}
        onPaisChange={setPais}
        onCategoriaChange={setCategoria}
        onDisponibilidadeChange={setDisponibilidade}
        onOrdenacaoChange={setOrdenacao}
      />

      {notice ? <div className="notice">{notice}</div> : null}

      {renderCatalogContent()}
    </main>
  );
}
