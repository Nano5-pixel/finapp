import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, X, Trash2 } from "lucide-react";

const EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💻", "👶", "🎓", "💍", "🖥️", "🛋️"];

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Goals({ householdId }) {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", target: "", saved: "0", emoji: "🎯" });
  const [aportes, setAportes] = useState({});
  const [showAporte, setShowAporte] = useState({});

  useEffect(() => {
    if (!householdId) return;
    const q = query(collection(db, "goals"), where("household", "==", householdId));
    const unsub = onSnapshot(q, snap => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [householdId]);

  const guardar = async () => {
    if (!form.name || !form.target) return;
    await addDoc(collection(db, "goals"), {
      household: householdId,
      name: form.name,
      target: Number(form.target),
      saved: Number(form.saved),
      emoji: form.emoji,
    });
    setForm({ name: "", target: "", saved: "0", emoji: "🎯" });
    setShowForm(false);
  };

  const aportarFondos = async (goal) => {
    const cantidad = aportes[goal.id] || 0;
    const nuevaCantidad = Math.min(Number(goal.saved) + Number(cantidad), goal.target);
    await updateDoc(doc(db, "goals", goal.id), { saved: nuevaCantidad });
    setAportes({ ...aportes, [goal.id]: "" });
    setShowAporte({ ...showAporte, [goal.id]: false });
  };

  const eliminar = async (id) => await deleteDoc(doc(db, "goals", id));

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Metas de ahorro</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Objetivos financieros del hogar</p>
        </div>

        <button onClick={() => setShowForm(true)}
          style={{ ...glass, width: "100%", border: "1px dashed rgba(99,102,241,0.4)", borderRadius: "16px", padding: "14px", color: "#6366f1", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px", backgroundColor: "rgba(99,102,241,0.05)" }}>
          <Plus size={18} /> Nueva meta
        </button>

        {goals.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>No hay metas definidas aún</p>
          </div>
        )}

        {goals.map(g => {
          const porcentaje = Math.min((g.saved / g.target) * 100, 100);
          const completada = porcentaje >= 100;
          const restante = g.target - g.saved;

          return (
            <div key={g.id} style={{ ...glass, padding: "20px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "32px" }}>{g.emoji}</span>
                  <div>
                    <p style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "600", margin: 0 }}>{g.name}</p>
                    <p style={{ color: "#475569", fontSize: "13px", margin: "2px 0 0 0" }}>
                      {g.saved.toFixed(0)}€ de {g.target.toFixed(0)}€
                    </p>
                  </div>
                </div>
                <button onClick={() => eliminar(g.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                  <Trash2 size={15} color="#334155" />
                </button>
              </div>

              <div style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "99px", height: "8px", marginBottom: "8px" }}>
                <div style={{
                  background: completada ? "linear-gradient(90deg, #34d399, #06b6d4)" : "linear-gradient(90deg, #6366f1, #fbbf24)",
                  borderRadius: "99px", height: "8px",
                  width: `${porcentaje}%`,
                  transition: "width 0.4s ease",
                  boxShadow: completada ? "0 0 10px rgba(52,211,153,0.4)" : "0 0 10px rgba(99,102,241,0.3)"
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                <p style={{ color: completada ? "#34d399" : "#6366f1", fontSize: "12px", fontWeight: "600", margin: 0 }}>
                  {completada ? "🎉 ¡Meta alcanzada!" : `${porcentaje.toFixed(0)}% completado`}
                </p>
                {!completada && (
                  <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>Faltan {restante.toFixed(0)}€</p>
                )}
              </div>

              {!completada && (
                showAporte[g.id] ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      placeholder="Cantidad €"
                      type="number"
                      value={aportes[g.id] || ""}
                      onChange={e => setAportes({ ...aportes, [g.id]: e.target.value })}
                      style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }}
                    />
                    <button onClick={() => aportarFondos(g)}
                      style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", border: "none", borderRadius: "10px", padding: "10px 16px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                      Añadir
                    </button>
                    <button onClick={() => setShowAporte({ ...showAporte, [g.id]: false })}
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "none", borderRadius: "10px", padding: "10px", cursor: "pointer" }}>
                      <X size={14} color="#64748b" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowAporte({ ...showAporte, [g.id]: true })}
                    style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px", color: "#64748b", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    + Aportar fondos
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px 28px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: 0 }}>Nueva meta</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px 0" }}>Icono</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                  style={{ width: "40px", height: "40px", borderRadius: "10px", border: form.emoji === e ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontSize: "20px", backgroundColor: form.emoji === e ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)" }}>
                  {e}
                </button>
              ))}
            </div>

            <input placeholder="Nombre de la meta (ej: Vacaciones)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <input placeholder="Objetivo en €" type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <input placeholder="Ya tengo ahorrado (€, opcional)" type="number" value={form.saved} onChange={e => setForm({ ...form, saved: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>
                Crear meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}