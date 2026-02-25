import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { ChevronRight, Lock, LockOpen, Plus } from "lucide-react";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function History() {
  const [months, setMonths] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    const qm = query(collection(db, "months"), where("household", "==", "hogar_principal"));
    const unsub1 = onSnapshot(qm, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMonths(data.sort((a, b) => b.year - a.year || b.month - a.month));
    });

    const qt = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub2 = onSnapshot(qt, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const calcularResumen = (year, month) => {
    const trans = transactions.filter(t => {
      const f = t.date?.toDate?.() || new Date(t.date);
      return f.getMonth() === month && f.getFullYear() === year;
    });
    const ingresos = trans.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
    const gastos = trans.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
    const inversiones = trans.filter(t => t.type === "investment").reduce((a, t) => a + Number(t.amount), 0);
    const ahorro = trans.filter(t => t.type === "saving").reduce((a, t) => a + Number(t.amount), 0);
    return { ingresos, gastos, inversiones, ahorro, neto: ingresos - gastos - inversiones - ahorro };
  };

  const cerrarMes = async (monthId) => {
    await updateDoc(doc(db, "months", monthId), { status: "closed" });
  };

  const reabrirMes = async (monthId) => {
    await updateDoc(doc(db, "months", monthId), { status: "open" });
  };

  const crearMesActual = async () => {
    const now = new Date();
    await addDoc(collection(db, "months"), {
      household: "hogar_principal",
      year: now.getFullYear(),
      month: now.getMonth(),
      status: "open",
      createdAt: Timestamp.now()
    });
  };

  const now = new Date();
  const mesActualExiste = months.some(m => m.month === now.getMonth() && m.year === now.getFullYear());

  return (
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: "24px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: "bold", margin: 0 }}>Histórico</h1>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>Libro contable del hogar</p>
        </div>

        {/* Botón crear mes actual */}
        {!mesActualExiste && (
          <button
            onClick={crearMesActual}
            style={{ width: "100%", backgroundColor: "#1C1C1E", border: "1px dashed #3D3D3D", borderRadius: "16px", padding: "16px", color: "#10B981", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}
          >
            <Plus size={18} />
            Registrar mes actual ({MESES[now.getMonth()]} {now.getFullYear()})
          </button>
        )}

        {/* Lista de meses */}
        {months.length === 0 && (
          <p style={{ color: "#4B5563", textAlign: "center", padding: "40px 0" }}>No hay meses registrados aún</p>
        )}

        {months.map(m => {
          const resumen = calcularResumen(m.year, m.month);
          const isClosed = m.status === "closed";
          return (
            <div key={m.id} style={{ backgroundColor: "#1C1C1E", borderRadius: "16px", padding: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {isClosed
                    ? <Lock size={16} color="#9CA3AF" />
                    : <LockOpen size={16} color="#10B981" />
                  }
                  <div>
                    <p style={{ color: "#F9FAFB", fontSize: "15px", fontWeight: "600", margin: 0 }}>{MESES[m.month]} {m.year}</p>
                    <p style={{ color: isClosed ? "#6B7280" : "#10B981", fontSize: "11px", margin: 0 }}>{isClosed ? "Cerrado" : "Abierto"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <p style={{ color: resumen.neto >= 0 ? "#10B981" : "#F87171", fontWeight: "700", fontSize: "16px", margin: 0 }}>
                    {resumen.neto >= 0 ? "+" : ""}{resumen.neto.toFixed(0)}€
                  </p>
                  <button
                    onClick={() => setSelectedMonth(selectedMonth?.id === m.id ? null : m)}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <ChevronRight size={18} color="#6B7280" style={{ transform: selectedMonth?.id === m.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </button>
                </div>
              </div>

              {/* Detalle expandido */}
              {selectedMonth?.id === m.id && (
                <div>
                  <div style={{ borderTop: "1px solid #2D2D2D", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    {[
                      { label: "Ingresos", value: resumen.ingresos, color: "#10B981" },
                      { label: "Gastos", value: resumen.gastos, color: "#F87171" },
                      { label: "Inversiones", value: resumen.inversiones, color: "#60A5FA" },
                      { label: "Ahorro", value: resumen.ahorro, color: "#FBBF24" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p style={{ color: "#6B7280", fontSize: "11px", margin: "0 0 2px 0" }}>{label}</p>
                        <p style={{ color, fontSize: "15px", fontWeight: "600", margin: 0 }}>{value.toFixed(2)}€</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => isClosed ? reabrirMes(m.id) : cerrarMes(m.id)}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: isClosed ? "#2D2D2D" : "#10B981", color: isClosed ? "#9CA3AF" : "white" }}
                  >
                    {isClosed ? "🔓 Reabrir mes" : "🔒 Cerrar mes"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}