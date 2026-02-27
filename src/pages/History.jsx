import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { ChevronDown, ChevronUp, Lock, Unlock, Trash2, Pencil, Check, X } from "lucide-react";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

const CATEGORIAS = ["Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"];

const MESES_NOMBRES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function History() {
  const [months, setMonths] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const qm = query(collection(db, "months"), where("household", "==", "hogar_principal"), orderBy("year", "desc"), orderBy("month", "desc"));
    const unsub = onSnapshot(qm, snap => {
      setMonths(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const qt = query(collection(db, "transactions"), where("household", "==", "hogar_principal"), orderBy("date", "desc"));
    const unsub = onSnapshot(qt, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const getTransaccionesMes = (year, month) => {
    return transactions.filter(t => {
      const fecha = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return fecha.getFullYear() === year && fecha.getMonth() === month;
    });
  };

  const toggleMes = (id) => setExpanded(expanded === id ? null : id);

  const toggleStatus = async (m) => {
    await updateDoc(doc(db, "months", m.id), { status: m.status === "open" ? "closed" : "open" });
  };

  const eliminarTransaccion = async (id) => {
    if (confirm("¿Eliminar esta transacción?")) {
      await deleteDoc(doc(db, "transactions", id));
    }
  };

  const iniciarEdicion = (t) => {
    setEditando(t.id);
    setEditForm({
      concept: t.concept,
      amount: t.amount,
      category: t.category,
      type: t.type,
    });
  };

  const guardarEdicion = async (id) => {
    await updateDoc(doc(db, "transactions", id), {
      concept: editForm.concept,
      amount: Number(editForm.amount),
      category: editForm.category,
      type: editForm.type,
    });
    setEditando(null);
  };

  const inputStyle = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "6px 10px",
    color: "#f1f5f9",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Historial</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Libro contable por meses</p>
        </div>

        {months.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>No hay meses registrados aún</p>
          </div>
        )}

        {months.map(m => {
          const txs = getTransaccionesMes(m.year, m.month);
          const ingresos = txs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
          const gastos = txs.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
          const neto = ingresos - gastos;
          const isExpanded = expanded === m.id;

          return (
            <div key={m.id} style={{ ...glass, marginBottom: "12px", overflow: "hidden" }}>
              {/* Cabecera mes */}
              <div onClick={() => toggleMes(m.id)}
                style={{ padding: "16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: m.status === "closed" ? "rgba(99,102,241,0.15)" : "rgba(52,211,153,0.15)", border: `1px solid ${m.status === "closed" ? "rgba(99,102,241,0.3)" : "rgba(52,211,153,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {m.status === "closed" ? <Lock size={16} color="#818cf8" /> : <Unlock size={16} color="#34d399" />}
                  </div>
                  <div>
                    <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>{MESES_NOMBRES[m.month]} {m.year}</p>
                    <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{txs.length} transacciones · {m.status === "closed" ? "Cerrado" : "Abierto"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <p style={{ color: neto >= 0 ? "#34d399" : "#fb7185", fontWeight: "700", fontSize: "15px", margin: 0 }}>
                    {neto >= 0 ? "+" : ""}{neto.toFixed(0)}€
                  </p>
                  {isExpanded ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
                </div>
              </div>

              {/* Resumen */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", backgroundColor: "rgba(255,255,255,0.04)" }}>
                    {[
                      { label: "Ingresos", value: ingresos, color: "#34d399" },
                      { label: "Gastos", value: gastos, color: "#fb7185" },
                      { label: "Neto", value: neto, color: neto >= 0 ? "#34d399" : "#fb7185" },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: "12px", backgroundColor: "rgba(15,23,42,0.8)", textAlign: "center" }}>
                        <p style={{ color: "#475569", fontSize: "10px", margin: "0 0 4px 0" }}>{item.label}</p>
                        <p style={{ color: item.color, fontSize: "14px", fontWeight: "700", margin: 0 }}>{item.value.toFixed(0)}€</p>
                      </div>
                    ))}
                  </div>

                  {/* Botón cerrar/abrir */}
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <button onClick={() => toggleStatus(m)}
                      style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "none", background: m.status === "closed" ? "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(6,182,212,0.1))" : "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))", color: m.status === "closed" ? "#34d399" : "#818cf8", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                      {m.status === "closed" ? "🔓 Reabrir mes" : "🔒 Cerrar mes"}
                    </button>
                  </div>

                  {/* Lista transacciones */}
                  <div style={{ padding: "8px 12px" }}>
                    {txs.length === 0 && (
                      <p style={{ color: "#334155", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No hay transacciones</p>
                    )}
                    {txs.map(t => {
                      const fecha = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                      const isEditando = editando === t.id;

                      return (
                        <div key={t.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          {isEditando ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <input value={editForm.concept} onChange={e => setEditForm({ ...editForm, concept: e.target.value })} placeholder="Concepto" style={inputStyle} />
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                <input value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} placeholder="Importe" type="number" style={inputStyle} />
                                <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} style={{ ...inputStyle }}>
                                  <option value="expense">Gasto</option>
                                  <option value="income">Ingreso</option>
                                  <option value="investment">Inversión</option>
                                  <option value="saving">Ahorro</option>
                                </select>
                              </div>
                              <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => guardarEdicion(t.id)}
                                  style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}>
                                  Guardar
                                </button>
                                <button onClick={() => setEditando(null)}
                                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", cursor: "pointer" }}>
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "500", margin: 0 }}>{t.concept}</p>
                                <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{t.category} · {fecha.getDate()}/{fecha.getMonth() + 1}</p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <p style={{ color: t.type === "income" ? "#34d399" : t.type === "investment" ? "#818cf8" : t.type === "saving" ? "#fbbf24" : "#fb7185", fontWeight: "700", fontSize: "13px", margin: 0 }}>
                                  {t.type === "income" ? "+" : "-"}{t.amount.toFixed(2)}€
                                </p>
                                <button onClick={() => iniciarEdicion(t)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                                  <Pencil size={13} color="#334155" />
                                </button>
                                <button onClick={() => eliminarTransaccion(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                                  <Trash2 size={13} color="#334155" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}