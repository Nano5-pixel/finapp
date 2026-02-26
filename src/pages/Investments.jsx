import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, X, Trash2, TrendingUp, TrendingDown, RefreshCw, Pencil } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

const PROXY = "https://query1.finance.yahoo.com/v8/finance/chart/";

export default function Investments() {
  const [positions, setPositions] = useState([]);
  const [prices, setPrices] = useState({});
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditPrice, setShowEditPrice] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [form, setForm] = useState({ ticker: "", name: "", shares: "", buyPrice: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "investments"), where("household", "==", "hogar_principal"));
    const unsub = onSnapshot(q, snap => {
      setPositions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (positions.length > 0) fetchPrices();
  }, [positions]);

  const fetchPrice = async (ticker) => {
    try {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`${PROXY}${ticker}?interval=1d&range=1d`)}`);
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      return price || null;
    } catch {
      return null;
    }
  };

  const fetchHistory = async (ticker) => {
    try {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`${PROXY}${ticker}?interval=1d&range=1mo`)}`);
      const data = await res.json();
      const timestamps = data?.chart?.result?.[0]?.timestamp;
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      if (!timestamps || !closes) return [];
      return timestamps.map((t, i) => ({
        fecha: new Date(t * 1000).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
        precio: closes[i] ? Number(closes[i].toFixed(2)) : null,
      })).filter(d => d.precio !== null);
    } catch {
      return [];
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    const newPrices = {};
    for (const pos of positions) {
      const price = await fetchPrice(pos.ticker);
      if (price) newPrices[pos.ticker] = price;
    }
    setPrices(newPrices);

    if (positions[0]) {
      const hist = await fetchHistory(positions[0].ticker);
      setHistory(hist);
    }
    setLoading(false);
  };

  const guardar = async () => {
    if (!form.ticker || !form.shares || !form.buyPrice) return;
    await addDoc(collection(db, "investments"), {
      household: "hogar_principal",
      ticker: form.ticker.toUpperCase(),
      name: form.name || form.ticker.toUpperCase(),
      shares: Number(form.shares),
      buyPrice: Number(form.buyPrice),
    });
    setForm({ ticker: "", name: "", shares: "", buyPrice: "" });
    setShowForm(false);
  };

  const actualizarPrecio = async (id) => {
    if (!newPrice) return;
    await updateDoc(doc(db, "investments", id), { buyPrice: Number(newPrice) });
    setShowEditPrice(null);
    setNewPrice("");
  };

  const eliminar = async (id) => await deleteDoc(doc(db, "investments", id));

  const totalInvertido = positions.reduce((a, p) => a + p.shares * p.buyPrice, 0);
  const totalActual = positions.reduce((a, p) => a + p.shares * (prices[p.ticker] || p.buyPrice), 0);
  const rentabilidadTotal = totalActual - totalInvertido;
  const rentabilidadPct = totalInvertido > 0 ? (rentabilidadTotal / totalInvertido) * 100 : 0;

  const TICKERS_POPULARES = [
  { ticker: "CSPX.L", name: "Core S&P 500 USD (Acc)" },
  { ticker: "VZLD.DE", name: "Strategic Metals USD-EUR" },
  { ticker: "SEMI.L", name: "Semiconductor USD (Acc)" },
  { ticker: "EUNK.DE", name: "Core MSCI Europe EUR (Acc)" },
  { ticker: "VWCE.DE", name: "Vanguard FTSE All-World" },
  { ticker: "IWDA.AS", name: "iShares Core MSCI World" },
  { ticker: "VUSA.AS", name: "Vanguard S&P 500" },
];

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: "28px", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Inversiones</h1>
            <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Portfolio Trade Republic</p>
          </div>
          <button onClick={fetchPrices} disabled={loading}
            style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer" }}>
            <RefreshCw size={16} color={loading ? "#6366f1" : "#475569"} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>

        {/* Resumen portfolio */}
        {positions.length > 0 && (
          <div style={{ ...glass, padding: "20px", marginBottom: "14px", background: rentabilidadTotal >= 0 ? "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(6,182,212,0.05))" : "linear-gradient(135deg, rgba(251,113,133,0.08), rgba(239,68,68,0.05))" }}>
            <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 12px 0", textTransform: "uppercase" }}>Resumen portfolio</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 4px 0" }}>Invertido</p>
                <p style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "700", margin: 0 }}>{totalInvertido.toFixed(0)}€</p>
              </div>
              <div>
                <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 4px 0" }}>Actual</p>
                <p style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "700", margin: 0 }}>{totalActual.toFixed(0)}€</p>
              </div>
              <div>
                <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 4px 0" }}>Rentabilidad</p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {rentabilidadTotal >= 0 ? <TrendingUp size={14} color="#34d399" /> : <TrendingDown size={14} color="#fb7185" />}
                  <p style={{ color: rentabilidadTotal >= 0 ? "#34d399" : "#fb7185", fontSize: "16px", fontWeight: "700", margin: 0 }}>
                    {rentabilidadPct >= 0 ? "+" : ""}{rentabilidadPct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfica histórico */}
        {history.length > 0 && (
          <div style={{ ...glass, padding: "20px", marginBottom: "14px" }}>
            <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 16px 0", textTransform: "uppercase" }}>
              Evolución {positions[0]?.ticker} (1 mes)
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} width={50} domain={["auto", "auto"]} />
                <Tooltip formatter={(v) => `${v.toFixed(2)}€`} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#f1f5f9" }} />
                <Line type="monotone" dataKey="precio" stroke="url(#gradient)" strokeWidth={2} dot={false} />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Botón añadir */}
        <button onClick={() => setShowForm(true)}
          style={{ ...glass, width: "100%", border: "1px dashed rgba(99,102,241,0.4)", borderRadius: "16px", padding: "14px", color: "#6366f1", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px", backgroundColor: "rgba(99,102,241,0.05)" }}>
          <Plus size={18} /> Añadir ETF
        </button>

        {positions.length === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>No hay posiciones registradas aún</p>
          </div>
        )}

        {/* Lista posiciones */}
        {positions.map(p => {
          const precioActual = prices[p.ticker] || p.buyPrice;
          const valorActual = p.shares * precioActual;
          const valorCompra = p.shares * p.buyPrice;
          const ganancia = valorActual - valorCompra;
          const gananciaP = ((precioActual - p.buyPrice) / p.buyPrice) * 100;
          const positivo = ganancia >= 0;

          return (
            <div key={p.id} style={{ ...glass, padding: "16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#818cf8", fontSize: "10px", fontWeight: "800" }}>{p.ticker.slice(0, 4)}</span>
                  </div>
                  <div>
                    <p style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: "600", margin: 0 }}>{p.ticker}</p>
                    <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{p.name?.slice(0, 30)}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setShowEditPrice(p.id); setNewPrice(p.buyPrice); }}
                    style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Pencil size={14} color="#334155" />
                  </button>
                  <button onClick={() => eliminar(p.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Trash2 size={14} color="#334155" />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <p style={{ color: "#475569", fontSize: "10px", margin: "0 0 2px 0" }}>Participaciones</p>
                  <p style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", margin: 0 }}>{p.shares}</p>
                </div>
                <div>
                  <p style={{ color: "#475569", fontSize: "10px", margin: "0 0 2px 0" }}>Precio actual</p>
                  <p style={{ color: prices[p.ticker] ? "#f1f5f9" : "#475569", fontSize: "13px", fontWeight: "600", margin: 0 }}>
                    {precioActual.toFixed(2)}€ {!prices[p.ticker] && "↻"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#475569", fontSize: "10px", margin: "0 0 2px 0" }}>Valor</p>
                  <p style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", margin: 0 }}>{valorActual.toFixed(0)}€</p>
                </div>
                <div>
                  <p style={{ color: "#475569", fontSize: "10px", margin: "0 0 2px 0" }}>Rentabilidad</p>
                  <p style={{ color: positivo ? "#34d399" : "#fb7185", fontSize: "13px", fontWeight: "700", margin: 0 }}>
                    {positivo ? "+" : ""}{gananciaP.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "10px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#475569", fontSize: "12px" }}>Ganancia/Pérdida</span>
                <span style={{ color: positivo ? "#34d399" : "#fb7185", fontSize: "12px", fontWeight: "700" }}>
                  {positivo ? "+" : ""}{ganancia.toFixed(2)}€
                </span>
              </div>

              {/* Editar precio de compra */}
              {showEditPrice === p.id && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                  <input placeholder="Nuevo precio medio €" type="number" value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "8px 12px", color: "#f1f5f9", fontSize: "13px", outline: "none" }} />
                  <button onClick={() => actualizarPrecio(p.id)}
                    style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", border: "none", borderRadius: "10px", padding: "8px 14px", color: "white", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                    OK
                  </button>
                  <button onClick={() => setShowEditPrice(null)}
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer" }}>
                    <X size={14} color="#64748b" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal añadir ETF */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px 28px 0 0", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: 0 }}>Añadir ETF</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* ETFs populares */}
            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 8px 0" }}>ETFs populares en Trade Republic</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              {TICKERS_POPULARES.map(t => (
                <button key={t.ticker} onClick={() => setForm({ ...form, ticker: t.ticker, name: t.name })}
                  style={{ padding: "5px 10px", borderRadius: "8px", border: form.ticker === t.ticker ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)", backgroundColor: form.ticker === t.ticker ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", color: form.ticker === t.ticker ? "#818cf8" : "#64748b", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                  {t.ticker}
                </button>
              ))}
            </div>

            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 8px 0" }}>O escribe el ticker manualmente</p>
            <input placeholder="Ej: VWCE.DE, IWDA.AS..." value={form.ticker}
              onChange={e => setForm({ ...form, ticker: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <input placeholder="Nombre del ETF" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <input placeholder="Número de participaciones" type="number" value={form.shares}
              onChange={e => setForm({ ...form, shares: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
            <input placeholder="Precio medio de compra en €" type="number" value={form.buyPrice}
              onChange={e => setForm({ ...form, buyPrice: e.target.value })}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 16px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} />

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