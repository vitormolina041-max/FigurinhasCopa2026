import { FormEvent, useState } from "react";
import type { ConfiguracoesSistema } from "../types/ConfiguracoesSistema";

type AdminLoginProps = {
  configuracoes: ConfiguracoesSistema;
  onLogin: () => void;
};

export function AdminLogin({ configuracoes, onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (password === configuracoes.senhaAdmin) {
      sessionStorage.setItem("figurinhas-admin", "true");
      onLogin();
      return;
    }

    setMessage("Senha incorreta. Tente novamente.");
  }

  return (
    <main className="page-shell admin-login">
      <form className="admin-card login-card" onSubmit={handleLogin}>
        <p className="eyebrow">Área restrita</p>
        <h1>Admin</h1>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite a senha"
          />
        </label>
        {message ? <div className="notice error">{message}</div> : null}
        <button className="primary-button wide" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
