import { db, auth } from "./firebase";
import { collection, doc, getDoc, setDoc, getDocs, query, where, updateDoc } from "firebase/firestore";

export const generarCodigo = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const obtenerHogar = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists() && userDoc.data().householdId) {
      return userDoc.data().householdId;
    }
    return null;
  } catch {
    return null;
  }
};

export const crearHogar = async (nombre) => {
  const userId = auth.currentUser.uid;
  const codigo = generarCodigo();
  const householdId = `hogar_${codigo}`;

  await setDoc(doc(db, "households", householdId), {
    nombre,
    codigo,
    createdBy: userId,
    members: [userId],
    createdAt: new Date(),
  });

  await setDoc(doc(db, "users", userId), {
    householdId,
    email: auth.currentUser.email,
    joinedAt: new Date(),
  });

  return householdId;
};

export const unirseHogar = async (codigo) => {
  const userId = auth.currentUser.uid;
  const codigoUpper = codigo.toUpperCase();

  const q = query(collection(db, "households"), where("codigo", "==", codigoUpper));
  const snap = await getDocs(q);

  if (snap.empty) return { error: "Código no encontrado" };

  const householdDoc = snap.docs[0];
  const householdId = householdDoc.id;
  const members = householdDoc.data().members || [];

  if (!members.includes(userId)) {
    await updateDoc(doc(db, "households", householdId), {
      members: [...members, userId],
    });
  }

  await setDoc(doc(db, "users", userId), {
    householdId,
    email: auth.currentUser.email,
    joinedAt: new Date(),
  });

  return { householdId };
}