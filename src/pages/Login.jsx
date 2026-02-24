import { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Email o contraseña incorrectos");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: "#0F0F0F"}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{color: "#10B981"}}>FinApp</h1>
          <p style={{color: "#9CA3AF"}}>Finanzas de tu hogar</p>
        </div>

        <div className="rounded-2xl p-6" style={{backgroundColor: "#1C1C1E"}}>
          <h2 className="text-xl font-semibold mb-6 text-white">
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </h2>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white outline-none"
              style={{backgroundColor: "#2D2D2D", border: "1px solid #3D3D3D"}}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white outline-none"
              style={{backgroundColor: "#2D2D2D", border: "1px solid #3D3D3D"}}
            />
          </div>

          {error && <p className="mt-3 text-sm" style={{color: "#F87171"}}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-opacity"
            style={{backgroundColor: "#10B981"}}
          >
            {loading ? "Cargando..." : isRegister ? "Registrarse" : "Entrar"}
          </button>

          <p className="text-center mt-4 text-sm" style={{color: "#9CA3AF"}}>
            {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
            <span
              className="cursor-pointer"
              style={{color: "#10B981"}}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}