import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { analizarExtracto } from "../lib/gemini";
import { Upload, Check, X, Loader } from "lucide-react";

const glass = {
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
};

const TIPOS = {
  income: { label: "Ingreso", color: "#34d399" },
  expense: { label: "Gasto", color: "#fb7185" },
  investment: { label: "Inversión", color: "#818cf8" },
  saving: { label: "Ahorro", color: "#fbbf24" },
};

export default function Import() {
  const [step, setStep] = useState("upload");
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState({});
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [duplicados, setDuplicados] = useState(0);
  const user = auth.currentUser;

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setError("");
    setStep("analyzing");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(",")[1];
        const mimeType = file.type;
        const resultado = await analizarExtracto(base64, mimeType);

        if (!resultado || !resultado.transactions || resultado.transactions.length === 0) {
          setError("No se pudieron extraer transacciones. Intenta con una imagen más clara.");
          setStep("upload");
          return;
        }

        setTransactions(resultado.transactions);
        const sel = {};
        resultado.transactions.forEach((_, i) => sel[i] = true);
        setSelected(sel);
        setStep("review");
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("Error al procesar el archivo. Intenta de nuevo.");
      setStep("upload");
    }
  };

  const importarSeleccionadas = async () => {
    setImporting(true);
    const seleccionadas = transactions.filter((_, i) => selected[i]);
    let contDuplicados = 0;

    // Crear meses necesarios automáticamente
    const mesesNecesarios = new Set();
    seleccionadas.forEach(t => {
      const fecha = t.date ? new Date(t.date) : new Date();
      mesesNecesarios.add(`${fecha.getFullYear()}-${fecha.getMonth()}`);
    });

    for (const mesKey of mesesNecesarios) {
      const [year, month] = mesKey.split("-").map(Number);
      const qm = query(
        collection(db, "months"),
        where("household", "==", "hogar_principal"),
        where("year", "==", year),
        where("month", "==", month)
      );
      const snap = await getDocs(qm);
      if (snap.empty) {
        await addDoc(collection(db, "months"), {
          household: "hogar_principal",
          year,
          month,
          status: "closed",
          createdAt: Timestamp.now()
        });
      }
    }

    // Importar transacciones evitando duplicados
    for (const t of seleccionadas) {
      const fecha = t.date ? new Date(t.date) : new Date();

      const qDup = query(
        collection(db, "transactions"),
        where("household", "==", "hogar_principal"),
        where("concept", "==", t.concept),
        where("amount", "==", Number(t.amount))
      );
      const snapDup = await getDocs(qDup);

      if (snapDup.empty) {
        await addDoc(collection(db, "transactions"), {
          type: t.type,
          concept: t.concept,
          amount: Number(t.amount),
          category: t.category,
          date: Timestamp.fromDate(fecha),
          userId: user.uid,
          household: "hogar_principal",
        });
      } else {
        contDuplicados++;
      }
    }

    setDuplicados(contDuplicados);
    setImporting(false);
    setStep("done");
  };

  const toggleAll = (val) => {
    const sel = {};
    transactions.forEach((_, i) => sel[i] = val);
    setSelected(sel);
  };

  const seleccionadas = Object.values(selected).filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px 140px 16px" }}>

        <div style={{ paddingTop: "28px", paddingBottom: "20px" }}>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Importar extracto</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Sube tu extracto bancario y lo analizamos con IA</p>
        </div>

        {step === "upload" && (
          <>
            <label htmlFor="file-input"
              style={{ ...glass, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", cursor: "pointer", border: "1px dashed rgba(99,102,241,0.4)", backgroundColor: "rgba(99,102,241,0.05)", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={24} color="#6366f1" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0" }}>Subir extracto bancario</p>
                <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Imagen (JPG, PNG) o PDF</p>
              </div>
              <input id="file-input" type="file" accept="image/*,application/pdf"
                onChange={e => handleFile(e.target.files[0])}
                style={{ display: "none" }} />
            </label>

            {error && (
              <div style={{ ...glass, padding: "14px 16px", backgroundColor: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)", marginBottom: "16px" }}>
                <p style={{ color: "#fb7185", fontSize: "13px", margin: 0 }}>⚠️ {error}</p>
              </div>
            )}

            <div style={{ ...glass, padding: "18px" }}>
              <p style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", margin: "0 0 12px 0", textTransform: "uppercase" }}>Consejos para mejores resultados</p>
              {[
                { icon: "📸", text: "Usa una imagen clara y bien iluminada del extracto" },
                { icon: "📄", text: "Los PDFs del banco funcionan mejor que fotos" },
                { icon: "✂️", text: "Recorta la imagen para mostrar solo las transacciones" },
                { icon: "🏦", text: "Compatible con BBVA, Santander, CaixaBank y más" },
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < 3 ? "10px" : "0" }}>
                  <span style={{ fontSize: "16px" }}>{tip.icon}</span>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>{tip.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {step === "analyzing" && (
          <div style={{ ...glass, padding: "50px 20px", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Loader size={24} color="white" style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <p style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "600", margin: "0 0 8px 0" }}>Analizando con IA...</p>
            <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>{fileName}</p>
            <p style={{ color: "#334155", fontSize: "12px", margin: "12px 0 0 0" }}>Esto puede tardar unos segundos</p>
          </div>
        )}

        {step === "review" && (
          <>
            <div style={{ ...glass, padding: "16px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(6,182,212,0.05))" }}>
              <div>
                <p style={{ color: "#34d399", fontSize: "14px", fontWeight: "600", margin: 0 }}>✓ {transactions.length} transacciones encontradas</p>
                <p style={{ color: "#475569", fontSize: "12px", margin: "2px 0 0 0" }}>{seleccionadas} seleccionadas para importar</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => toggleAll(true)}
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.1)", color: "#34d399", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                  Todas
                </button>
                <button onClick={() => toggleAll(false)}
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                  Ninguna
                </button>
              </div>
            </div>

            {transactions.map((t, i) => {
              const tipo = TIPOS[t.type] || TIPOS.expense;
              return (
                <div key={i} onClick={() => setSelected({ ...selected, [i]: !selected[i] })}
                  style={{ ...glass, padding: "14px", marginBottom: "8px", cursor: "pointer", opacity: selected[i] ? 1 : 0.4, border: selected[i] ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(255,255,255,0.04)", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: selected[i] ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${selected[i] ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {selected[i] ? <Check size={14} color="#6366f1" /> : <X size={14} color="#334155" />}
                      </div>
                      <div>
                        <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "500", margin: 0 }}>{t.concept}</p>
                        <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>{t.category} · {t.date || "fecha del extracto"}</p>
                      </div>
                    </div>
                    <p style={{ color: tipo.color, fontWeight: "700", fontSize: "14px", margin: 0 }}>
                      {t.type === "income" ? "+" : "-"}{Number(t.amount).toFixed(2)}€
                    </p>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => { setStep("upload"); setTransactions([]); setSelected({}); }}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}>
                Cancelar
              </button>
              <button onClick={importarSeleccionadas} disabled={seleccionadas === 0 || importing}
                style={{ flex: 2, padding: "14px", borderRadius: "12px", border: "none", background: seleccionadas === 0 ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #6366f1, #06b6d4)", color: seleccionadas === 0 ? "#334155" : "white", fontWeight: "700", cursor: seleccionadas === 0 ? "not-allowed" : "pointer", fontSize: "15px" }}>
                {importing ? "Importando..." : `Importar ${seleccionadas} transacciones`}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div style={{ ...glass, padding: "50px 20px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #34d399, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Check size={30} color="white" />
            </div>
            <p style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: "0 0 8px 0" }}>¡Importación completada!</p>
            {duplicados > 0 && (
              <p style={{ color: "#fbbf24", fontSize: "13px", margin: "0 0 8px 0" }}>⚠️ {duplicados} transacciones duplicadas omitidas</p>
            )}
            <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 24px 0" }}>Las transacciones ya están en tu Dashboard</p>
            <button onClick={() => { setStep("upload"); setTransactions([]); setSelected({}); setFileName(""); setDuplicados(0); }}
              style={{ padding: "12px 28px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #06b6d4)", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>
              Importar otro extracto
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}