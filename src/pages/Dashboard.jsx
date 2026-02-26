import { useState, useEffect, useRef } from "react";
import { auth, db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { TrendingUp, TrendingDown, PiggyBank, BarChart2, Plus, Sparkles, X, Trash2, Pencil, Mic, MicOff } from "lucide-react";
import { analizarTexto } from "../lib/gemini";

const TIPOS = {
  income: { label: "Ingreso", color: "#34d399", icon: TrendingUp },
  expense: { label: "Gasto", color: "#fb7185", icon: TrendingDown },
  investment: { label: "Inversión", color: "#818cf8", icon: BarChart2 },
  saving: { label: "Ahorro", color: "#fbbf24", icon: PiggyBank },
};

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", concept: "", amount: "", category: "Otros" });
  const [editingId, setEditingId] = useState(null);
  const [textoIA, setTextoIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const [sugerencia, setSugerencia] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [escuchando, setEscuchando] = useState(false);
  const recognitionRef = useRef(null);
  const user = auth.currentUser;

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const transaccionesMes = transactions.filter(t => {
    const fecha = t.date?.toDate?.() || new Date(t.date);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
  });

  const total = (tipo) => transaccionesMes.filter(t => t.type === tipo).reduce((acc, t) => acc + Number(t.amount), 0);

  const ingresos = total("income");
  const gastos = total("expense");
  const inversiones = total("investment");
  const ahorro = total("saving");
  const neto = ingresos - gastos - inversiones - ahorro;

  const iniciarVoz = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setEscuchando(true);
    recognition.onend = () => setEscuchando(false);
    recognition.onerror = () => setEscuchando(false);
    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript;
      setTextoIA(texto);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const detenerVoz = () => {
    recognitionRef.current?.stop();
    setEscuchando(false);
  };

  const analizarConIA = async () => {
    if (!textoIA.trim()) return;
    setLoadingIA(true);
    const resultado = await analizarTexto(textoIA);
    if (resultado) {
      setSugerencia(resultado);
      setForm({ type: resultado.type || "expense", concept: resultado.concept || "", amount: resultado.amount || "", category: resultado.category || "Otros" });
      setShowForm(true);
    }
    setLoadingIA(false);
    setTextoIA("");
  };

  const guardar = async () => {
    if (!form.concept || !form.amount) return;
    if (editingId) {
      await updateDoc(doc(db, "transactions", editingId), { type: form.type, concept: form.concept, amount: Number(form.amount), category: form.category });
      setEditingId(null);
    } else {
      await addDoc(collection(db, "transactions"), { ...form, amount: Number(form.amount), date: Timestamp.now(), userId: user.uid, household: "hogar_principal" });
    }
    setForm({ type: "expense", concept: "", amount: "", category: "Otros" });
    setSugerencia(null);
    setShowForm(false);
  };

  const eliminar = async (id) => { await deleteDoc(doc(db, "transactions", id)); setSelectedTransaction(null); };
  const editar = (t) => { setEditingId(t.id); setForm({ type: t.type, concept: t.concept, amount: t.amount, category: t.category }); setSelectedTransaction(null); setShowForm(true); };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "16px", fontWeight: "800" }}>F</span>
            </div>
            <h1 style={{ color: "#f1f5f9", fontSize: "22px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>FinApp</h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0, paddingLeft: "42px" }}>
            {now.toLocaleString("es-ES", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Input IA con voz */}
        <div style={{ ...glass, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))", border: escuchando ? "1px solid rgba(251,113,133,0.5)" : "1px solid rgba(99,102,241,0.3)", transition: "border 0.3s" }}>
          <Sparkles size={17} color={escuchando ? "#fb7185" : "#6366f1"} style={{ flexShrink: 0 }} />
          <input
            placeholder={escuchando ? "Escuchando..." : 'Escribe o habla: "300€ alquiler"'}
            value={textoIA}
            onChange={e => setTextoIA(e.target.value)}
            onKeyDown={e => e.key === "Enter" && analizarConIA()}
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#f1f5f9", fontSize: "14px" }}
          />

          {/* Botón micrófono */}
          <button
            onClick={escuchando ? detenerVoz : iniciarVoz}
            style={{
              width: "32px", height: "32px", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
              background: escuchando ? "rgba(251,113,133,0.2)" : "rgba(255,255,255,0.06)",
              boxShadow: escuchando ? "0 0 12px rgba(251,113,133,0.4)" : "none"
            }}>
            {escuchando ? <MicOff size={15} color="#fb7185" /> : <Mic size={15} color="#64748b" />}
          </button>

          {textoIA && !escuchando && (
            <button onClick={analizarConIA} disabled={loadingIA}
              style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer", flexShrink: 0 }}>
              {loadingIA ? "..." : "✨ Añadir"}
            </button>
          )}
        </div>

        {/* Resumen 4 bloques */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          {[
            { label: "Ingresos", value: ingresos, color: "#34d399", bg: "rgba(52,211,153,0.08)" },
            { label: "Gastos", value: gastos, color: "#fb7185", bg: "rgba(251,113,133,0.08)" },
            { label: "Inversiones", value: inversiones, color: "#818cf8", bg: "rgba(129,140,248,0.08)" },
            { label: "Ahorro", value: ahorro, color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ ...glass, padding: "16px", backgroundColor: bg }}>
              <p style={{ color: "#64748b", fontSize: "11px", fontWeight: "500", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <p style={{ color, fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>{value.toFixed(2)}€</p>
            </div>
          ))}
        </div>

        {/* Resultado neto */}
        <div style={{ ...glass, padding: "20px", textAlign: "center", marginBottom: "24px", background: neto >= 0 ? "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(6,182,212,0.05))" : "linear-gradient(135deg, rgba(251,113,133,0.08), rgba(239,68,68,0.05))" }}>
          <p style={{ color: "#64748b", fontSize: "12px", fontWeight: "500", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Resultado neto del mes</p>
          <p style={{ color: neto >= 0 ? "#34d399" : "#fb7185", fontSize: "38px", fontWeight: "800", margin: 0, letterSpacing: "-1px" }}>
            {neto >= 0 ? "+" : ""}{neto.toFixed(2)}€
          </p>
        </div>

        {/* Lista transacciones */}
        <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "12px", textTransform: "uppercase" }}>Este mes</p>

        {transaccionesMes.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>Aún no hay registros este mes</p>
          </div>
        )}

        {[...transaccionesMes].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).map(t => {
          const tipo = TIPOS[t.type] || TIPOS.expense;
          const Icono = tipo.icon;
          return (
            <div key={t.id}>
              <div onClick={() => setSelectedTransaction(selectedTransaction?.id === t.id ? null : t)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: tipo.color + "15", border: `1px solid ${tipo.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icono size={16} color={tipo.color} />
                  </div>
                  <div>
                    <p style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: "500", margin: 0 }}>{t.concept}</p>
                    <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>{t.category}</p>
                  </div>
                </div>
                <p style={{ color: tipo.color, fontWeight: "700", margin: 0, fontSize: "15px" }}>{Number(t.amount).toFixed(2)}€</p>
              </div>

              {selectedTransaction?.id === t.id && (
                <div style={{ display: "flex", gap: "8px", padding: "8px 0 12px 0" }}>
                  <button onClick={() => editar(t)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => eliminar(t.id)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(251,113,133,0.2)", backgroundColor: "rgba(251,113,133,0.08)", color: "#fb7185", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <p style={{ color: "#1e293b", fontSize: "11px", textAlign: "center", marginTop: "32px" }}>hecho por Nano</p>
      </div>

      {/* Botón + flotante */}
      <button onClick={() => { setSugerencia(null); setEditingId(null); setForm({ type: "expense", concept: "", amount: "", category: "Otros" }); setShowForm(true); }}
        style={{ position: "fixed", bottom: "84px", right: "20px", width: "54px", height: "54px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}>
        <Plus size={22} color="white" />
      </button>

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px 28px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: 0 }}>
                {editingId ? "✏️ Editar registro" : sugerencia ? "✨ Revisar registro" : "Nuevo registro"}
              </h3>
              <button onClick={() => { setShowForm(false); setSugerencia(null); setEditingId(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
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

            {[
              { placeholder: "Concepto", key: "concept", type: "text" },
              { placeholder: "Importe en €", key: "amount", type: "number" },
            ].map(({ placeholder, key, type }) => (
              <input key={key} placeholder={placeholder} type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            ))}

            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }}>
              {["Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"].map(c => (
                <option key={c} value={c} style={{ backgroundColor: "#0f172a" }}>{c}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowForm(false); setSugerencia(null); setEditingId(null); }}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>
                {editingId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}