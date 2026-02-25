import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, X, Trash2 } from "lucide-react";

const EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💻", "👶", "🎓", "💍", "🏖️", "🛋️"];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", target: "", saved: "0", emoji: "🎯" });
  const [aportes, setAportes] = useState({});
  const [showAporte, setShowAporte] = useState({});

  useEffect(() => {
    const q = query(collection(db, "goals"), where("household", "==", "hogar_principal"));
    const unsub = onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const guardar = async () => {
    if (!form.name || !form.target) return;
    await addDoc(collection(db, "goals"), {
      household: "hogar_principal",
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

  const eliminar = async (id) => {
    await deleteDoc(doc(db, "goals", id));
  };

  return (
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: "24px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: "bold", margin: 0 }}>Metas de ahorro</h1>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>Objetivos financieros del hogar</p>
        </div>

        {/* Botón añadir */}
        <button onClick={() => setShowForm(true)}
          style={{ width: "100%", backgroundColor: "#1C1C1E", border: "1px dashed #3D3D3D", borderRadius: "16px", padding: "14px", color: "#10B981", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
          <Plus size={18} /> Nueva meta
        </button>

        {goals.length === 0 && (
          <p style={{ color: "#4B5563", textAlign: "center", padding: "40px 0" }}>No hay metas definidas aún</p>
        )}

        {goals.map(g => {
          const porcentaje = Math.min((g.saved / g.target) * 100, 100);
          const completada = porcentaje >= 100;
          const restante = g.target - g.saved;

          return (
            <div key={g.id} style={{ backgroundColor: "#1C1C1E", borderRadius: "20px", padding: "20px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "32px" }}>{g.emoji}</span>
                  <div>
                    <p style={{ color: "#F9FAFB", fontSize: "16px", fontWeight: "600", margin: 0 }}>{g.name}</p>
                    <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "2px 0 0 0" }}>
                      {g.saved.toFixed(0)}€ de {g.target.toFixed(0)}€
                    </p>
                  </div>
                </div>
                <button onClick={() => eliminar(g.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                  <Trash2 size={15} color="#6B7280" />
                </button>
              </div>

              {/* Barra de progreso */}
              <div style={{ backgroundColor: "#2D2D2D", borderRadius: "99px", height: "10px", marginBottom: "8px" }}>
                <div style={{ backgroundColor: completada ? "#10B981" : "#FBBF24", borderRadius: "99px", height: "10px", width: `${porcentaje}%`, transition: "width 0.4s ease" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ color: completada ? "#10B981" : "#FBBF24", fontSize: "12px", fontWeight: "600", margin: 0 }}>
                  {completada ? "🎉 ¡Meta alcanzada!" : `${porcentaje.toFixed(0)}% completado`}
                </p>
                {!completada && (
                  <p style={{ color: "#9CA3AF", fontSize: "12px", margin: 0 }}>Faltan {restante.toFixed(0)}€</p>
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
                      style={{ flex: 1, backgroundColor: "#2D2D2D", border: "none", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }}
                    />
                    <button onClick={() => aportarFondos(g)}
                      style={{ backgroundColor: "#10B981", border: "none", borderRadius: "10px", padding: "10px 16px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                      Añadir
                    </button>
                    <button onClick={() => setShowAporte({ ...showAporte, [g.id]: false })}
                      style={{ backgroundColor: "#2D2D2D", border: "none", borderRadius: "10px", padding: "10px", cursor: "pointer" }}>
                      <X size={14} color="#9CA3AF" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowAporte({ ...showAporte, [g.id]: true })}
                    style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "10px", padding: "10px", color: "#9CA3AF", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    + Aportar fondos
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Modal nueva meta */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#1C1C1E", borderRadius: "24px 24px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", margin: 0 }}>Nueva meta</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 8px 0" }}>Icono</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                  style={{ width: "40px", height: "40px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "20px", backgroundColor: form.emoji === e ? "#10B981" + "30" : "#2D2D2D", outline: form.emoji === e ? "2px solid #10B981" : "none" }}>
                  {e}
                </button>
              ))}
            </div>

            <input placeholder="Nombre de la meta (ej: Vacaciones)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />
            <input placeholder="Objetivo en €" type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />
            <input placeholder="Ya tengo ahorrado (€, opcional)" type="number" value={form.saved} onChange={e => setForm({ ...form, saved: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#2D2D2D", color: "#9CA3AF", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#10B981", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Crear meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}