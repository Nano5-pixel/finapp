import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { Plus, X, Trash2, RefreshCw } from "lucide-react";

const CATEGORIAS = ["Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"];
const TIPOS = {
  income: { label: "Ingreso", color: "#34d399" },
  expense: { label: "Gasto", color: "#fb7185" },
  investment: { label: "Inversión", color: "#818cf8" },
  saving: { label: "Ahorro", color: "#fbbf24" },
};

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Recurring() {
  const [recurrentes, setRecurrentes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", concept: "", amount: "", category: "Suscripciones" });
  const [applying, setApplying] = useState(false);
  const user = auth.currentUser;

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  useEffect(() => {
    const qr = query(collection(db, "recurring"), where("household", "==", "hogar_principal"));
    const unsub1 = onSnapshot(qr, snap => setRecurrentes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qt = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub2 = onSnapshot(qt, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, []);

  const yaAplicadoEsteMes = (recurringId) => transactions.some(t => {
    const f = t.date?.toDate?.() || new Date(t.date);
    return t.recurringId === recurringId && f.getMonth() === mesActual && f.getFullYear() === añoActual;
  });

  const aplicarTodos = async () => {
    setApplying(true);
    const pendientes = recurrentes.filter(r => !yaAplicadoEsteMes(r.id));
    for (const r of pendientes) {
      await addDoc(collection(db, "transactions"), {
        type: r.type, concept: r.concept, amount: Number(r.amount), category: r.category,
        date: Timestamp.now(), userId: user.uid, household: "hogar_principal", recurringId: r.id,
      });
    }
    setApplying(false);
  };

  const aplicarUno = async (r) => {
    await addDoc(collection(db, "transactions"), {
      type: r.type, concept: r.concept, amount: Number(r.amount), category: r.category,
      date: Timestamp.now(), userId: user.uid, household: "hogar_principal", recurringId: r.id,
    });
  };

  const guardar = async () => {
    if (!form.concept || !form.amount) return;
    await addDoc(collection(db, "recurring"), { ...form, amount: Number(form.amount), household: "hogar_principal" });
    setForm({ type: "expense", concept: "", amount: "", category: "Suscripciones" });
    setShowForm(false);
  };

  const eliminar = async (id) => await deleteDoc(doc(db, "recurring", id));
  const pendientes = recurrentes.filter(r => !yaAplicadoEsteMes(r.id));

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Recurrentes</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Gastos e ingresos fijos del hogar</p>
        </div>

        {pendientes.length > 0 && (
          <button onClick={aplicarTodos} disabled={applying}
            style={{ ...glass, width: "100%", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "16px", padding: "14px", color: "#34d399", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px", backgroundColor: "rgba(52,211,153,0.05)" }}>
            <RefreshCw size={16} />
            {applying ? "Aplicando..." : `Aplicar ${pendientes.length} recurrente${pendientes.length > 1 ? "s" : ""} de este mes`}
          </button>
        )}

        <button onClick={() => setShowForm(true)}
          style={{ ...glass, width: "100%", border: "1px dashed rgba(99,102,241,0.4)", borderRadius: "16px", padding: "14px", color: "#6366f1", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px", backgroundColor: "rgba(99,102,241,0.05)" }}>
          <Plus size={18} /> Añadir recurrente
        </button>

        {recurrentes.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>No hay recurrentes definidos aún</p>
          </div>
        )}

        {recurrentes.map(r => {
          const tipo = TIPOS[r.type] || TIPOS.expense;
          const aplicado = yaAplicadoEsteMes(r.id);
          return (
            <div key={r.id} style={{ ...glass, padding: "16px", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: tipo.color + "15", border: `1px solid ${tipo.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RefreshCw size={15} color={tipo.color} />
                </div>
                <div>
                  <p style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: "500", margin: 0 }}>{r.concept}</p>
                  <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>{r.category} · {tipo.label}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <p style={{ color: tipo.color, fontWeight: "700", fontSize: "15px", margin: 0 }}>{Number(r.amount).toFixed(0)}€</p>
                {!aplicado ? (
                  <button onClick={() => aplicarUno(r)}
                    style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", border: "none", borderRadius: "8px", padding: "6px 12px", color: "white", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    Aplicar
                  </button>
                ) : (
                  <span style={{ color: "#334155", fontSize: "11px", fontWeight: "600" }}>✓ Aplicado</span>
                )}
                <button onClick={() => eliminar(r.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={14} color="#334155" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px 28px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: 0 }}>Nuevo recurrente</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {Object.entries(TIPOS).map(([key, val]) => (
                <button key={key} onClick={() => setForm({ ...form, type: key })}
                  style={{ padding: "10px 4px", borderRadius: "12px", border: form.type === key ? `1px solid ${val.color}40` : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontSize: "11px", fontWeight: "600", backgroundColor: form.type === key ? val.color + "20" : "rgba(255,255,255,0.03)", color: form.type === key ? val.color : "#64748b", transition: "all 0.2s" }}>
                  {val.label}
                </button>
              ))}
            </div>

            <input placeholder="Concepto (ej: Netflix, Alquiler)" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <input placeholder="Importe en €" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }}>
              {CATEGORIAS.map(c => <option key={c} value={c} style={{ backgroundColor: "#0f172a" }}>{c}</option>)}
            </select>

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