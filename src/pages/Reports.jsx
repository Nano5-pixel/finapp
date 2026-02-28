import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORES = ["#6366f1", "#34d399", "#06b6d4", "#fbbf24", "#fb7185", "#a78bfa", "#f472b6", "#818cf8"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Reports({ householdId }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!householdId) return;
    const q = query(collection(db, "transactions"), where("household", "==", householdId));
    const unsub = onSnapshot(q, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [householdId]);

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  const transaccionesMes = transactions.filter(t => {
    const f = t.date?.toDate?.() || new Date(t.date);
    return f.getMonth() === mesActual && f.getFullYear() === añoActual;
  });

  const gastosPorCategoria = transaccionesMes.filter(t => t.type === "expense").reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  const donaData = Object.entries(gastosPorCategoria).map(([name, value]) => ({ name, value }));

  const barData = Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(añoActual, mesActual - 5 + i, 1);
    const mes = fecha.getMonth();
    const año = fecha.getFullYear();
    const trans = transactions.filter(t => {
      const f = t.date?.toDate?.() || new Date(t.date);
      return f.getMonth() === mes && f.getFullYear() === año;
    });
    return {
      mes: MESES[mes],
      Ingresos: trans.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0),
      Gastos: trans.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0),
    };
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Reportes</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>
            {now.toLocaleString("es-ES", { month: "long", year: "numeric" })}
          </p>
        </div>

        <div style={{ ...glass, padding: "20px", marginBottom: "14px" }}>
          <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 16px 0", textTransform: "uppercase" }}>Gastos por categoría</p>
          {donaData.length === 0 ? (
            <p style={{ color: "#334155", textAlign: "center", padding: "40px 0" }}>Sin gastos este mes</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donaData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {donaData.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toFixed(2)}€`} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {donaData.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORES[i % COLORES.length] }} />
                    <span style={{ color: "#64748b", fontSize: "12px" }}>{item.name}: {item.value.toFixed(0)}€</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ ...glass, padding: "20px" }}>
          <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 16px 0", textTransform: "uppercase" }}>Ingresos vs Gastos</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => `${v.toFixed(2)}€`} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#f1f5f9" }} />
              <Bar dataKey="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#34d399" }} />
              <span style={{ color: "#64748b", fontSize: "12px" }}>Ingresos</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#fb7185" }} />
              <span style={{ color: "#64748b", fontSize: "12px" }}>Gastos</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}