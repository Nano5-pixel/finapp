import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LogOut, User, Home, TrendingUp, TrendingDown, PiggyBank, BarChart2 } from "lucide-react";

export default function Profile() {
  const [transactions, setTransactions] = useState([]);
  const user = auth.currentUser;

  const now = new Date();
  const mesActual = now.getMonth();
  const añoActual = now.getFullYear();

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("household", "==", "hogar_principal"));
    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const transaccionesMes = transactions.filter(t => {
    const f = t.date?.toDate?.() || new Date(t.date);
    return f.getMonth() === mesActual && f.getFullYear() === añoActual;
  });

  const total = (tipo) => transaccionesMes
    .filter(t => t.type === tipo)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const ingresos = total("income");
  const gastos = total("expense");
  const inversiones = total("investment");
  const ahorro = total("saving");

  const iniciales = user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        {/* Header */}
        <div style={{ paddingTop: "24px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: "bold", margin: 0 }}>Perfil</h1>
        </div>

        {/* Avatar y datos usuario */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "20px", padding: "24px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontSize: "22px", fontWeight: "bold" }}>{iniciales}</span>
          </div>
          <div>
            <p style={{ color: "#F9FAFB", fontSize: "16px", fontWeight: "600", margin: 0 }}>{user?.email}</p>
            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "4px 0 0 0" }}>Miembro del hogar</p>
          </div>
        </div>

        {/* Info del hogar */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "20px", padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Home size={18} color="#10B981" />
            <p style={{ color: "#F9FAFB", fontSize: "15px", fontWeight: "600", margin: 0 }}>Hogar Principal</p>
          </div>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>
            Todos los registros se comparten entre los miembros del hogar en tiempo real.
          </p>
        </div>

        {/* Resumen del mes */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "20px", padding: "20px", marginBottom: "16px" }}>
          <p style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: "0 0 16px 0" }}>
            RESUMEN DE {now.toLocaleString("es-ES", { month: "long" }).toUpperCase()}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { label: "Ingresos", value: ingresos, color: "#10B981", icon: TrendingUp },
              { label: "Gastos", value: gastos, color: "#F87171", icon: TrendingDown },
              { label: "Inversiones", value: inversiones, color: "#60A5FA", icon: BarChart2 },
              { label: "Ahorro", value: ahorro, color: "#FBBF24", icon: PiggyBank },
            ].map(({ label, value, color, icon: Icono }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icono size={15} color={color} />
                </div>
                <div>
                  <p style={{ color: "#6B7280", fontSize: "11px", margin: 0 }}>{label}</p>
                  <p style={{ color, fontSize: "14px", fontWeight: "700", margin: 0 }}>{value.toFixed(0)}€</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total transacciones */}
        <div style={{ backgroundColor: "#1C1C1E", borderRadius: "20px", padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <User size={18} color="#9CA3AF" />
              <p style={{ color: "#F9FAFB", fontSize: "14px", margin: 0 }}>Registros este mes</p>
            </div>
            <p style={{ color: "#10B981", fontSize: "18px", fontWeight: "700", margin: 0 }}>{transaccionesMes.length}</p>
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={() => signOut(auth)}
          style={{ width: "100%", backgroundColor: "#F87171" + "15", border: "1px solid #F87171" + "30", borderRadius: "16px", padding: "16px", color: "#F87171", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <LogOut size={18} />
          Cerrar sesión
        </button>

      </div>
    </div>
  );
}