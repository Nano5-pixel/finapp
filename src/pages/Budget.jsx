import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, X, Trash2 } from "lucide-react";

const CATEGORIAS = ["Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"];

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "Alimentación", limit: "" });

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  useEffect(() => {
    const qb = query(collection(db, "budgets"), where("household", "==", "hogar_principal"));
    const unsub1 = onSnapshot(qb, snap => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qt = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub2 = onSnapshot(qt, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const gastoCategoria = (category) => {
    return transactions
      .filter(t => {
        const f = t.date?.toDate?.() || new Date(t.date);
        return t.type === "expense" && t.category === category &&
          f.getMonth() === mesActual && f.getFullYear() === añoActual;
      })
      .reduce((a, t) => a + Number(t.amount), 0);
  };

  const guardar = async () => {
    if (!form.limit) return;
    const existente = budgets.find(b => b.category === form.category);
    if (existente) {
      await updateDoc(doc(db, "budgets", existente.id), { limit: Number(form.limit) });
    } else {
      await addDoc(collection(db, "budgets"), {
        household: "hogar_principal",
        category: form.category,
        limit: Number(form.limit),
      });
    }
    setForm({ category: "Alimentación", limit: "" });
    setShowForm(false);
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, "budgets", id));
  };

  return (
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: "24px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: "bold", margin: 0 }}>Presupuestos</h1>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>
            {now.toLocaleString("es-ES", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Botón añadir */}
        <button
          onClick={() => setShowForm(true)}
          style={{ width: "100%", backgroundColor: "#1C1C1E", border: "1px dashed #3D3D3D", borderRadius: "16px", padding: "14px", color: "#10B981", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
          <Plus size={18} /> Añadir presupuesto
        </button>

        {/* Lista de presupuestos */}
        {budgets.length === 0 && (
          <p style={{ color: "#4B5563", textAlign: "center", padding: "40px 0" }}>No hay presupuestos definidos aún</p>
        )}

        {budgets.map(b => {
          const gastado = gastoCategoria(b.category);
          const porcentaje = Math.min((gastado / b.limit) * 100, 100);
          const color = porcentaje >= 100 ? "#F87171" : porcentaje >= 80 ? "#FBBF24" : "#10B981";
          const restante = b.limit - gastado;

          return (
            <div key={b.id} style={{ backgroundColor: "#1C1C1E", borderRadius: "16px", padding: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ color: "#F9FAFB", fontSize: "15px", fontWeight: "600", margin: 0 }}>{b.category}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ color: "#9CA3AF", fontSize: "12px", margin: 0 }}>
                    {gastado.toFixed(0)}€ / {b.limit}€
                  </p>
                  <button onClick={() => eliminar(b.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                    <Trash2 size={14} color="#6B7280" />
                  </button>
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ backgroundColor: "#2D2D2D", borderRadius: "99px", height: "8px", marginBottom: "8px" }}>
                <div style={{ backgroundColor: color, borderRadius: "99px", height: "8px", width: `${porcentaje}%`, transition: "width 0.3s ease" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color: color, fontSize: "12px", margin: 0, fontWeight: "600" }}>
                  {porcentaje >= 100 ? "⚠️ Límite superado" : porcentaje >= 80 ? "⚠️ Casi al límite" : `${porcentaje.toFixed(0)}% usado`}
                </p>
                <p style={{ color: restante >= 0 ? "#9CA3AF" : "#F87171", fontSize: "12px", margin: 0 }}>
                  {restante >= 0 ? `${restante.toFixed(0)}€ restantes` : `${Math.abs(restante).toFixed(0)}€ excedido`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#1C1C1E", borderRadius: "24px 24px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", margin: 0 }}>Nuevo presupuesto</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 8px 0" }}>Categoría</p>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 8px 0" }}>Límite mensual en €</p>
            <input placeholder="Ej: 500" type="number" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

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