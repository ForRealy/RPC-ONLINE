import { initializeApp } from 'firebase-app'
import {
  getAuth, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, onAuthStateChanged
} from 'firebase-auth'
import {
  getFirestore, doc, setDoc, getDoc,
  onSnapshot, updateDoc
} from 'firebase-firestore'

// TODO: reemplaza con tu config
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Elementos
const btnRegister = document.getElementById('btn-register')
const btnLogin    = document.getElementById('btn-login')
const authDiv     = document.getElementById('auth')
const gameDiv     = document.getElementById('game')

// Registro
btnRegister.onclick = () => {
  const email = emailField.value
  const pw    = passwordField.value
  createUserWithEmailAndPassword(auth, email, pw)
    .catch(console.error)
}
// Login
btnLogin.onclick = () => {
  signInWithEmailAndPassword(auth, emailField.value, passwordField.value)
    .catch(console.error)
}

// Estado de auth
onAuthStateChanged(auth, user => {
  if (user) {
    authDiv.style.display = 'none'
    gameDiv.style.display = 'block'
    setupRoom()  // función para crear/unirse salas
  }
})

function setupRoom() {
  // lógica para crear documento / listen a sala
}

// Aquí iría el flujo de creación/unión de sala, sincronización de elecciones,
// temporizador con setTimeout, comprobación de reglas y updateDoc para score.