import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { TrendingUp, TrendingDown, PiggyBank, BarChart2, Plus, LogOut, Sparkles, X } from "lucide-react";
import { analizarTexto } from "../lib/gemini";

const TIPOS = {
  income: { label: "Ingreso", color: "#10B981", icon: TrendingUp },
  expense: { label: "Gasto", color: "#F87171", icon: TrendingDown },
  investment: { label: "Inversión", color: "#60A5FA", icon: BarChart2 },
  saving: { label: "Ahorro", color: "#FBBF24", icon: PiggyBank },
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", concept: "", amount: "", category: "Otros" });
  const [textoIA, setTextoIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const [sugerencia, setSugerencia] = useState(null);
  const user = auth.currentUser;

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);
    });
    return unsub;
  }, []);

  const transaccionesMes = transactions.filter(t => {
    const fecha = t.date?.toDate?.() || new Date(t.date);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
  });

  const total = (tipo) => transaccionesMes
    .filter(t => t.type === tipo)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const ingresos = total("income");
  const gastos = total("expense");
  const inversiones = total("investment");
  const ahorro = total("saving");
  const neto = ingresos - gastos - inversiones - ahorro;

  const analizarConIA = async () => {
    if (!textoIA.trim()) return;
    setLoadingIA(true);
    const resultado = await analizarTexto(textoIA);
    if (resultado) {
      setSugerencia(resultado);
      setForm({
        type: resultado.type || "expense",
        concept: resultado.concept || "",
        amount: resultado.amount || "",
        category: resultado.category || "Otros",
      });
      setShowForm(true);
    }
    setLoadingIA(false);
    setTextoIA("");
  };

  const guardar = async () => {
    if (!form.concept || !form.amount) return;
    await addDoc(collection(db, "transactions"), {
      ...form,
      amount: Number(form.amount),
      date: Timestamp.now(),
      userId: user.uid,
      household: "hogar_principal",
    });
    setForm({ type: "expense", concept: "", amount: "", category: "Otros" });
    setSugerencia(null);
    setShowForm(false);
  };

  return (
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "24px", paddingBottom: "16px" }}>
          <div>
            <h1 style={{ color: "#10B981", fontSize: "24px", fontWeight: "bold", margin: 0 }}>FinApp</h1>
            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>
              {now.toLocaleString("es-ES", { month: "long", year: "numeric" })}
            </p>
          </div>
          <button onClick={() => signOut(auth)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
            <LogOut size={20} color="#9CA3AF" />
          </button>
        </div>

        {/* Input IA */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "16px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Sparkles size={18} color="#10B981" style={{ flexShrink: 0 }} />
          <input
            placeholder='Escribe: "200€ Mercadona" o "Nómina 1800€"'
            value={textoIA}
            onChange={e => setTextoIA(e.target.value)}
            onKeyDown={e => e.key === "Enter" && analizarConIA()}
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F9FAFB", fontSize: "14px" }}
          />
          {textoIA && (
            <button
              onClick={analizarConIA}
              disabled={loadingIA}
              style={{ backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
            >
              {loadingIA ? "..." : "Añadir"}
            </button>
          )}
        </div>

        {/* Resumen 4 bloques */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Ingresos", value: ingresos, color: "#10B981" },
            { label: "Gastos", value: gastos, color: "#F87171" },
            { label: "Inversiones", value: inversiones, color: "#60A5FA" },
            { label: "Ahorro", value: ahorro, color: "#FBBF24" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: "#1C1C1E", borderRadius: "16px", padding: "16px" }}>
              <p style={{ color: "#9CA3AF", fontSize: "12px", margin: "0 0 4px 0" }}>{label}</p>
              <p style={{ color, fontSize: "20px", fontWeight: "bold", margin: 0 }}>{value.toFixed(2)}€</p>
            </div>
          ))}
        </div>

        {/* Resultado neto */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "16px", padding: "20px", textAlign: "center", marginBottom: "24px" }}>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 6px 0" }}>Resultado neto del mes</p>
          <p style={{ color: neto >= 0 ? "#10B981" : "#F87171", fontSize: "36px", fontWeight: "bold", margin: 0 }}>
            {neto >= 0 ? "+" : ""}{neto.toFixed(2)}€
          </p>
        </div>

        {/* Lista transacciones */}
        <p style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", marginBottom: "12px" }}>ESTE MES</p>

        {transaccionesMes.length === 0 && (
          <p style={{ color: "#4B5563", textAlign: "center", padding: "40px 0" }}>Aún no hay registros este mes</p>
        )}

        {[...transaccionesMes]
          .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
          .map(t => {
            const tipo = TIPOS[t.type] || TIPOS.expense;
            const Icono = tipo.icon;
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1F1F1F" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: tipo.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icono size={16} color={tipo.color} />
                  </div>
                  <div>
                    <p style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: "500", margin: 0 }}>{t.concept}</p>
                    <p style={{ color: "#6B7280", fontSize: "12px", margin: 0 }}>{t.category}</p>
                  </div>
                </div>
                <p style={{ color: tipo.color, fontWeight: "600", margin: 0 }}>{Number(t.amount).toFixed(2)}€</p>
              </div>
            );
          })}
      </div>

      {/* Botón + flotante */}
      <button
        onClick={() => { setSugerencia(null); setForm({ type: "expense", concept: "", amount: "", category: "Otros" }); setShowForm(true); }}
        style={{ position: "fixed", bottom: "80px", right: "24px", width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#10B981", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}
      >
        <Plus size={24} color="white" />
      </button>

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#1C1C1E", borderRadius: "24px 24px 0 0", padding: "24px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", margin: 0 }}>
                {sugerencia ? "✨ Revisá el registro" : "Nuevo registro"}
              </h3>
              <button onClick={() => { setShowForm(false); setSugerencia(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {Object.entries(TIPOS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, type: key })}
                  style={{ padding: "8px 4px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "600", backgroundColor: form.type === key ? val.color : "#2D2D2D", color: form.type === key ? "white" : "#9CA3AF" }}
                >
                  {val.label}
                </button>
              ))}
            </div>

            <input
              placeholder="Concepto"
              value={form.concept}
              onChange={e => setForm({ ...form, concept: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
            />
            <input
              placeholder="Importe en €"
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", backgroundColor: "#2D2D2D", border: "none", borderRadius: "12px", padding: "14px 16px", color: "white", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }}
            >
              {["Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => { setShowForm(false); setSugerencia(null); }}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#2D2D2D", color: "#9CA3AF", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#10B981", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}