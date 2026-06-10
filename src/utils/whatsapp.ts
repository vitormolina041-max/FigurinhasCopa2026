import type { CartItem, Figurinha } from "../types/Figurinha";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getPais(figurinha: Figurinha) {
  return figurinha.pais.trim() || "Sem país informado";
}

export function buildWhatsAppUrl(items: CartItem[], figurinhas: Figurinha[], whatsapp: string) {
  const detailedItems = items
    .map((item) => {
      const figurinha = figurinhas.find((current) => current.id === item.figurinhaId);
      if (!figurinha) return null;

      return {
        item,
        figurinha,
        subtotal: figurinha.preco * item.quantidade,
      };
    })
    .filter((entry): entry is { item: CartItem; figurinha: Figurinha; subtotal: number } => Boolean(entry));

  const groups = new Map<string, typeof detailedItems>();
  detailedItems.forEach((entry) => {
    const pais = getPais(entry.figurinha);
    groups.set(pais, [...(groups.get(pais) ?? []), entry]);
  });

  const total = detailedItems.reduce((sum, entry) => sum + entry.subtotal, 0);
  const totalItems = detailedItems.reduce((sum, entry) => sum + entry.item.quantidade, 0);
  const messageLines = [
    "Olá! Quero finalizar este pedido de figurinhas:",
    "",
    `Total de itens: ${totalItems}`,
    `Valor total: ${formatCurrency(total)}`,
    "",
    "Itens por país/time:",
  ];

  Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .forEach(([pais, entries]) => {
      const groupTotal = entries.reduce((sum, entry) => sum + entry.subtotal, 0);
      messageLines.push("", `${pais} - ${formatCurrency(groupTotal)}`);

      entries.forEach(({ item, figurinha, subtotal }) => {
        messageLines.push(
          `- ${figurinha.numero} | ${figurinha.nome || "Sem nome"} | ${figurinha.categoria} | Qtd: ${
            item.quantidade
          } | Unit.: ${formatCurrency(figurinha.preco)} | Subtotal: ${formatCurrency(subtotal)}`,
        );
      });
    });

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(messageLines.join("\n"))}`;
}
