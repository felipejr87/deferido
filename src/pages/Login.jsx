import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { inputStyle } from "../components/ui.jsx";

export default function Login() {
  const { login } = useAuth();
  const { escritorio } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("felipe@openlegaliza.com.br");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const res = login(email, senha);
    if (res.ok) navigate("/");
    else setErro(res.error);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0E1420", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form
        onSubmit={submit}
        style={{ width: 380, maxWidth: "100%", background: "#fff", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: escritorio.corPrimaria, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
            OL
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{escritorio.nome}</div>
            <div style={{ fontSize: 11.5, color: "#8A929E" }}>Entrar no sistema</div>
          </div>
        </div>

        {erro && (
          <div style={{ background: "#FBEDEC", color: "#A33F36", borderRadius: 8, padding: "10px 12px", fontSize: 12.5 }}>{erro}</div>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11.5, color: "#6B7480", textTransform: "uppercase" }}>E-mail</span>
          <TrackedInput tag="login_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11.5, color: "#6B7480", textTransform: "uppercase" }}>Senha</span>
          <TrackedInput tag="login_senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} required placeholder="mínimo 4 caracteres (demo)" />
        </label>

        <Tracked as="button" tag="login_submit" type="submit" className="ol-btn-primary" style={{ padding: 12, borderRadius: 8, background: escritorio.corPrimaria, color: "#fff", fontSize: 14, fontWeight: 600 }}>
          Entrar
        </Tracked>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
          <Link to="/recuperar-senha" data-track="login_ir_recuperar">
            Esqueci minha senha
          </Link>
          <span style={{ color: "#98A0AC" }}>{USUARIOS_HINT}</span>
        </div>
      </form>
    </div>
  );
}

const USUARIOS_HINT = "demo: qualquer senha 4+ chars";
