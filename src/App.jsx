import { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import { LayoutDashboard, BarChart2 } from "lucide-react";

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
      {page === "reports" && <Reports onBack={() => setPage("dashboard")} />}

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
        <div style={{ display: "flex", gap: "64px" }}>
          <button
            onClick={() => setPage("dashboard")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
          >
            <LayoutDashboard size={24} color={page === "dashboard" ? "#10B981" : "#6B7280"} />
            <span style={{ fontSize: "10px", color: page === "dashboard" ? "#10B981" : "#6B7280", fontWeight: "500" }}>Inicio</span>
          </button>
          <button
            onClick={() => setPage("reports")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
          >
            <BarChart2 size={24} color={page === "reports" ? "#10B981" : "#6B7280"} />
            <span style={{ fontSize: "10px", color: page === "reports" ? "#10B981" : "#6B7280", fontWeight: "500" }}>Reportes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;