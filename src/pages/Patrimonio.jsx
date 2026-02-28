import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { TrendingUp, PiggyBank, Wallet, BarChart2, ChevronDown, ChevronUp } from "lucide-react";

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
  const [expandido, setExpandido] = useState(null);

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

  const transaccionesAhorro = transactions.filter(t => t.type === "saving");
  const totalAhorro = transaccionesAhorro.reduce((a, t) => a + Number(t.amount), 0);

  const totalInversiones = investments.reduce((a, p) => {
    const precioActual = prices[p.ticker] || p.buyPrice;
    return a + p.shares * precioActual;
  }, 0);
  const totalInvertido = investments.reduce((a, p) => a + p.shares * p.buyPrice, 0);
  const rentabilidad = totalInversiones - totalInvertido;

  const totalHuchas = huchas.reduce((a, h) => a + h.saldo, 0);
  const patrimonioTotal = totalAhorro + totalInversiones + totalHuchas;

  const porcentaje = (valor) => patrimonioTotal > 0 ? (valor / patrimonioTotal) * 100 : 0;

  const toggleExpandido = (key) => setExpandido(expandido === key ? null : key);

  const formatFecha = (date) => {
    const f = date?.toDate ? date.toDate() : new Date(date);
    return `${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()}`;
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Patrimonio</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Visión general de tu riqueza</p>
        </div>

        <div style={{ ...glass, padding: "24px", marginBottom: "16px", background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))", textAlign: "center" }}>
          <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 12px 0", textTransform: "uppercase" }}>Patrimonio neto total</p>
          <p style={{ color: "#f1f5f9", fontSize: "44px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-2px" }}>{patrimonioTotal.toFixed(2)}€</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <BarChart2 size={14} color="#6366f1" />
            <p style={{ color: "#6366f1", fontSize: "13px", margin: 0, fontWeight: "600" }}>
              {investments.length} ETF{investments.length !== 1 ? "s" : ""} · {huchas.length} hucha{huchas.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

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

        {/* Bloque Ahorro */}
        <div style={{ ...glass, marginBottom: "12px", overflow: "hidden", backgroundColor: "rgba(251,191,36,0.08)" }}>
          <div onClick={() => toggleExpandido("ahorro")}
            style={{ padding: "20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PiggyBank size={18} color="#fbbf24" />
              </div>
              <div>
                <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>Ahorro acumulado</p>
                <p style={{ color: "#475569", fontSize: "12px", margin: "2px 0 0 0" }}>{transaccionesAhorro.length} transacciones</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <p style={{ color: "#fbbf24", fontSize: "18px", fontWeight: "800", margin: 0 }}>{totalAhorro.toFixed(0)}€</p>
              {expandido === "ahorro" ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
            </div>
          </div>
          {expandido === "ahorro" && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 16px" }}>
              {transaccionesAhorro.length === 0 && (
                <p style={{ color: "#334155", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>No hay transacciones de ahorro</p>
              )}
              {[...transaccionesAhorro].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "500", margin: 0 }}>{t.concept}</p>
                    <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{t.category} · {formatFecha(t.date)}</p>
                  </div>
                  <p style={{ color: "#fbbf24", fontSize: "13px", fontWeight: "700", margin: 0 }}>+{Number(t.amount).toFixed(2)}€</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloque Inversiones */}
        <div style={{ ...glass, marginBottom: "12px", overflow: "hidden", backgroundColor: "rgba(129,140,248,0.08)" }}>
          <div onClick={() => toggleExpandido("inversiones")}
            style={{ padding: "20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={18} color="#818cf8" />
              </div>
              <div>
                <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>Inversiones</p>
                <p style={{ color: rentabilidad >= 0 ? "#34d399" : "#fb7185", fontSize: "12px", margin: "2px 0 0 0" }}>
                  Rentabilidad: {rentabilidad >= 0 ? "+" : ""}{rentabilidad.toFixed(2)}€
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <p style={{ color: "#818cf8", fontSize: "18px", fontWeight: "800", margin: 0 }}>{totalInversiones.toFixed(0)}€</p>
              {expandido === "inversiones" ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
            </div>
          </div>
          {expandido === "inversiones" && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 16px" }}>
              {investments.length === 0 && (
                <p style={{ color: "#334155", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>No hay inversiones registradas</p>
              )}
              {investments.map(p => {
                const precioActual = prices[p.ticker] || p.buyPrice;
                const valorActual = p.shares * precioActual;
                const ganancia = valorActual - p.shares * p.buyPrice;
                return (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "500", margin: 0 }}>{p.ticker}</p>
                      <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{p.shares} participaciones · {ganancia >= 0 ? "+" : ""}{ganancia.toFixed(2)}€</p>
                    </div>
                    <p style={{ color: "#818cf8", fontSize: "13px", fontWeight: "700", margin: 0 }}>{valorActual.toFixed(0)}€</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bloque Huchas */}
        <div style={{ ...glass, marginBottom: "12px", overflow: "hidden", backgroundColor: "rgba(52,211,153,0.08)" }}>
          <div onClick={() => toggleExpandido("huchas")}
            style={{ padding: "20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={18} color="#34d399" />
              </div>
              <div>
                <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>Huchas</p>
                <p style={{ color: "#475569", fontSize: "12px", margin: "2px 0 0 0" }}>{huchas.length} hucha{huchas.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <p style={{ color: "#34d399", fontSize: "18px", fontWeight: "800", margin: 0 }}>{totalHuchas.toFixed(0)}€</p>
              {expandido === "huchas" ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
            </div>
          </div>
          {expandido === "huchas" && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 16px" }}>
              {huchas.length === 0 && (
                <p style={{ color: "#334155", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>No hay huchas creadas</p>
              )}
              {huchas.map(h => (
                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>{h.emoji}</span>
                    <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "500", margin: 0 }}>{h.nombre}</p>
                  </div>
                  <p style={{ color: "#34d399", fontSize: "13px", fontWeight: "700", margin: 0 }}>{h.saldo.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {patrimonioTotal === 0 && (
          <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#334155", margin: 0 }}>Aún no hay datos de patrimonio</p>
          </div>
        )}
      </div>
    </div>
  );
}