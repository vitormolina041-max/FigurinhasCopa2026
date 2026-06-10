import type { CartItem, Figurinha } from "../types/Figurinha";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function buildWhatsAppUrl(items: CartItem[], figurinhas: Figurinha[], whatsapp: string) {
  const lines = items
    .map((item) => {
      const figurinha = figurinhas.find((current) => current.id === item.figurinhaId);
      if (!figurinha) return null;

      const subtotal = figurinha.preco * item.quantidade;
      return `- ${figurinha.nome || figurinha.numero} | Número: ${figurinha.numero} | País: ${figurinha.pais} | Categoria: ${figurinha.categoria} | Quantidade: ${item.quantidade} | Unitário: ${formatCurrency(figurinha.preco)} | Total: ${formatCurrency(subtotal)}`;
    })
    .filter(Boolean);

  const total = items.reduce((sum, item) => {
    const figurinha = figurinhas.find((current) => current.id === item.figurinhaId);
    return sum + (figurinha ? figurinha.preco * item.quantidade : 0);
  }, 0);

  const message = [
    "Olá! Quero finalizar este pedido de figurinhas:",
    "",
    ...lines,
    "",
    `Valor total: ${formatCurrency(total)}`,
  ].join("\n");

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
