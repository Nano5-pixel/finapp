import { useState } from "react";
import { crearHogar, unirseHogar } from "../lib/household";
import { Home, Users, ArrowRight, Loader } from "lucide-react";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Household({ onComplete }) {
  const [modo, setModo] = useState(null); // "crear" | "unirse"
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCrear = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    setError("");
    try {
      const householdId = await crearHogar(nombre.trim());
      onComplete(householdId);
    } catch (e) {
      setError("Error al crear el hogar. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const handleUnirse = async () => {
    if (!codigo.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await unirseHogar(codigo.trim());
      if (result.error) {
        setError(result.error);
      } else {
        onComplete(result.householdId);
      }
    } catch (e) {
      setError("Error al unirse al hogar. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "white", fontSize: "32px", fontWeight: "800" }}>F</span>
          </div>
          <h1 style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}>Bienvenido a FinApp</h1>
          <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Configura tu hogar para empezar</p>
        </div>

        {!modo && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={() => setModo("crear")}
              style={{ ...glass, padding: "20px", cursor: "pointer", border: "1px solid rgba(99,102,241,0.2)", backgroundColor: "rgba(99,102,241,0.05)", display: "flex", alignItems: "center", gap: "16px", textAlign: "left" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Home size={22} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0" }}>Crear un hogar nuevo</p>
                <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Soy el primero de mi familia en usar FinApp</p>
              </div>
              <ArrowRight size={18} color="#475569" />
            </button>

            <button onClick={() => setModo("unirse")}
              style={{ ...glass, padding: "20px", cursor: "pointer", border: "1px solid rgba(52,211,153,0.2)", backgroundColor: "rgba(52,211,153,0.05)", display: "flex", alignItems: "center", gap: "16px", textAlign: "left" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #34d399, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={22} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0" }}>Unirme a un hogar existente</p>
                <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Mi pareja ya tiene una cuenta en FinApp</p>
              </div>
              <ArrowRight size={18} color="#475569" />
            </button>
          </div>
        )}

        {modo === "crear" && (
          <div style={{ ...glass, padding: "24px" }}>
            <h2 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0" }}>Crear hogar</h2>
            <p style={{ color: "#475569", fontSize: "13px", margin: "0 0 20px 0" }}>Dale un nombre a tu hogar, por ejemplo "Casa Carlos y Ana"</p>

            <input placeholder="Nombre del hogar" value={nombre} onChange={e => setNombre(e.target.value)}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" }} />

            {error && <p style={{ color: "#fb7185", fontSize: "13px", margin: "0 0 12px 0" }}>⚠️ {error}</p>}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setModo(null); setError(""); }}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Volver
              </button>
              <button onClick={handleCrear} disabled={loading || !nombre.trim()}
                style={{ flex: 2, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px", opacity: !nombre.trim() ? 0.5 : 1 }}>
                {loading ? "Creando..." : "Crear hogar"}
              </button>
            </div>
          </div>
        )}

        {modo === "unirse" && (
          <div style={{ ...glass, padding: "24px" }}>
            <h2 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0" }}>Unirse a un hogar</h2>
            <p style={{ color: "#475569", fontSize: "13px", margin: "0 0 20px 0" }}>Pide el código de 6 caracteres a quien ya tiene la cuenta</p>

            <input placeholder="Código del hogar (ej: ABC123)" value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "18px", fontWeight: "700", letterSpacing: "0.2em", outline: "none", marginBottom: "16px", boxSizing: "border-box", textAlign: "center" }} />

            {error && <p style={{ color: "#fb7185", fontSize: "13px", margin: "0 0 12px 0" }}>⚠️ {error}</p>}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setModo(null); setError(""); }}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Volver
              </button>
              <button onClick={handleUnirse} disabled={loading || codigo.length < 6}
                style={{ flex: 2, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #34d399, #06b6d4)", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px", opacity: codigo.length < 6 ? 0.5 : 1 }}>
                {loading ? "Uniéndome..." : "Unirme al hogar"}
              </button>
            </div>
          </div>
        )}

        <p style={{ color: "#1e293b", fontSize: "11px", textAlign: "center", marginTop: "24px" }}>hecho por Nano</p>
      </div>
    </div>
  );
}