import { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { obtenerHogar } from "./lib/household";
import Login from "./pages/Login";
import Household from "./pages/Household";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Budget from "./pages/Budget";
import Recurring from "./pages/Recurring";
import Profile from "./pages/Profile";
import Goals from "./pages/Goals";
import Investments from "./pages/Investments";
import Import from "./pages/Import";
import { LayoutDashboard, BarChart2, BookOpen, Target, RefreshCw, UserCircle, Trophy, TrendingUp, FileUp } from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const hId = await obtenerHogar(currentUser.uid);
        setHouseholdId(hId);
      } else {
        setHouseholdId(null);
      }
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
  if (!householdId) return <Household onComplete={(hId) => setHouseholdId(hId)} />;

  const navItems = [
    { key: "dashboard", icon: LayoutDashboard, label: "Inicio" },
    { key: "reports", icon: BarChart2, label: "Reportes" },
    { key: "investments", icon: TrendingUp, label: "Inversiones" },
    { key: "import", icon: FileUp, label: "Importar" },
    { key: "budget", icon: Target, label: "Presupuesto" },
    { key: "goals", icon: Trophy, label: "Metas" },
    { key: "recurring", icon: RefreshCw, label: "Recurrentes" },
    { key: "history", icon: BookOpen, label: "Historial" },
    { key: "profile", icon: UserCircle, label: "Perfil" },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      {page === "dashboard" && <Dashboard householdId={householdId} />}
      {page === "reports" && <Reports householdId={householdId} />}
      {page === "history" && <History householdId={householdId} />}
      {page === "budget" && <Budget householdId={householdId} />}
      {page === "recurring" && <Recurring householdId={householdId} />}
      {page === "profile" && <Profile householdId={householdId} />}
      {page === "goals" && <Goals householdId={householdId} />}
      {page === "investments" && <Investments householdId={householdId} />}
      {page === "import" && <Import householdId={householdId} />}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(2,6,23,0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", zIndex: 100, padding: "10px 0 20px 0", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: "4px", minWidth: "max-content", padding: "0 16px" }}>
          {navItems.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setPage(key)}
              style={{ background: page === key ? "rgba(99,102,241,0.15)" : "none", border: page === key ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent", borderRadius: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "6px 14px", transition: "all 0.2s", minWidth: "60px" }}>
              <Icon size={20} color={page === key ? "#6366f1" : "#334155"} />
              <span style={{ fontSize: "9px", color: page === key ? "#6366f1" : "#334155", fontWeight: "500", whiteSpace: "nowrap" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default App;