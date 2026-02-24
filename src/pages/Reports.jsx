import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeft } from "lucide-react";

const COLORES = ["#10B981", "#F87171", "#60A5FA", "#FBBF24", "#A78BFA", "#F472B6", "#34D399", "#FB923C"];

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function Reports({ onBack }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  const transaccionesMes = transactions.filter(t => {
    const fecha = t.date?.toDate?.() || new Date(t.date);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
  });

  // Datos para gráfica de dona (gastos por categoría)
  const gastosPorCategoria = transaccionesMes
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

  const donaData = Object.entries(gastosPorCategoria).map(([name, value]) => ({ name, value }));

  // Datos para gráfica de barras (últimos 6 meses)
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
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 80px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "24px", paddingBottom: "20px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
            <ArrowLeft size={22} color="#9CA3AF" />
          </button>
          <div>
            <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: "bold", margin: 0 }}>Reportes</h1>
            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>
              {now.toLocaleString("es-ES", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Gráfica de dona */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "20px", padding: "20px", marginBottom: "16px" }}>
          <p style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: "0 0 16px 0" }}>GASTOS POR CATEGORÍA</p>
          {donaData.length === 0 ? (
            <p style={{ color: "#4B5563", textAlign: "center", padding: "40px 0" }}>Sin gastos este mes</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donaData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {donaData.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)}€`} contentStyle={{ backgroundColor: "#1C1C1E", border: "1px solid #2D2D2D", borderRadius: "8px", color: "white" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {donaData.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORES[i % COLORES.length] }} />
                    <span style={{ color: "#9CA3AF", fontSize: "12px" }}>{item.name}: {item.value.toFixed(0)}€</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Gráfica de barras */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "20px", padding: "20px" }}>
          <p style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: "0 0 16px 0" }}>INGRESOS VS GASTOS</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(value) => `${value.toFixed(2)}€`} contentStyle={{ backgroundColor: "#1C1C1E", border: "1px solid #2D2D2D", borderRadius: "8px", color: "white" }} />
              <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#F87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#10B981" }} />
              <span style={{ color: "#9CA3AF", fontSize: "12px" }}>Ingresos</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#F87171" }} />
              <span style={{ color: "#9CA3AF", fontSize: "12px" }}>Gastos</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}