import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LogOut, Home, TrendingUp, TrendingDown, PiggyBank, BarChart2 } from "lucide-react";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

export default function Profile() {
  const [transactions, setTransactions] = useState([]);
  const user = auth.currentUser;

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub = onSnapshot(q, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const transaccionesMes = transactions.filter(t => {
    const f = t.date?.toDate?.() || new Date(t.date);
    return f.getMonth() === mesActual && f.getFullYear() === añoActual;
  });

  const total = (tipo) => transaccionesMes.filter(t => t.type === tipo).reduce((acc, t) => acc + Number(t.amount), 0);

  const ingresos = total("income");
  const gastos = total("expense");
  const inversiones = total("investment");
  const ahorro = total("saving");

  const iniciales = user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Perfil</h1>
        </div>

        {/* Avatar y datos */}
        <div style={{ ...glass, padding: "20px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontSize: "20px", fontWeight: "800" }}>{iniciales}</span>
          </div>
          <div>
            <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>{user?.email}</p>
            <p style={{ color: "#475569", fontSize: "13px", margin: "4px 0 0 0" }}>Miembro del hogar</p>
          </div>
        </div>

        {/* Hogar */}
        <div style={{ ...glass, padding: "18px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={16} color="#6366f1" />
            </div>
            <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: 0 }}>Hogar Principal</p>
          </div>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
            Todos los registros se comparten entre los miembros del hogar en tiempo real.
          </p>
        </div>

        {/* Resumen del mes */}
        <div style={{ ...glass, padding: "18px", marginBottom: "12px" }}>
          <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 16px 0", textTransform: "uppercase" }}>
            Resumen de {now.toLocaleString("es-ES", { month: "long" })}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { label: "Ingresos", value: ingresos, color: "#34d399", icon: TrendingUp },
              { label: "Gastos", value: gastos, color: "#fb7185", icon: TrendingDown },
              { label: "Inversiones", value: inversiones, color: "#818cf8", icon: BarChart2 },
              { label: "Ahorro", value: ahorro, color: "#fbbf24", icon: PiggyBank },
            ].map(({ label, value, color, icon: Icono }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: color + "15", border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icono size={15} color={color} />
                </div>
                <div>
                  <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{label}</p>
                  <p style={{ color, fontSize: "14px", fontWeight: "700", margin: 0 }}>{value.toFixed(0)}€</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registros este mes */}
        <div style={{ ...glass, padding: "18px", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Registros este mes</p>
            <div style={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "4px 12px" }}>
              <p style={{ color: "#6366f1", fontSize: "16px", fontWeight: "700", margin: 0 }}>{transaccionesMes.length}</p>
            </div>
          </div>
        </div>

        {/* Cerrar sesión */}
        <button onClick={() => signOut(auth)}
          style={{ width: "100%", backgroundColor: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "16px", padding: "16px", color: "#fb7185", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "opacity 0.2s" }}>
          <LogOut size={18} />
          Cerrar sesión
        </button>

        <p style={{ color: "#1e293b", fontSize: "11px", textAlign: "center", marginTop: "24px" }}>hecho por Nano</p>
      </div>
    </div>
  );
}