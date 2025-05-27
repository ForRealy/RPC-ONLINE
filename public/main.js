import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  doc, setDoc, getDoc,
  onSnapshot, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 🌟 Elementos del DOM
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const btnRegister = document.getElementById("btn-register");
const btnLogin = document.getElementById("btn-login");
const btnGoogle = document.getElementById("btn-google");
const authDiv = document.getElementById("auth");
const gameDiv = document.getElementById("game");
const roomIdInput = document.getElementById("room-id");
const btnCreate = document.getElementById("btn-create");
const btnJoin = document.getElementById("btn-join");
const boardDiv = document.getElementById("board");
const playersDiv = document.getElementById("players");
const choicesDiv = document.getElementById("choices");
const timerDiv = document.getElementById("timer");

// Debug: Check if elements are found
console.log("Auth elements:", {
  emailField,
  passwordField,
  btnRegister,
  btnLogin,
  btnGoogle,
  authDiv,
  gameDiv
});

// 📝 Registro
btnRegister.onclick = () => {
  createUserWithEmailAndPassword(auth, emailField.value, passwordField.value)
    .catch(error => {
      console.error("Error en registro:", error.code, error.message);
    });
};

// 🔑 Login
btnLogin.onclick = () => {
  signInWithEmailAndPassword(auth, emailField.value, passwordField.value)
    .catch(error => {
      console.error("Error en login:", error.code, error.message);
    });
};

// 🔑 Google Login
btnGoogle.onclick = async () => {
  console.log("Google login clicked");
  const provider = new GoogleAuthProvider();
  try {
    console.log("Attempting Google sign in...");
    // Check if popups are blocked
    const popup = window.open('about:blank', 'popup', 'width=1,height=1');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    popup.close();
    
    const result = await signInWithPopup(auth, provider);
    console.log("Google sign in successful:", result.user);
  } catch (error) {
    console.error("Error en login con Google:", {
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential
    });
    
    // Show error to user
    if (error.message.includes('popup')) {
      alert('Por favor, permite las ventanas emergentes para este sitio.');
    } else {
      alert('Error al iniciar sesión con Google: ' + error.message);
    }
  }
};

// 👥 Estado de auth
let currentUser = null;
onAuthStateChanged(auth, user => {
  console.log("Auth state changed:", user ? "User logged in" : "No user");
  if (user) {
    currentUser = user;
    authDiv.style.display = "none";
    gameDiv.style.display = "block";
  } else {
    currentUser = null;
    authDiv.style.display = "block";
    gameDiv.style.display = "none";
  }
});

// 🏠 Crear sala
btnCreate.onclick = async () => {
  const roomId = roomIdInput.value.trim();
  if (!roomId) return alert("Debes ingresar un ID de sala.");

  const roomRef = doc(db, "rooms", roomId);
  await setDoc(roomRef, {
    players: { [currentUser.uid]: { choice: "", score: 0 } },
    state: "waiting"
  });
  joinRoom(roomId);
};

// 🚪 Unirse a sala
btnJoin.onclick = async () => {
  const roomId = roomIdInput.value.trim();
  if (!roomId) return alert("Debes ingresar un ID de sala.");

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    return alert("La sala no existe.");
  }

  // Añadir jugador a la sala si no está
  const data = roomSnap.data();
  if (!data.players[currentUser.uid]) {
    await updateDoc(roomRef, {
      [`players.${currentUser.uid}`]: { choice: "", score: 0 }
    });
  }
  joinRoom(roomId);
};

// 🎮 Lógica principal de la sala
function joinRoom(roomId) {
  const roomRef = doc(db, "rooms", roomId);
  boardDiv.style.display = "block";
  playersDiv.textContent = "Esperando jugadores...";
  choicesDiv.innerHTML = "";

  // Escuchar en tiempo real los cambios
  onSnapshot(roomRef, (docSnap) => {
    const room = docSnap.data();
    const playerCount = Object.keys(room.players).length;
    const jugadores = Object.keys(room.players).map((id, index) => `Jugador ${index + 1}: ${id}`).join("<br>");
    playersDiv.innerHTML = jugadores;

    if (playerCount >= 4 && room.state === "waiting") {
      updateDoc(roomRef, { state: "playing", round: 1 });
    }

    if (room.state === "playing") {
      mostrarOpciones(roomRef, room.players);
    }

    if (room.state === "ended") {
      alert("¡Partida finalizada!");
      boardDiv.style.display = "none";
    }
  });
}

// 🎴 Mostrar opciones y manejar elección
function mostrarOpciones(roomRef, players) {
  choicesDiv.innerHTML = `
    <button onclick="elegir('piedra', '${roomRef.id}')">Piedra</button>
    <button onclick="elegir('papel', '${roomRef.id}')">Papel</button>
    <button onclick="elegir('tijera', '${roomRef.id}')">Tijera</button>
  `;
}

// 🖱️ Elegir jugada
window.elegir = async (eleccion, roomId) => {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    [`players.${currentUser.uid}.choice`]: eleccion
  });

  // Temporizador de 15s para mostrar resultado
  startTimer(15, async () => {
    const roomSnap = await getDoc(roomRef);
    const players = roomSnap.data().players;
    const choices = Object.values(players).map(p => p.choice).filter(Boolean);

    if (choices.length === 4) {
      const resultado = calcularRonda(Object.values(players).map(p => p.choice));
      alert(resultado);
      await updateDoc(roomRef, { state: "ended" });
    } else {
      alert("No todos jugaron a tiempo. ¡Ronda anulada!");
      await updateDoc(roomRef, { state: "ended" });
    }
  });
};

// ⏳ Temporizador visual
function startTimer(segundos, onEnd) {
  let t = segundos;
  timerDiv.textContent = `Tiempo: ${t}s`;
  const interval = setInterval(() => {
    t--;
    timerDiv.textContent = `Tiempo: ${t}s`;
    if (t <= 0) {
      clearInterval(interval);
      onEnd();
    }
  }, 1000);
}

// 🏆 Reglas del juego
function calcularRonda(jugadas) {
  const reglas = { piedra: "tijera", tijera: "papel", papel: "piedra" };
  let p1 = jugadas.slice(0, 2);
  let p2 = jugadas.slice(2, 4);
  let puntos1 = 0, puntos2 = 0;

  for (let j1 of p1) {
    for (let j2 of p2) {
      if (j1 === j2) continue;
      else if (reglas[j1] === j2) puntos1++;
      else puntos2++;
    }
  }

  if (puntos1 > puntos2) return "¡Equipo 1 gana!";
  else if (puntos2 > puntos1) return "¡Equipo 2 gana!";
  else return "¡Empate!";
}
