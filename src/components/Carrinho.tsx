import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem, Figurinha } from "../types/Figurinha";
import { buildWhatsAppUrl, formatCurrency } from "../utils/whatsapp";

type CarrinhoProps = {
  cart: CartItem[];
  figurinhas: Figurinha[];
  notice: string;
  whatsapp: string;
  setNotice: (value: string) => void;
  updateQuantity: (figurinhaId: string, quantity: number) => void;
  removeFromCart: (figurinhaId: string) => void;
};

export function Carrinho({
  cart,
  figurinhas,
  notice,
  whatsapp,
  setNotice,
  updateQuantity,
  removeFromCart,
}: CarrinhoProps) {
  const detailedItems = cart
    .map((item) => ({
      item,
      figurinha: figurinhas.find((current) => current.id === item.figurinhaId),
    }))
    .filter((entry): entry is { item: CartItem; figurinha: Figurinha } => Boolean(entry.figurinha));

  const totalItems = detailedItems.reduce((sum, entry) => sum + entry.item.quantidade, 0);
  const totalPrice = detailedItems.reduce(
    (sum, entry) => sum + entry.item.quantidade * entry.figurinha.preco,
    0,
  );

  function finishOrder() {
    if (detailedItems.length === 0) {
      setNotice("Seu carrinho está vazio. Adicione figurinhas antes de finalizar.");
      return;
    }

    window.location.href = buildWhatsAppUrl(
      detailedItems.map((entry) => entry.item),
      figurinhas,
      whatsapp,
    );
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Pedido</p>
        <h1>Carrinho</h1>
        <p>Confira quantidades, estoque disponível e total antes de enviar o pedido pelo WhatsApp.</p>
      </section>

      {notice ? <div className="notice">{notice}</div> : null}

      {detailedItems.length === 0 ? (
        <div className="empty-state">Seu carrinho está vazio.</div>
      ) : (
        <section className="cart-layout">
          <div className="cart-list">
            {detailedItems.map(({ item, figurinha }) => (
              <article className="cart-item" key={figurinha.id}>
                <div>
                  <p className="sticker-number">{figurinha.numero}</p>
                  <h2>{figurinha.nome}</h2>
                  <p>
                    {figurinha.pais} · {figurinha.categoria} · Estoque: {figurinha.quantidade}
                  </p>
                </div>

                <div className="quantity-controls">
                  <button
                    aria-label="Diminuir quantidade"
                    onClick={() => updateQuantity(figurinha.id, item.quantidade - 1)}
                    type="button"
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span>{item.quantidade}</span>
                  <button
                    aria-label="Aumentar quantidade"
                    onClick={() => updateQuantity(figurinha.id, item.quantidade + 1)}
                    type="button"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Remover item"
                    className="danger-icon"
                    onClick={() => removeFromCart(figurinha.id)}
                    type="button"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>

                <strong>{formatCurrency(figurinha.preco * item.quantidade)}</strong>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <span>Total de itens</span>
            <strong>{totalItems}</strong>
            <span>Valor total</span>
            <strong>{formatCurrency(totalPrice)}</strong>
            <button className="checkout-button" onClick={finishOrder} type="button">
              Finalizar pedido pelo WhatsApp
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}
