import { useMemo, useState } from "react";
import { FiltrosCatalogo } from "../components/FiltrosCatalogo";
import { FigurinhaCard } from "../components/FigurinhaCard";
import type { AvailabilityFilter, Figurinha, SortKey } from "../types/Figurinha";
import logoUrl from "./logo.png";

type CatalogoProps = {
  figurinhas: Figurinha[];
  notice: string;
  onAddToCart: (figurinha: Figurinha) => void;
};

export function Catalogo({ figurinhas, notice, onAddToCart }: CatalogoProps) {
  const [busca, setBusca] = useState("");
  const [pais, setPais] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponibilidade, setDisponibilidade] = useState<AvailabilityFilter>("todas");
  const [ordenacao, setOrdenacao] = useState<SortKey>("numero");

  const paises = useMemo(
    () => Array.from(new Set(figurinhas.map((item) => item.pais))).sort((a, b) => a.localeCompare(b)),
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
        const matchesPais = !pais || figurinha.pais === pais;
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
        return String(a[ordenacao]).localeCompare(String(b[ordenacao]), "pt-BR", { numeric: true });
      });
  }, [busca, categoria, disponibilidade, figurinhas, ordenacao, pais]);

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Álbum completo começa aqui</p>
          <h1>Escolha suas figurinhas da Copa</h1>
          <p>
            Busque por número, filtre por seleção e monte seu pedido com controle automático de estoque.
          </p>
        </div>
        <div className="hero-logo">
          <img src={logoUrl} alt="Logo Figurinhas da Copa" />
        </div>
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

      {filteredFigurinhas.length === 0 ? (
        <div className="empty-state">Nenhuma figurinha encontrada com os filtros atuais.</div>
      ) : (
        <section className="catalog-grid" aria-label="Lista de figurinhas">
          {filteredFigurinhas.map((figurinha) => (
            <FigurinhaCard key={figurinha.id} figurinha={figurinha} onAddToCart={onAddToCart} />
          ))}
        </section>
      )}
    </main>
  );
}
