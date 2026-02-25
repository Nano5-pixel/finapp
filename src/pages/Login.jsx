import { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Email o contraseña incorrectos");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "white", fontSize: "28px", fontWeight: "800" }}>F</span>
          </div>
          <h1 style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "800", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>FinApp</h1>
          <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Finanzas de tu hogar</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "rgba(15,23,42,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "28px" }}>
          <h2 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: "0 0 20px 0" }}>
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </h2>

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }}
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" }}
          />

          {error && (
            <p style={{ color: "#fb7185", fontSize: "13px", margin: "0 0 12px 0", backgroundColor: "rgba(251,113,133,0.08)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(251,113,133,0.2)" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", fontWeight: "700", fontSize: "15px", cursor: "pointer", marginBottom: "16px", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}>
            {loading ? "Cargando..." : isRegister ? "Crear cuenta" : "Entrar"}
          </button>

          <p style={{ color: "#475569", fontSize: "13px", textAlign: "center", margin: 0 }}>
            {isRegister ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}
              style={{ color: "#6366f1", cursor: "pointer", fontWeight: "600" }}>
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </span>
          </p>
        </div>

        <p style={{ color: "#1e293b", fontSize: "11px", textAlign: "center", marginTop: "24px" }}>hecho por Nano</p>
      </div>
    </div>
  );
}