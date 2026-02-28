import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import { Plus, X, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function Investments({ householdId }) {
  const [snapshots, setSnapshots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ mes: new Date().getMonth(), año: new Date().getFullYear(), valor: "" });

  useEffect(() => {
    if (!householdId) return;
    const q = query(collection(db, "investments"), where("household", "==", householdId), orderBy("año", "desc"), orderBy("mes", "desc"));
    const unsub = onSnapshot(q, snap => setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [householdId]);

  const guardar = async () => {
    if (!form.valor) return;
    await addDoc(collection(db, "investments"), {
      household: householdId,
      mes: Number(form.mes),
      año: Number(form.año),
      valor: Number(form.valor),
      createdAt: new Date(),
    });
    setForm({ mes: new Date().getMonth(), año: new Date().getFullYear(), valor: "" });
    setShowForm(false);
  };

  const eliminar = async (id) => {
    if (confirm("¿Eliminar este registro?")) await deleteDoc(doc(db, "investments", id));
  };

  const valorActual = snapshots.length > 0 ? snapshots[0].valor : 0;
  const valorAnterior = snapshots.length > 1 ? snapshots[1].valor : null;
  const diferencia = valorAnterior !== null ? valorActual - valorAnterior : null;
  const porcentaje = valorAnterior ? ((diferencia / valorAnterior) * 100).toFixed(2) : null;

  const años = [...new Set(snapshots.map(s => s.año))];

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Inversiones</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Valor mensual de tu cartera</p>
        </div>

        {valorActual > 0 && (
          <div style={{ ...glass, padding: "24px", marginBottom: "16px", background: "linear-gradient(135deg, rgba(129,140,248,0.1), rgba(6,182,212,0.05))", textAlign: "center" }}>
            <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 8px 0", textTransform: "uppercase" }}>Valor actual de cartera</p>
            <p style={{ color: "#f1f5f9", fontSize: "44px", fontWeight: "800", margin: "0 0 12px 0", letterSpacing: "-2px" }}>{valorActual.toFixed(2)}€</p>
            {diferencia !== null && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {diferencia >= 0
                  ? <TrendingUp size={16} color="#34d399" />
                  : <TrendingDown size={16} color="#fb7185" />}
                <p style={{ color: diferencia >= 0 ? "#34d399" : "#fb7185", fontSize: "15px", fontWeight: "700", margin: 0 }}>
                  {diferencia >= 0 ? "+" : ""}{diferencia.toFixed(2)}€ ({diferencia >= 0 ? "+" : ""}{porcentaje}%)
                </p>
              </div>
            )}
            {diferencia !== null && (
              <p style={{ color: "#334155", fontSize: "11px", margin: "6px 0 0 0" }}>vs mes anterior</p>
            )}
          </div>
        )}

        <button onClick={() => setShowForm(true)}
          style={{ ...glass, width: "100%", border: "1px dashed rgba(129,140,248,0.4)", borderRadius: "16px", padding: "14px", color: "#818cf8", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px", backgroundColor: "rgba(129,140,248,0.05)" }}>
          <Plus size={18} /> Registrar valor mensual
        </button>

        {snapshots.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <TrendingUp size={32} color="#334155" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#334155", margin: 0 }}>No hay registros aún</p>
            <p style={{ color: "#1e293b", fontSize: "12px", margin: "8px 0 0 0" }}>Añade el valor actual de tu cartera cada mes</p>
          </div>
        )}

        {años.map(año => (
          <div key={año} style={{ marginBottom: "20px" }}>
            <p style={{ color: "#334155", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 10px 0", textTransform: "uppercase" }}>{año}</p>
            {snapshots.filter(s => s.año === año).map((s, i) => {
              const siguiente = snapshots.filter(s2 => s2.año === año)[i + 1] || snapshots.find(s2 => s2.año === año - 1);
              const diff = siguiente ? s.valor - siguiente.valor : null;
              const pct = siguiente ? ((diff / siguiente.valor) * 100).toFixed(1) : null;
              return (
                <div key={s.id} style={{ ...glass, padding: "16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>{MESES[s.mes]}</p>
                    {diff !== null && (
                      <p style={{ color: diff >= 0 ? "#34d399" : "#fb7185", fontSize: "12px", margin: "2px 0 0 0" }}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(2)}€ ({diff >= 0 ? "+" : ""}{pct}%)
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <p style={{ color: "#818cf8", fontSize: "18px", fontWeight: "800", margin: 0 }}>{s.valor.toFixed(0)}€</p>
                    <button onClick={() => eliminar(s.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                      <Trash2 size={14} color="#334155" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px 28px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: 0 }}>Registrar valor</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <select value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })}
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none" }}>
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <input type="number" placeholder="Año" value={form.año} onChange={e => setForm({ ...form, año: e.target.value })}
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none" }} />
            </div>

            <input type="number" placeholder="Valor total de la cartera en €" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #818cf8, #6366f1)", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}