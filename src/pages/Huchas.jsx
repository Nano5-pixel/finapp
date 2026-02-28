import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, X, Trash2, PiggyBank, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

const EMOJIS = ["🐷", "🏦", "💰", "🏠", "🚨", "✈️", "🎓", "💊", "🛒", "🎁"];

export default function Huchas({ householdId }) {
  const [huchas, setHuchas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [movimiento, setMovimiento] = useState({});
  const [showMovimiento, setShowMovimiento] = useState({});
  const [form, setForm] = useState({ nombre: "", saldo: "", emoji: "🐷" });

  useEffect(() => {
    if (!householdId) return;
    const q = query(collection(db, "huchas"), where("household", "==", householdId));
    const unsub = onSnapshot(q, snap => setHuchas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [householdId]);

  const guardar = async () => {
    if (!form.nombre) return;
    await addDoc(collection(db, "huchas"), {
      household: householdId,
      nombre: form.nombre,
      saldo: Number(form.saldo) || 0,
      emoji: form.emoji,
    });
    setForm({ nombre: "", saldo: "", emoji: "🐷" });
    setShowForm(false);
  };

  const mover = async (hucha, tipo) => {
    const cantidad = Number(movimiento[hucha.id] || 0);
    if (!cantidad) return;
    const nuevoSaldo = tipo === "entrada"
      ? hucha.saldo + cantidad
      : Math.max(0, hucha.saldo - cantidad);
    await updateDoc(doc(db, "huchas", hucha.id), { saldo: nuevoSaldo });
    setMovimiento({ ...movimiento, [hucha.id]: "" });
    setShowMovimiento({ ...showMovimiento, [hucha.id]: false });
  };

  const eliminar = async (id) => await deleteDoc(doc(db, "huchas", id));

  const totalHuchas = huchas.reduce((a, h) => a + h.saldo, 0);

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Huchas</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Efectivo y fondos personales</p>
        </div>

        {huchas.length > 0 && (
          <div style={{ ...glass, padding: "20px", marginBottom: "16px", background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(99,102,241,0.05))" }}>
            <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 8px 0", textTransform: "uppercase" }}>Total en huchas</p>
            <p style={{ color: "#fbbf24", fontSize: "36px", fontWeight: "800", margin: 0, letterSpacing: "-1px" }}>{totalHuchas.toFixed(2)}€</p>
          </div>
        )}

        <button onClick={() => setShowForm(true)}
          style={{ ...glass, width: "100%", border: "1px dashed rgba(251,191,36,0.4)", borderRadius: "16px", padding: "14px", color: "#fbbf24", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px", backgroundColor: "rgba(251,191,36,0.05)" }}>
          <Plus size={18} /> Nueva hucha
        </button>

        {huchas.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <PiggyBank size={32} color="#334155" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#334155", margin: 0 }}>No hay huchas creadas aún</p>
          </div>
        )}

        {huchas.map(h => (
          <div key={h.id} style={{ ...glass, padding: "20px", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "36px" }}>{h.emoji}</span>
                <div>
                  <p style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "600", margin: 0 }}>{h.nombre}</p>
                  <p style={{ color: "#fbbf24", fontSize: "22px", fontWeight: "800", margin: "2px 0 0 0" }}>{h.saldo.toFixed(2)}€</p>
                </div>
              </div>
              <button onClick={() => eliminar(h.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Trash2 size={15} color="#334155" />
              </button>
            </div>

            {showMovimiento[h.id] ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  placeholder="Cantidad €"
                  type="number"
                  value={movimiento[h.id] || ""}
                  onChange={e => setMovimiento({ ...movimiento, [h.id]: e.target.value })}
                  style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => mover(h, "entrada")}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(52,211,153,0.2)", backgroundColor: "rgba(52,211,153,0.08)", color: "#34d399", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                    <ArrowUpCircle size={15} /> Ingresar
                  </button>
                  <button onClick={() => mover(h, "salida")}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(251,113,133,0.2)", backgroundColor: "rgba(251,113,133,0.08)", color: "#fb7185", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                    <ArrowDownCircle size={15} /> Retirar
                  </button>
                  <button onClick={() => setShowMovimiento({ ...showMovimiento, [h.id]: false })}
                    style={{ padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                    <X size={14} color="#64748b" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowMovimiento({ ...showMovimiento, [h.id]: true })}
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px", color: "#64748b", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                + Mover dinero
              </button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px 28px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: 0 }}>Nueva hucha</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px 0" }}>Icono</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                  style={{ width: "40px", height: "40px", borderRadius: "10px", border: form.emoji === e ? "1px solid rgba(251,191,36,0.6)" : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontSize: "20px", backgroundColor: form.emoji === e ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.03)" }}>
                  {e}
                </button>
              ))}
            </div>

            <input placeholder="Nombre de la hucha (ej: Fondo de emergencia)" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <input placeholder="Saldo inicial en € (opcional)" type="number" value={form.saldo} onChange={e => setForm({ ...form, saldo: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>
                Crear hucha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}