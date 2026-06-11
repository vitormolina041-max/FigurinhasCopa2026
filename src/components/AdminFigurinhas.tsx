import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Download, Edit3, FileSpreadsheet, Plus, Search, Trash2, Upload } from "lucide-react";
import type { Figurinha } from "../types/Figurinha";
import { databaseService } from "../services/databaseService";
import { excelService } from "../services/excelService";
import { jsonBackupService } from "../services/jsonBackupService";
import { normalizeFigurinha } from "../services/storageService";
import { comparePais, sortFigurinhasByAlbum } from "../utils/figurinhaSorting";
import { formatCurrency } from "../utils/whatsapp";

type AdminFigurinhasProps = {
  figurinhas: Figurinha[];
  setFigurinhas: React.Dispatch<React.SetStateAction<Figurinha[]>>;
  onMessage: (message: string) => void;
};

type FormState = Omit<Figurinha, "id">;

const emptyForm: FormState = {
  numero: "",
  nome: "",
  pais: "",
  categoria: "",
  preco: 0,
  quantidade: 0,
  imagemUrl: "",
  disponivel: true,
};

export function AdminFigurinhas({ figurinhas, setFigurinhas, onMessage }: AdminFigurinhasProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [paisFilter, setPaisFilter] = useState("");
  const [quickEditValues, setQuickEditValues] = useState<Record<string, { preco: string; quantidade: string }>>({});

  const paises = useMemo(
    () => Array.from(new Set(figurinhas.map((item) => item.pais))).sort(comparePais),
    [figurinhas],
  );

  const filteredFigurinhas = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sortFigurinhasByAlbum(figurinhas).filter((figurinha) => {
      const matchesQuery =
        !normalized ||
        figurinha.nome.toLowerCase().includes(normalized) ||
        figurinha.numero.toLowerCase().includes(normalized);
      return matchesQuery && (!paisFilter || figurinha.pais === paisFilter);
    });
  }, [figurinhas, paisFilter, query]);

  function updateForm<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function persistUpsertFigurinhas(
    nextFigurinhas: Figurinha[],
    changedFigurinhas: Figurinha[],
    successMessage: string,
  ) {
    try {
      if (databaseService.isEnabled) {
        await databaseService.upsertFigurinhas(changedFigurinhas);
      }
      setFigurinhas(sortFigurinhasByAlbum(nextFigurinhas));
      onMessage(successMessage);
      return true;
    } catch (error) {
      console.error("Erro ao salvar figurinhas", error);
      onMessage(error instanceof Error ? error.message : "Não foi possível salvar as figurinhas.");
      return false;
    }
  }

  async function persistDeleteFigurinha(nextFigurinhas: Figurinha[], figurinhaId: string, successMessage: string) {
    try {
      if (databaseService.isEnabled) {
        await databaseService.deleteFigurinha(figurinhaId);
      }
      setFigurinhas(nextFigurinhas);
      onMessage(successMessage);
      return true;
    } catch (error) {
      console.error("Erro ao excluir figurinha", error);
      onMessage(error instanceof Error ? error.message : "Não foi possível excluir a figurinha.");
      return false;
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.numero.trim() || !form.pais.trim() || !form.categoria.trim()) {
      onMessage("Preencha número, país e categoria.");
      return;
    }

    const normalizedForm = normalizeFigurinha({
      ...form,
      id: editingId ?? crypto.randomUUID(),
      numero: form.numero.trim(),
      nome: form.nome.trim(),
      pais: form.pais.trim(),
      categoria: form.categoria.trim(),
      imagemUrl: form.imagemUrl?.trim(),
      preco: Number(form.preco),
      quantidade: Number(form.quantidade),
    });

    const duplicate = figurinhas.find(
      (figurinha) =>
        figurinha.numero.toLowerCase() === normalizedForm.numero.toLowerCase() && figurinha.id !== editingId,
    );

    if (duplicate) {
      onMessage(`Já existe uma figurinha cadastrada com o número ${normalizedForm.numero}.`);
      return;
    }

    const nextFigurinhas = editingId
      ? figurinhas.map((figurinha) => (figurinha.id === editingId ? normalizedForm : figurinha))
      : sortFigurinhasByAlbum([normalizedForm, ...figurinhas]);

    if (editingId) {
      if (!(await persistUpsertFigurinhas(nextFigurinhas, [normalizedForm], "Figurinha atualizada."))) return;
    } else {
      if (!(await persistUpsertFigurinhas(nextFigurinhas, [normalizedForm], "Figurinha cadastrada."))) return;
    }

    resetForm();
  }

  function startEditing(figurinha: Figurinha) {
    setEditingId(figurinha.id);
    setForm({
      numero: figurinha.numero,
      nome: figurinha.nome,
      pais: figurinha.pais,
      categoria: figurinha.categoria,
      preco: figurinha.preco,
      quantidade: figurinha.quantidade,
      imagemUrl: figurinha.imagemUrl ?? "",
      disponivel: figurinha.quantidade > 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteFigurinha(figurinha: Figurinha) {
    if (!window.confirm(`Excluir a figurinha ${figurinha.numero} - ${figurinha.nome}?`)) return;

    await persistDeleteFigurinha(
      figurinhas.filter((item) => item.id !== figurinha.id),
      figurinha.id,
      "Figurinha excluída.",
    );
  }

  async function duplicateFigurinha(figurinha: Figurinha) {
    const duplicateNumber = `${figurinha.numero}-COPIA`;
    const nextNumber = figurinhas.some((item) => item.numero.toLowerCase() === duplicateNumber.toLowerCase())
      ? `${figurinha.numero}-COPIA-${Date.now()}`
      : duplicateNumber;
    const duplicated = normalizeFigurinha({
      ...figurinha,
      id: crypto.randomUUID(),
      numero: nextNumber,
      quantidade: 0,
    });

    await persistUpsertFigurinhas(sortFigurinhasByAlbum([duplicated, ...figurinhas]), [duplicated], "Figurinha duplicada.");
  }

  async function quickUpdateFigurinha(figurinha: Figurinha, patch: Partial<Pick<Figurinha, "preco" | "quantidade">>) {
    const updated = normalizeFigurinha({
      ...figurinha,
      ...patch,
    });

    await persistUpsertFigurinhas(
      sortFigurinhasByAlbum(figurinhas.map((item) => (item.id === figurinha.id ? updated : item))),
      [updated],
      "Figurinha atualizada.",
    );
  }

  function getQuickEditValue(figurinha: Figurinha, field: "preco" | "quantidade") {
    return quickEditValues[figurinha.id]?.[field] ?? String(figurinha[field]);
  }

  function setQuickEditValue(figurinhaId: string, field: "preco" | "quantidade", value: string) {
    setQuickEditValues((current) => ({
      ...current,
      [figurinhaId]: {
        preco: current[figurinhaId]?.preco ?? String(figurinhas.find((item) => item.id === figurinhaId)?.preco ?? 0),
        quantidade:
          current[figurinhaId]?.quantidade ??
          String(figurinhas.find((item) => item.id === figurinhaId)?.quantidade ?? 0),
        [field]: value,
      },
    }));
  }

  async function commitQuickEdit(figurinha: Figurinha) {
    const values = quickEditValues[figurinha.id];
    if (!values) return;

    const preco = Number(values.preco);
    const quantidade = Number(values.quantidade);
    if (!Number.isFinite(preco) || preco < 0 || !Number.isInteger(quantidade) || quantidade < 0) {
      onMessage("Preço deve ser maior ou igual a zero e estoque deve ser inteiro.");
      return;
    }

    if (preco === figurinha.preco && quantidade === figurinha.quantidade) return;
    await quickUpdateFigurinha(figurinha, { preco, quantidade });
    setQuickEditValues((current) => {
      const next = { ...current };
      delete next[figurinha.id];
      return next;
    });
  }

  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await excelService.importFigurinhas(file, figurinhas);
      await persistUpsertFigurinhas(
        result.figurinhas,
        result.alteradas,
        `Planilha importada com sucesso. Criadas: ${result.criadas}. Atualizadas: ${result.atualizadas}.`,
      );
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Não foi possível importar a planilha.");
    } finally {
      event.target.value = "";
    }
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await jsonBackupService.importFigurinhas(file, figurinhas);
      await persistUpsertFigurinhas(
        result.figurinhas,
        result.alteradas,
        `Backup JSON restaurado. Criadas: ${result.criadas}. Atualizadas: ${result.atualizadas}.`,
      );
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Não foi possível restaurar o backup JSON.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <>
      <section className="admin-grid">
        <form className="admin-card form-grid" onSubmit={handleSubmit}>
          <h2>{editingId ? "Editar figurinha" : "Nova figurinha"}</h2>

          <label>
            Número
            <input value={form.numero} onChange={(event) => updateForm("numero", event.target.value)} />
          </label>
          <label>
            Nome (opcional)
            <input value={form.nome} onChange={(event) => updateForm("nome", event.target.value)} />
          </label>
          <label>
            País
            <input value={form.pais} onChange={(event) => updateForm("pais", event.target.value)} />
          </label>
          <label>
            Categoria
            <input value={form.categoria} onChange={(event) => updateForm("categoria", event.target.value)} />
          </label>
          <label>
            Preço
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.preco}
              onChange={(event) => updateForm("preco", Number(event.target.value))}
            />
          </label>
          <label>
            Quantidade
            <input
              min="0"
              type="number"
              value={form.quantidade}
              onChange={(event) =>
                setForm((current) => {
                  const quantidade = Number(event.target.value);
                  return { ...current, quantidade, disponivel: quantidade > 0 };
                })
              }
            />
          </label>
          <label className="full-field">
            URL da imagem
            <input value={form.imagemUrl} onChange={(event) => updateForm("imagemUrl", event.target.value)} />
          </label>
          <label className="checkbox-field">
            <input
              checked={form.quantidade > 0 && form.disponivel}
              disabled={form.quantidade === 0}
              type="checkbox"
              onChange={(event) => updateForm("disponivel", event.target.checked)}
            />
            Disponível
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              <Plus size={18} aria-hidden="true" />
              {editingId ? "Salvar" : "Cadastrar"}
            </button>
            {editingId ? (
              <button className="secondary-button" onClick={resetForm} type="button">
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        <section className="admin-card">
          <h2>Planilhas</h2>
          <div className="backup-actions">
            <button className="secondary-button" onClick={() => excelService.exportFigurinhas(figurinhas)} type="button">
              <Download size={18} aria-hidden="true" />
              Exportar Excel
            </button>
            <button className="secondary-button" onClick={() => excelService.downloadTemplate()} type="button">
              <FileSpreadsheet size={18} aria-hidden="true" />
              Baixar modelo
            </button>
            <label className="file-button">
              <Upload size={18} aria-hidden="true" />
              Importar Excel
              <input accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" type="file" onChange={importExcel} />
            </label>
            <button className="secondary-button" onClick={() => jsonBackupService.exportFigurinhas(figurinhas)} type="button">
              <Download size={18} aria-hidden="true" />
              Exportar JSON
            </button>
            <label className="file-button">
              <Upload size={18} aria-hidden="true" />
              Restaurar JSON
              <input accept=".json,application/json" type="file" onChange={importJson} />
            </label>
          </div>
        </section>
      </section>

      <section className="admin-card">
        <div className="admin-toolbar">
          <label>
            <Search size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar por nome ou número"
            />
          </label>
          <select value={paisFilter} onChange={(event) => setPaisFilter(event.target.value)}>
            <option value="">Todos os países</option>
            {paises.map((pais) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </select>
        </div>

        {filteredFigurinhas.length === 0 ? (
          <div className="empty-state">Nenhuma figurinha encontrada na administração.</div>
        ) : (
          <div className="admin-table">
            {filteredFigurinhas.map((figurinha) => (
              <article className="admin-row" key={figurinha.id}>
                <div>
                  <strong>
                    {figurinha.numero}
                    {figurinha.nome ? ` · ${figurinha.nome}` : ""}
                  </strong>
                  <span>
                    {figurinha.pais} · {figurinha.categoria} · {formatCurrency(figurinha.preco)} · Estoque:{" "}
                    {figurinha.quantidade} · {figurinha.quantidade > 0 ? "Disponível" : "Esgotada"}
                  </span>
                  <div className="quick-edit-row">
                    <label>
                      Preço
                      <input
                        min="0"
                        step="0.01"
                        type="number"
                        value={getQuickEditValue(figurinha, "preco")}
                        onBlur={() => commitQuickEdit(figurinha)}
                        onChange={(event) => setQuickEditValue(figurinha.id, "preco", event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />
                    </label>
                    <label>
                      Estoque
                      <input
                        min="0"
                        type="number"
                        value={getQuickEditValue(figurinha, "quantidade")}
                        onBlur={() => commitQuickEdit(figurinha)}
                        onChange={(event) => setQuickEditValue(figurinha.id, "quantidade", event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="row-actions">
                  <button className="secondary-button icon-text" onClick={() => duplicateFigurinha(figurinha)} type="button">
                    <Plus size={16} aria-hidden="true" />
                    Duplicar
                  </button>
                  <button className="secondary-button icon-text" onClick={() => startEditing(figurinha)} type="button">
                    <Edit3 size={16} aria-hidden="true" />
                    Editar
                  </button>
                  <button className="danger-button icon-text" onClick={() => deleteFigurinha(figurinha)} type="button">
                    <Trash2 size={16} aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
