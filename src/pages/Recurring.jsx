import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { Plus, X, Trash2, RefreshCw } from "lucide-react";

const CATEGORIAS = ["Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"];
const TIPOS = {
  income: { label: "Ingreso", color: "#10B981" },
  expense: { label: "Gasto", color: "#F87171" },
  investment: { label: "Inversión", color: "#60A5FA" },
  saving: { label: "Ahorro", color: "#FBBF24" },
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
    const unsub1 = onSnapshot(qr, snap => {
      setRecurrentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const qt = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub2 = onSnapshot(qt, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const yaAplicadoEsteMes = (recurringId) => {
    return transactions.some(t => {
      const f = t.date?.toDate?.() || new Date(t.date);
      return t.recurringId === recurringId &&
        f.getMonth() === mesActual && f.getFullYear() === añoActual;
    });
  };

  const aplicarTodos = async () => {
    setApplying(true);
    const pendientes = recurrentes.filter(r => !yaAplicadoEsteMes(r.id));
    for (const r of pendientes) {
      await addDoc(collection(db, "transactions"), {
        type: r.type,
        concept: r.concept,
        amount: Number(r.amount),
        category: r.category,
        date: Timestamp.now(),
        userId: user.uid,
        household: "hogar_principal",
        recurringId: r.id,
      });
    }
    setApplying(false);
  };

  const aplicarUno = async (r) => {
    await addDoc(collection(db, "transactions"), {
      type: r.type,
      concept: r.concept,
      amount: Number(r.amount),
      category: r.category,
      date: Timestamp.now(),
      userId: user.uid,
      household: "hogar_principal",
      recurringId: r.id,
    });
  };

  const guardar = async () => {
    if (!form.concept || !form.amount) return;
    await addDoc(collection(db, "recurring"), {
      ...form,
      amount: Number(form.amount),
      household: "hogar_principal",
    });
    setForm({ type: "expense", concept: "", amount: "", category: "Suscripciones" });
    setShowForm(false);
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, "recurring", id));
  };

  const pendientes = recurrentes.filter(r => !yaAplicadoEsteMes(r.id));

  return (
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: "24px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: "bold", margin: 0 }}>Recurrentes</h1>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>Gastos e ingresos fijos del hogar</p>
        </div>

        {/* Banner aplicar todos */}
        {pendientes.length > 0 && (
          <button
            onClick={aplicarTodos}
            disabled={applying}
            style={{ width: "100%", backgroundColor: "#10B981" + "20", border: "1px solid #10B981" + "40", borderRadius: "16px", padding: "14px", color: "#10B981", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
            <RefreshCw size={16} />
            {applying ? "Aplicando..." : `Aplicar ${pendientes.length} recurrente${pendientes.length > 1 ? "s" : ""} de este mes`}
          </button>
        )}

        {/* Botón añadir */}
        <button
          onClick={() => setShowForm(true)}
          style={{ width: "100%", backgroundColor: "#1C1C1E", border: "1px dashed #3D3D3D", borderRadius: "16px", padding: "14px", color: "#9CA3AF", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
          <Plus size={18} /> Añadir recurrente
        </button>

        {recurrentes.length === 0 && (
          <p style={{ color: "#4B5563", textAlign: "center", padding: "40px 0" }}>No hay recurrentes definidos aún</p>
        )}

        {recurrentes.map(r => {
          const tipo = TIPOS[r.type] || TIPOS.expense;
          const aplicado = yaAplicadoEsteMes(r.id);
          return (
            <div key={r.id} style={{ backgroundColor: "#1C1C1E", borderRadius: "16px", padding: "16px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: tipo.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RefreshCw size={15} color={tipo.color} />
                </div>
                <div>
                  <p style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: "500", margin: 0 }}>{r.concept}</p>
                  <p style={{ color: "#6B7280", fontSize: "12px", margin: 0 }}>{r.category} · {tipo.label}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <p style={{ color: tipo.color, fontWeight: "700", margin: 0 }}>{Number(r.amount).toFixed(0)}€</p>
                {!aplicado ? (
                  <button onClick={() => aplicarUno(r)}
                    style={{ backgroundColor: "#10B981", border: "none", borderRadius: "8px", padding: "6px 10px", color: "white", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    Aplicar
                  </button>
                ) : (
                  <span style={{ color: "#6B7280", fontSize: "11px" }}>✓ Aplicado</span>
                )}
                <button onClick={() => eliminar(r.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={14} color="#6B7280" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#1C1C1E", borderRadius: "24px 24px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", margin: 0 }}>Nuevo recurrente</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {Object.entries(TIPOS).map(([key, val]) => (
                <button key={key} onClick={() => setForm({ ...form, type: key })}
                  style={{ padding: "8px 4px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "600", backgroundColor: form.type === key ? val.color : "#2D2D2D", color: form.type === key ? "white" : "#9CA3AF" }}>
                  {val.label}
                </button>
              ))}
            </div>

            <input placeholder="Concepto (ej: Netflix, Alquiler)" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />
            <input placeholder="Importe en €" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#2D2D2D", color: "#9CA3AF", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#10B981", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}