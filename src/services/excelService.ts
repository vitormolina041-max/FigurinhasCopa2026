import * as XLSX from "xlsx";
import type { Figurinha } from "../types/Figurinha";
import { normalizeFigurinha } from "./storageService";

type ExcelRow = {
  numero?: string;
  nome?: string;
  pais?: string;
  categoria?: string;
  preco?: number | string;
  quantidade?: number | string;
  imagemUrl?: string;
  disponivel?: boolean | string;
};

export type ImportFigurinhasResult = {
  figurinhas: Figurinha[];
  alteradas: Figurinha[];
  criadas: number;
  atualizadas: number;
};

const COLUMNS = ["numero", "nome", "pais", "categoria", "preco", "quantidade", "imagemUrl", "disponivel"];

function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(workbook, fileName);
}

function toExcelRows(figurinhas: Figurinha[]) {
  return figurinhas.map((figurinha) => ({
    numero: figurinha.numero,
    nome: figurinha.nome,
    pais: figurinha.pais,
    categoria: figurinha.categoria,
    preco: figurinha.preco,
    quantidade: figurinha.quantidade,
    imagemUrl: figurinha.imagemUrl ?? "",
    disponivel: figurinha.quantidade > 0,
  }));
}

function makeWorkbook(rows: ExcelRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Figurinhas");
  return workbook;
}

function parseDisponivel(value: ExcelRow["disponivel"], quantidade: number) {
  if (quantidade === 0) return false;
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return quantidade > 0;

  const normalized = value.trim().toLowerCase();
  if (["true", "sim", "s", "yes"].includes(normalized)) return true;
  if (["false", "nao", "não", "n", "no"].includes(normalized)) return false;
  return quantidade > 0;
}

function requiredText(value: unknown, field: string, rowNumber: number) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`Linha ${rowNumber}: campo obrigatório ausente: ${field}.`);
  return text;
}

function optionalText(value: unknown) {
  return String(value ?? "").trim();
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  const raw = String(value ?? "").trim();
  const normalized =
    raw.includes(",") && raw.includes(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(",", ".");

  return Number(normalized);
}

function requiredNumber(value: unknown, field: string, rowNumber: number) {
  const number = parseNumber(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Linha ${rowNumber}: campo ${field} deve ser um número maior ou igual a zero.`);
  }
  return number;
}

function requiredInteger(value: unknown, field: string, rowNumber: number) {
  const number = requiredNumber(value, field, rowNumber);
  if (!Number.isInteger(number)) {
    throw new Error(`Linha ${rowNumber}: campo ${field} deve ser um número inteiro.`);
  }
  return number;
}

export const excelService = {
  exportFigurinhas(figurinhas: Figurinha[]) {
    downloadWorkbook(makeWorkbook(toExcelRows(figurinhas)), "estoque-figurinhas.xlsx");
  },

  downloadTemplate() {
    downloadWorkbook(
      makeWorkbook([
        {
          numero: "BRA-001",
          nome: "Exemplo Brasil",
          pais: "Brasil",
          categoria: "Jogador",
          preco: 5,
          quantidade: 10,
          imagemUrl: "",
          disponivel: "sim",
        },
      ]),
      "modelo-estoque-figurinhas.xlsx",
    );
  },

  async importFigurinhas(file: File, currentFigurinhas: Figurinha[]) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) throw new Error("A planilha não possui abas.");

    const rows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[firstSheet], { defval: "" });
    if (rows.length === 0) throw new Error("A planilha está vazia.");

    const errors: string[] = [];
    const imported = rows
      .map((row, index) => {
        try {
          const rowNumber = index + 2;
          const quantidade = requiredInteger(row.quantidade, "quantidade", rowNumber);
          const disponivel = parseDisponivel(row.disponivel, quantidade);

          return normalizeFigurinha({
            id: "",
            numero: requiredText(row.numero, "numero", rowNumber),
            nome: optionalText(row.nome),
            pais: requiredText(row.pais, "pais", rowNumber),
            categoria: requiredText(row.categoria, "categoria", rowNumber),
            preco: requiredNumber(row.preco, "preco", rowNumber),
            quantidade,
            imagemUrl: String(row.imagemUrl ?? "").trim(),
            disponivel,
          });
        } catch (error) {
          errors.push(error instanceof Error ? error.message : `Linha ${index + 2}: erro desconhecido.`);
          return null;
        }
      })
      .filter((figurinha): figurinha is Figurinha => Boolean(figurinha));

    const repeatedNumbers = new Set<string>();
    const seenNumbers = new Set<string>();
    imported.forEach((figurinha) => {
      const normalizedNumber = figurinha.numero.toLowerCase();
      if (seenNumbers.has(normalizedNumber)) repeatedNumbers.add(figurinha.numero);
      seenNumbers.add(normalizedNumber);
    });

    repeatedNumbers.forEach((numero) => {
      errors.push(`Número duplicado na planilha: ${numero}.`);
    });

    if (errors.length > 0) {
      throw new Error(`A planilha possui erros:\n${errors.slice(0, 8).join("\n")}`);
    }

    const byNumber = new Map(currentFigurinhas.map((figurinha) => [figurinha.numero.toLowerCase(), figurinha]));
    const next = [...currentFigurinhas];
    const alteradas: Figurinha[] = [];
    let criadas = 0;
    let atualizadas = 0;

    imported.forEach((figurinha) => {
      const existing = byNumber.get(figurinha.numero.toLowerCase());
      if (existing) {
        const index = next.findIndex((item) => item.id === existing.id);
        const updatedFigurinha = { ...figurinha, id: existing.id };
        next[index] = updatedFigurinha;
        alteradas.push(updatedFigurinha);
        atualizadas += 1;
        return;
      }

      const createdFigurinha = { ...figurinha, id: crypto.randomUUID() };
      next.unshift(createdFigurinha);
      alteradas.push(createdFigurinha);
      criadas += 1;
    });

    return {
      figurinhas: next,
      alteradas,
      criadas,
      atualizadas,
    };
  },
};
