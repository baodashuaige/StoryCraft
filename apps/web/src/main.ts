import { getAllWorlds, getWorldById } from "./world-registry";
import { getLang, setLang, UI } from "./i18n";
import { renderLobby } from "./screens/lobby";
import { startGame, initGameEvents, getPack, refreshLang } from "./screens/game";
import { showEnding } from "./screens/end";
import { initSettings } from "./screens/settings";
import { initAuth, updateUserBadges } from "./screens/auth";

// ============================================================
//  Screen management
// ============================================================
type Screen = "lobby" | "game" | "end";

function showScreen(screen: Screen): void {
  document.getElementById("lobby-screen")!.classList.toggle("hidden", screen !== "lobby");
  document.getElementById("game")!.classList.toggle("hidden", screen !== "game");
  document.getElementById("end-screen")!.classList.toggle("hidden", screen !== "end");

  // Update page title
  if (screen === "game") {
    const pack = getPack();
    document.title = getLang() === "zh" ? pack.meta.title.zh : pack.meta.title.en;
  } else {
    document.title = "StoryCraft";
  }
}

// ============================================================
//  Navigation callbacks
// ============================================================
function onStartWorld(worldId: string): void {
  const pack = getWorldById(worldId);
  if (!pack) return;
  startGame(pack);
}

function onBackToLobby(): void {
  showScreen("lobby");
  renderLobby(getAllWorlds(), onStartWorld);
}

function onPlayAgain(): void {
  const pack = getPack();
  if (!pack) return;
  startGame(pack);
}

// Override showEnding to wire back-to-lobby properly
// The game.ts showEnding is called with tr, state, onPlayAgain, onPlayAgain
// We need to patch the end screen buttons after showEnding is called
const origShowEnding = showEnding;

// ============================================================
//  Language switching
// ============================================================
function applyLang(): void {
  const lang = getLang();
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";

  // Update lobby
  if (!document.getElementById("lobby-screen")!.classList.contains("hidden")) {
    renderLobby(getAllWorlds(), onStartWorld);
  }

  // Update game
  if (!document.getElementById("game")!.classList.contains("hidden")) {
    refreshLang();
  }

  // Update buttons
  const langText = UI.langBtn();
  document.getElementById("lang-toggle-lobby")!.textContent = langText;
  document.getElementById("lang-toggle-game")!.textContent = langText;
  document.getElementById("command-input")!.placeholder = UI.inputPH();
}

function toggleLang(): void {
  setLang(getLang() === "zh" ? "en" : "zh");
  applyLang();
}

// ============================================================
//  Init
// ============================================================
function init(): void {
  // Wire events
  initGameEvents();
  initSettings();
  initAuth();

  // Language toggle
  document.getElementById("lang-toggle-lobby")!.addEventListener("click", toggleLang);
  document.getElementById("lang-toggle-game")!.addEventListener("click", toggleLang);

  // Show lobby
  renderLobby(getAllWorlds(), onStartWorld);
  showScreen("lobby");

  // Patch end screen buttons to use our navigation
  const backBtn = document.getElementById("back-to-lobby-btn")!;
  backBtn.addEventListener("click", onBackToLobby);

  applyLang();
}

init();
