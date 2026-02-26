const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function analizarTexto(texto) {
  try {
    const prompt = `Analiza este texto y extrae la información de una transacción financiera.
    Texto: "${texto}"
    
    Responde SOLO con un JSON válido con esta estructura exacta:
    {
      "type": "income|expense|investment|saving",
      "concept": "nombre del concepto",
      "amount": número,
      "category": "una de: Hogar|Alimentación|Transporte|Ocio|Salud|Suscripciones|Inversión|Ahorro|Otros"
    }`;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Error Gemini texto:", e);
    return null;
  }
}

export async function analizarExtracto(base64Data, mimeType) {
  try {
    const prompt = `Eres un asistente financiero experto. Analiza este extracto bancario y extrae TODAS las transacciones que encuentres.

Para cada transacción identifica:
- Si es un ingreso (nómina, transferencia recibida, intereses) → type: "income"
- Si es un gasto (compra, pago, recibo) → type: "expense"  
- Si es una inversión → type: "investment"
- Si es ahorro → type: "saving"

Categorías disponibles: Hogar, Alimentación, Transporte, Ocio, Salud, Suscripciones, Inversión, Ahorro, Otros

Responde SOLO con un JSON válido, sin texto adicional, con esta estructura:
{
  "transactions": [
    {
      "type": "expense",
      "concept": "Mercadona",
      "amount": 45.30,
      "category": "Alimentación",
      "date": "2024-01-15"
    }
  ]
}`;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }]
      }),
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Error Gemini extracto:", e);
    return null;
  }
}