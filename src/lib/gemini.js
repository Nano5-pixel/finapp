import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analizarTexto(texto) {
  try {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analiza este texto de finanzas personales y extrae los datos en JSON.
Texto: "${texto}"
Devuelve SOLO un JSON válido sin markdown, sin bloques de código, sin explicaciones.
El JSON debe tener exactamente estos campos:
- type: debe ser exactamente uno de estos valores: "income", "expense", "investment", "saving"
- concept: nombre descriptivo del concepto
- amount: número sin símbolos de moneda
- category: una de estas opciones: "Hogar", "Alimentación", "Transporte", "Ocio", "Salud", "Suscripciones", "Inversión", "Ahorro", "Otros"

Ejemplos:
"200€ Mercadona" → {"type":"expense","concept":"Mercadona","amount":200,"category":"Alimentación"}
"Nómina 1800 euros" → {"type":"income","concept":"Nómina","amount":1800,"category":"Otros"}
"500 ETF Vanguard" → {"type":"investment","concept":"ETF Vanguard","amount":500,"category":"Inversión"}
"300 hucha emergencias" → {"type":"saving","concept":"Hucha emergencias","amount":300,"category":"Ahorro"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error Gemini:", error);
    return null;
  }
}