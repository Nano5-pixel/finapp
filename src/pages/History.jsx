import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { ChevronRight, Lock, LockOpen, Plus } from "lucide-react";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

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
    const unsub2 = onSnapshot(qt, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
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

  const cerrarMes = async (monthId) => await updateDoc(doc(db, "months", monthId), { status: "closed" });
  const reabrirMes = async (monthId) => await updateDoc(doc(db, "months", monthId), { status: "open" });

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
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Histórico</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Libro contable del hogar</p>
        </div>

        {!mesActualExiste && (
          <button onClick={crearMesActual}
            style={{ ...glass, width: "100%", border: "1px dashed rgba(99,102,241,0.4)", borderRadius: "16px", padding: "14px", color: "#6366f1", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px", backgroundColor: "rgba(99,102,241,0.05)" }}>
            <Plus size={18} />
            Registrar mes actual ({MESES[now.getMonth()]} {now.getFullYear()})
          </button>
        )}

        {months.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>No hay meses registrados aún</p>
          </div>
        )}

        {months.map(m => {
          const resumen = calcularResumen(m.year, m.month);
          const isClosed = m.status === "closed";
          return (
            <div key={m.id} style={{ ...glass, padding: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: selectedMonth?.id === m.id ? "16px" : "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {isClosed
                    ? <Lock size={15} color="#475569" />
                    : <LockOpen size={15} color="#34d399" />
                  }
                  <div>
                    <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>{MESES[m.month]} {m.year}</p>
                    <p style={{ color: isClosed ? "#475569" : "#34d399", fontSize: "11px", margin: 0 }}>{isClosed ? "Cerrado" : "Abierto"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ color: resumen.neto >= 0 ? "#34d399" : "#fb7185", fontWeight: "700", fontSize: "16px", margin: 0 }}>
                    {resumen.neto >= 0 ? "+" : ""}{resumen.neto.toFixed(0)}€
                  </p>
                  <button onClick={() => setSelectedMonth(selectedMonth?.id === m.id ? null : m)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "8px", padding: "4px", cursor: "pointer" }}>
                    <ChevronRight size={16} color="#475569" style={{ transform: selectedMonth?.id === m.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </button>
                </div>
              </div>

              {selectedMonth?.id === m.id && (
                <div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    {[
                      { label: "Ingresos", value: resumen.ingresos, color: "#34d399" },
                      { label: "Gastos", value: resumen.gastos, color: "#fb7185" },
                      { label: "Inversiones", value: resumen.inversiones, color: "#818cf8" },
                      { label: "Ahorro", value: resumen.ahorro, color: "#fbbf24" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 2px 0" }}>{label}</p>
                        <p style={{ color, fontSize: "15px", fontWeight: "700", margin: 0 }}>{value.toFixed(2)}€</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => isClosed ? reabrirMes(m.id) : cerrarMes(m.id)}
                    style={{ width: "100%", padding: "11px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", background: isClosed ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #6366f1, #06b6d4)", color: isClosed ? "#64748b" : "white", transition: "opacity 0.2s" }}>
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