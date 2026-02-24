import { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#0F0F0F"}}>
        <p style={{color: "#10B981"}}>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

export default App;