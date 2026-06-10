import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import type { ConfiguracoesSistema } from "../types/ConfiguracoesSistema";
import { databaseService } from "../services/databaseService";

type AdminConfiguracoesProps = {
  configuracoes: ConfiguracoesSistema;
  setConfiguracoes: React.Dispatch<React.SetStateAction<ConfiguracoesSistema>>;
  onMessage: (message: string) => void;
};

export function AdminConfiguracoes({
  configuracoes,
  setConfiguracoes,
  onMessage,
}: AdminConfiguracoesProps) {
  const [form, setForm] = useState(configuracoes);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const whatsapp = form.whatsapp.replace(/\D/g, "");
    const senhaAdmin = form.senhaAdmin.trim();
    const nomeSite = form.nomeSite.trim();

    if (!whatsapp) {
      onMessage("WhatsApp é obrigatório e deve conter apenas números.");
      return;
    }

    if (senhaAdmin.length < 4) {
      onMessage("A senha do administrador deve ter pelo menos 4 caracteres.");
      return;
    }

    if (!nomeSite) {
      onMessage("O nome do site é obrigatório.");
      return;
    }

    const nextConfiguracoes = { whatsapp, senhaAdmin, nomeSite };

    try {
      if (databaseService.isEnabled) {
        await databaseService.saveConfiguracoes(nextConfiguracoes);
      }
      setConfiguracoes(nextConfiguracoes);
      setForm(nextConfiguracoes);
      onMessage("Configurações salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar configurações", error);
      onMessage(error instanceof Error ? error.message : "Não foi possível salvar as configurações.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Configurações</h2>
      <form className="settings-grid" onSubmit={handleSubmit}>
        <label>
          Nome do site
          <input
            value={form.nomeSite}
            onChange={(event) => setForm((current) => ({ ...current, nomeSite: event.target.value }))}
          />
        </label>
        <label>
          WhatsApp
          <input
            inputMode="numeric"
            value={form.whatsapp}
            onChange={(event) =>
              setForm((current) => ({ ...current, whatsapp: event.target.value.replace(/\D/g, "") }))
            }
          />
        </label>
        <label>
          Senha do administrador
          <input
            type="password"
            value={form.senhaAdmin}
            onChange={(event) => setForm((current) => ({ ...current, senhaAdmin: event.target.value }))}
          />
        </label>
        <button className="primary-button" type="submit">
          <Save size={18} aria-hidden="true" />
          Salvar configurações
        </button>
      </form>
    </section>
  );
}
