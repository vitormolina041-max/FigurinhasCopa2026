import { useState } from "react";
import { LogOut } from "lucide-react";
import { AdminConfiguracoes } from "../components/AdminConfiguracoes";
import { AdminFigurinhas } from "../components/AdminFigurinhas";
import { AdminLogin } from "../components/AdminLogin";
import type { Figurinha } from "../types/Figurinha";
import type { ConfiguracoesSistema } from "../types/ConfiguracoesSistema";

type AdminProps = {
  configuracoes: ConfiguracoesSistema;
  figurinhas: Figurinha[];
  setConfiguracoes: React.Dispatch<React.SetStateAction<ConfiguracoesSistema>>;
  setFigurinhas: React.Dispatch<React.SetStateAction<Figurinha[]>>;
};

export function Admin({ configuracoes, figurinhas, setConfiguracoes, setFigurinhas }: AdminProps) {
  const [isLogged, setIsLogged] = useState(() => sessionStorage.getItem("figurinhas-admin") === "true");
  const [message, setMessage] = useState("");

  function logout() {
    sessionStorage.removeItem("figurinhas-admin");
    setIsLogged(false);
    setMessage("");
  }

  if (!isLogged) {
    return <AdminLogin configuracoes={configuracoes} onLogin={() => setIsLogged(true)} />;
  }

  return (
    <main className="page-shell admin-page">
      <section className="page-heading admin-heading">
        <div>
          <p className="eyebrow">Estoque protegido</p>
          <h1>Administração</h1>
          <p>Cadastre figurinhas, ajuste estoque, importe planilhas e configure o site.</p>
        </div>
        <button className="secondary-button" onClick={logout} type="button">
          <LogOut size={18} aria-hidden="true" />
          Sair
        </button>
      </section>

      {message ? <div className="notice">{message}</div> : null}

      <AdminConfiguracoes
        configuracoes={configuracoes}
        setConfiguracoes={setConfiguracoes}
        onMessage={setMessage}
      />

      <AdminFigurinhas figurinhas={figurinhas} setFigurinhas={setFigurinhas} onMessage={setMessage} />
    </main>
  );
}
