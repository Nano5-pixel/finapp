import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { TrendingUp, PiggyBank, Wallet, BarChart2 } from "lucide-react";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Patrimonio({ householdId }) {
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [huchas, setHuchas] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    if (!householdId) return;
    const unsub1 = onSnapshot(query(collection(db, "transactions"), where("household", "==", householdId)), snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub2 = onSnapshot(query(collection(db, "investments"), where("household", "==", householdId)), snap => setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub3 = onSnapshot(query(collection(db, "huchas"), where("household", "==", householdId)), snap => setHuchas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [householdId]);

  useEffect(() => {
    if (investments.length > 0) fetchPrices();
  }, [investments]);

  const fetchPrices = async () => {
    const newPrices = {};
    for (const pos of investments) {
      try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${pos.ticker}?interval=1d&range=1d`)}`);
        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price) newPrices[pos.ticker] = price;
      } catch {}
    }
    setPrices(newPrices);
  };

  // Ahorro acumulado de todas las transacciones
  const totalAhorro = transactions
    .filter(t => t.type === "saving")
    .reduce((a, t) => a + Number(t.amount), 0);

  // Valor actual inversiones
  const totalInversiones = investments.reduce((a, p) => {
    const precioActual = prices[p.ticker] || p.buyPrice;
    return a + p.shares * precioActual;
  }, 0);

  const totalInvertido = investments.reduce((a, p) => a + p.shares * p.buyPrice, 0);
  const rentabilidad = totalInversiones - totalInvertido;

  // Total huchas
  const totalHuchas = huchas.reduce((a, h) => a + h.saldo, 0);

  // Patrimonio neto total
  const patrimonioTotal = totalAhorro + totalInversiones + totalHuchas;

  const bloques = [
    {
      label: "Ahorro acumulado",
      valor: totalAhorro,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      icon: PiggyBank,
      detalle: "Total transacciones de tipo ahorro"
    },
    {
      label: "Inversiones",
      valor: totalInversiones,
      color: "#818cf8",
      bg: "rgba(129,140,248,0.08)",
      icon: TrendingUp,
      detalle: `Rentabilidad: ${rentabilidad >= 0 ? "+" : ""}${rentabilidad.toFixed(2)}€`
    },
    {
      label: "Huchas",
      valor: totalHuchas,
      color: "#34d399",
      bg: "rgba(52,211,153,0.08)",
      icon: Wallet,
      detalle: `${huchas.length} hucha${huchas.length !== 1 ? "s" : ""}`
    },
  ];

  const porcentaje = (valor) => patrimonioTotal > 0 ? (valor / patrimonioTotal) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Patrimonio</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Visión general de tu riqueza</p>
        </div>

        {/* Patrimonio total */}
        <div style={{ ...glass, padding: "24px", marginBottom: "16px", background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))", textAlign: "center" }}>
          <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 12px 0", textTransform: "uppercase" }}>Patrimonio neto total</p>
          <p style={{ color: "#f1f5f9", fontSize: "44px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-2px" }}>
            {patrimonioTotal.toFixed(2)}€
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <BarChart2 size={14} color="#6366f1" />
            <p style={{ color: "#6366f1", fontSize: "13px", margin: 0, fontWeight: "600" }}>
              {investments.length} ETF{investments.length !== 1 ? "s" : ""} · {huchas.length} hucha{huchas.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Barra de distribución */}
        {patrimonioTotal > 0 && (
          <div style={{ ...glass, padding: "20px", marginBottom: "16px" }}>
            <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 14px 0", textTransform: "uppercase" }}>Distribución</p>
            <div style={{ display: "flex", borderRadius: "99px", overflow: "hidden", height: "10px", marginBottom: "14px" }}>
              <div style={{ width: `${porcentaje(totalAhorro)}%`, backgroundColor: "#fbbf24", transition: "width 0.4s" }} />
              <div style={{ width: `${porcentaje(totalInversiones)}%`, backgroundColor: "#818cf8", transition: "width 0.4s" }} />
              <div style={{ width: `${porcentaje(totalHuchas)}%`, backgroundColor: "#34d399", transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {[
                { label: "Ahorro", color: "#fbbf24", pct: porcentaje(totalAhorro) },
                { label: "Inversiones", color: "#818cf8", pct: porcentaje(totalInversiones) },
                { label: "Huchas", color: "#34d399", pct: porcentaje(totalHuchas) },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: item.color }} />
                  <span style={{ color: "#64748b", fontSize: "12px" }}>{item.label}: {item.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bloques detalle */}
        {bloques.map(({ label, valor, color, bg, icon: Icono, detalle }) => (
          <div key={label} style={{ ...glass, padding: "20px", marginBottom: "12px", backgroundColor: bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: color + "20", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icono size={18} color={color} />
                </div>
                <div>
                  <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>{label}</p>
                  <p style={{ color: "#475569", fontSize: "12px", margin: "2px 0 0 0" }}>{detalle}</p>
                </div>
              </div>
              <p style={{ color, fontSize: "18px", fontWeight: "800", margin: 0 }}>{valor.toFixed(0)}€</p>
            </div>
          </div>
        ))}

        {patrimonioTotal === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>Aún no hay datos de patrimonio</p>
          </div>
        )}
      </div>
    </div>
  );
}