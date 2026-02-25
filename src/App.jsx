import { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Budget from "./pages/Budget";
import { LayoutDashboard, BarChart2, BookOpen, Target } from "lucide-react";

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0F0F0F" }}>
        <p style={{ color: "#10B981" }}>Cargando...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div style={{ backgroundColor: "#0F0F0F", minHeight: "100vh" }}>
      {page === "dashboard" && <Dashboard />}
      {page === "reports" && <Reports />}
      {page === "history" && <History />}
      {page === "budget" && <Budget />}

      {/* Barra de navegación inferior */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#161616",
        borderTop: "1px solid #2D2D2D",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "10px 0 20px 0",
        zIndex: 100
      }}>
        <div style={{ display: "flex", gap: "36px" }}>
          <button onClick={() => setPage("dashboard")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <LayoutDashboard size={22} color={page === "dashboard" ? "#10B981" : "#6B7280"} />
            <span style={{ fontSize: "10px", color: page === "dashboard" ? "#10B981" : "#6B7280", fontWeight: "500" }}>Inicio</span>
          </button>
          <button onClick={() => setPage("reports")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <BarChart2 size={22} color={page === "reports" ? "#10B981" : "#6B7280"} />
            <span style={{ fontSize: "10px", color: page === "reports" ? "#10B981" : "#6B7280", fontWeight: "500" }}>Reportes</span>
          </button>
          <button onClick={() => setPage("budget")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Target size={22} color={page === "budget" ? "#10B981" : "#6B7280"} />
            <span style={{ fontSize: "10px", color: page === "budget" ? "#10B981" : "#6B7280", fontWeight: "500" }}>Presupuesto</span>
          </button>
          <button onClick={() => setPage("history")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <BookOpen size={22} color={page === "history" ? "#10B981" : "#6B7280"} />
            <span style={{ fontSize: "10px", color: page === "history" ? "#10B981" : "#6B7280", fontWeight: "500" }}>Historial</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;