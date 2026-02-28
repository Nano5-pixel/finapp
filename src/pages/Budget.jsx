import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, X, Trash2 } from "lucide-react";

const CATEGORIAS = ["Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"];

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Budget({ householdId }) {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "Alimentación", limit: "" });

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  useEffect(() => {
    if (!householdId) return;
    const qb = query(collection(db, "budgets"), where("household", "==", householdId));
    const unsub1 = onSnapshot(qb, snap => setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qt = query(collection(db, "transactions"), where("household", "==", householdId));
    const unsub2 = onSnapshot(qt, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, [householdId]);

  const gastoCategoria = (category) => transactions
    .filter(t => {
      const f = t.date?.toDate?.() || new Date(t.date);
      return t.type === "expense" && t.category === category &&
        f.getMonth() === mesActual && f.getFullYear() === añoActual;
    })
    .reduce((a, t) => a + Number(t.amount), 0);

  const guardar = async () => {
    if (!form.limit) return;
    const existente = budgets.find(b => b.category === form.category);
    if (existente) {
      await updateDoc(doc(db, "budgets", existente.id), { limit: Number(form.limit) });
    } else {
      await addDoc(collection(db, "budgets"), { household: householdId, category: form.category, limit: Number(form.limit) });
    }
    setForm({ category: "Alimentación", limit: "" });
    setShowForm(false);
  };

  const eliminar = async (id) => await deleteDoc(doc(db, "budgets", id));

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Presupuestos</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>
            {now.toLocaleString("es-ES", { month: "long", year: "numeric" })}
          </p>
        </div>

        <button onClick={() => setShowForm(true)}
          style={{ ...glass, width: "100%", border: "1px dashed rgba(99,102,241,0.4)", borderRadius: "16px", padding: "14px", color: "#6366f1", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px", backgroundColor: "rgba(99,102,241,0.05)" }}>
          <Plus size={18} /> Añadir presupuesto
        </button>

        {budgets.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>No hay presupuestos definidos aún</p>
          </div>
        )}

        {budgets.map(b => {
          const gastado = gastoCategoria(b.category);
          const porcentaje = Math.min((gastado / b.limit) * 100, 100);
          const color = porcentaje >= 100 ? "#fb7185" : porcentaje >= 80 ? "#fbbf24" : "#34d399";
          const restante = b.limit - gastado;

          return (
            <div key={b.id} style={{ ...glass, padding: "18px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>{b.category}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>{gastado.toFixed(0)}€ / {b.limit}€</p>
                  <button onClick={() => eliminar(b.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Trash2 size={14} color="#334155" />
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "99px", height: "6px", marginBottom: "8px" }}>
                <div style={{ backgroundColor: color, borderRadius: "99px", height: "6px", width: `${porcentaje}%`, transition: "width 0.4s ease", boxShadow: `0 0 8px ${color}60` }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color, fontSize: "12px", fontWeight: "600", margin: 0 }}>
                  {porcentaje >= 100 ? "⚠️ Límite superado" : porcentaje >= 80 ? "⚠ Casi al límite" : `${porcentaje.toFixed(0)}% usado`}
                </p>
                <p style={{ color: restante >= 0 ? "#475569" : "#fb7185", fontSize: "12px", margin: 0 }}>
                  {restante >= 0 ? `${restante.toFixed(0)}€ restantes` : `${Math.abs(restante).toFixed(0)}€ excedido`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px 28px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: 0 }}>Nuevo presupuesto</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px 0" }}>Categoría</p>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" }}>
              {CATEGORIAS.map(c => <option key={c} value={c} style={{ backgroundColor: "#0f172a" }}>{c}</option>)}
            </select>

            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px 0" }}>Límite mensual en €</p>
            <input placeholder="Ej: 500" type="number" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}