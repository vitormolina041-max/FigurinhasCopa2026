import type { Figurinha } from "../types/Figurinha";
import { sortFigurinhasByAlbum } from "../utils/figurinhaSorting";
import { normalizeFigurinha, normalizeFigurinhas } from "./storageService";

type BackupFile = {
  tipo: "figurinhas-da-copa-backup";
  versao: 1;
  exportadoEm: string;
  figurinhas: Figurinha[];
};

function downloadTextFile(content: string, fileName: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isBackupFile(value: unknown): value is Partial<BackupFile> {
  return Boolean(value && typeof value === "object" && "figurinhas" in value);
}

export const jsonBackupService = {
  exportFigurinhas(figurinhas: Figurinha[]) {
    const backup: BackupFile = {
      tipo: "figurinhas-da-copa-backup",
      versao: 1,
      exportadoEm: new Date().toISOString(),
      figurinhas: normalizeFigurinhas(figurinhas),
    };

    downloadTextFile(JSON.stringify(backup, null, 2), "backup-figurinhas.json");
  },

  async importFigurinhas(file: File, currentFigurinhas: Figurinha[]) {
    const text = await file.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("O arquivo JSON está inválido.");
    }

    const sourceFigurinhas = isBackupFile(parsed) ? parsed.figurinhas : parsed;
    const imported = normalizeFigurinhas(sourceFigurinhas);
    if (imported.length === 0) throw new Error("O backup não possui figurinhas válidas.");

    const byNumber = new Map(currentFigurinhas.map((figurinha) => [figurinha.numero.toLowerCase(), figurinha]));
    const next = [...currentFigurinhas];
    const alteradas: Figurinha[] = [];
    let criadas = 0;
    let atualizadas = 0;

    imported.forEach((figurinha) => {
      const existing = byNumber.get(figurinha.numero.toLowerCase());
      if (existing) {
        const restored = normalizeFigurinha({ ...figurinha, id: existing.id });
        const index = next.findIndex((item) => item.id === existing.id);
        next[index] = restored;
        alteradas.push(restored);
        atualizadas += 1;
        return;
      }

      const created = normalizeFigurinha({ ...figurinha, id: crypto.randomUUID() });
      next.unshift(created);
      alteradas.push(created);
      criadas += 1;
    });

    return {
      figurinhas: sortFigurinhasByAlbum(next),
      alteradas,
      criadas,
      atualizadas,
    };
  },
};
