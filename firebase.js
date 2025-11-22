// Inicialización modular de Firebase (CDN + ES modules)
// Importa los módulos que necesites desde la CDN de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Configuración proporcionada
const firebaseConfig = {
  apiKey: "AIzaSyBGOBLIVvJxHqBhBae-hI1vM_KrzDEdtM0",
  authDomain: "iasa-app-bfe8b.firebaseapp.com",
  projectId: "iasa-app-bfe8b",
  storageBucket: "iasa-app-bfe8b.firebasestorage.app",
  messagingSenderId: "920148045932",
  appId: "1:920148045932:web:39e83aae9da23104eb2849",
  measurementId: "G-E13QW4LCE2"
};

// Inicializa la app
const app = initializeApp(firebaseConfig);

// Analytics puede fallar en entornos no compatibles (p.ej. archivos locales sin servidor)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (err) {
  console.warn('Firebase Analytics no disponible:', err?.message || err);
}

// Exporta objetos para usar en otros scripts (Auth, Firestore, Storage, etc.)
export { app, analytics };

// Autenticación
const auth = getAuth(app);
auth.languageCode = 'es';
const googleProvider = new GoogleAuthProvider();

/**
 * Inicia sesión con Google mediante un popup.
 * Retorna la promesa de Firebase (puedes usar .then/.catch o async/await).
 */
function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Cierra la sesión del usuario actual.
 */
function signOutUser() {
  return signOut(auth);
}

export { auth, googleProvider, signInWithGoogle, signOutUser };

/*
  Uso:
  - En tu `index.html` incluir: <script type="module" src="firebase.js"></script>
  - En otros módulos JS puedes importar: import { app } from './firebase.js'

  Ejemplos rápidos:
  - Autenticación:
    import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
    const auth = getAuth(app);

  - Firestore:
    import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
    const db = getFirestore(app);

  Nota: Si piensas usar esto desde archivos locales (file://), algunos módulos pueden dar problemas.
  Ejecuta un servidor local (p.ej. `npx http-server` o usar `server.js` del proyecto) para evitar restricciones.
*/
