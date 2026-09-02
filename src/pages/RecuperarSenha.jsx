import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { inputStyle } from "../components/ui.jsx";

export default function RecuperarSenha() {
  const { solicitarRecuperacao } = useAuth();
  const { escritorio } = useApp();
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const res = solicitarRecuperacao(email);
    setMensagem(res.mensagem);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0E1420", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form
        onSubmit={submit}
        style={{ width: 380, maxWidth: "100%", background: "#fff", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>Recuperar senha</div>
        <div style={{ fontSize: 12.5, color: "#6B7480" }}>
          Digite seu e-mail. Enviamos um link de recuperação válido por 1 hora (token expirável, uso único).
        </div>

        {mensagem ? (
          <div style={{ background: "#EAF6EE", color: "#1F6F4C", borderRadius: 8, padding: "12px 13px", fontSize: 12.5 }}>{mensagem}</div>
        ) : (
          <>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11.5, color: "#6B7480", textTransform: "uppercase" }}>E-mail</span>
              <TrackedInput tag="recuperar_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
            </label>
            <Tracked as="button" tag="recuperar_submit" type="submit" className="ol-btn-primary" style={{ padding: 12, borderRadius: 8, background: escritorio.corPrimaria, color: "#fff", fontSize: 14, fontWeight: 600 }}>
              Enviar link
            </Tracked>
          </>
        )}

        <Link to="/login" data-track="recuperar_voltar_login" style={{ fontSize: 12.5, textAlign: "center" }}>
          Voltar para o login
        </Link>
      </form>
    </div>
  );
}
