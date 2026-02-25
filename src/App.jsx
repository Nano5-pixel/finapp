import { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Budget from "./pages/Budget";
import Recurring from "./pages/Recurring";
import Profile from "./pages/Profile";
import Goals from "./pages/Goals";
import { LayoutDashboard, BarChart2, BookOpen, Target, RefreshCw, UserCircle, Trophy } from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ color: "white", fontSize: "20px", fontWeight: "800" }}>F</span>
          </div>
          <p style={{ color: "#6366f1" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div style={{ minHeight: "100vh" }}>
      {page === "dashboard" && <Dashboard />}
      {page === "reports" && <Reports />}
      {page === "history" && <History />}
      {page === "budget" && <Budget />}
      {page === "recurring" && <Recurring />}
      {page === "profile" && <Profile />}
      {page === "goals" && <Goals />}

      {/* Barra de navegación inferior */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(2,6,23,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "10px 0 20px 0",
        zIndex: 100
      }}>
        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { key: "dashboard", icon: LayoutDashboard, label: "Inicio" },
            { key: "reports", icon: BarChart2, label: "Reportes" },
            { key: "budget", icon: Target, label: "Presupuesto" },
            { key: "goals", icon: Trophy, label: "Metas" },
            { key: "recurring", icon: RefreshCw, label: "Recurrentes" },
            { key: "history", icon: BookOpen, label: "Historial" },
            { key: "profile", icon: UserCircle, label: "Perfil" },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setPage(key)}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", transition: "opacity 0.2s" }}>
              <Icon size={21} color={page === key ? "#6366f1" : "#334155"} />
              <span style={{ fontSize: "9px", color: page === key ? "#6366f1" : "#334155", fontWeight: "500" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;