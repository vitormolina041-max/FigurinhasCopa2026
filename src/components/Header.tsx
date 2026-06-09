import { LockKeyhole, ShoppingCart, Trophy } from "lucide-react";

type HeaderProps = {
  currentPath: string;
  cartCount: number;
  siteName: string;
  onNavigate: (path: string) => void;
};

export function Header({ currentPath, cartCount, siteName, onNavigate }: HeaderProps) {
  const links = [
    { path: "/", label: "Catálogo", icon: Trophy },
    { path: "/cart", label: "Carrinho", icon: ShoppingCart },
    { path: "/admin", label: "Admin", icon: LockKeyhole },
  ];

  return (
    <header className="site-header">
      <button className="brand" onClick={() => onNavigate("/")} type="button">
        <span className="brand-mark">FC</span>
        <span>{siteName}</span>
      </button>

      <nav className="nav-links" aria-label="Menu principal">
        {links.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={currentPath === path ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate(path)}
            type="button"
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            {path === "/cart" && cartCount > 0 ? <strong className="cart-badge">{cartCount}</strong> : null}
          </button>
        ))}
      </nav>
    </header>
  );
}
