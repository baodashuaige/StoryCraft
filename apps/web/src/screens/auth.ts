import { t } from "../i18n";
import { isLoggedIn, getToken, login, register } from "../services/api-client";

// ─── Toast (shared with settings) ───────────────────────────────────

export function showToast(message: string, duration = 3000): void {
  const container = document.getElementById("toast")!;
  const el = document.createElement("div");
  el.textContent = message;
  el.className = "toast-item";
  el.style.pointerEvents = "none";
  el.style.maxWidth = "320px";
  container.appendChild(el);
  requestAnimationFrame(() => { el.classList.add("show"); });
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ─── Init ───────────────────────────────────────────────────────────

export function initAuth(): void {
  // User buttons in lobby and game
  document.getElementById("user-btn-lobby")?.addEventListener("click", openAuth);
  document.getElementById("user-btn-game")?.addEventListener("click", openAuth);
  document.getElementById("auth-close")!.addEventListener("click", closeAuth);
  document.getElementById("auth-login-btn")?.addEventListener("click", handleLogin);
  document.getElementById("auth-register-btn")?.addEventListener("click", handleRegister);
  document.getElementById("auth-logout-btn")?.addEventListener("click", handleLogout);

  // Initial badge update
  updateUserBadges();
}

// ─── Open / Close ───────────────────────────────────────────────────

/** Check if the current user is logged in as host (房主) */
export function isHost(): boolean {
  if (!isLoggedIn()) return false;
  try {
    const payload = JSON.parse(atob(getToken()!.split(".")[1]));
    return payload.role === "host";
  } catch {
    return false;
  }
}

export function openAuth(): void {
  const modal = document.getElementById("auth-modal") as HTMLElement;
  modal.classList.remove("hidden");
  renderState();
  (document.getElementById("auth-status") as HTMLElement).textContent = "";
}

function closeAuth(): void {
  (document.getElementById("auth-modal") as HTMLElement).classList.add("hidden");
}

// ─── Render ─────────────────────────────────────────────────────────

function renderState(): void {
  const guestEl = document.getElementById("auth-guest") as HTMLElement;
  const userEl = document.getElementById("auth-user") as HTMLElement;

  if (isLoggedIn()) {
    guestEl.style.display = "none";
    userEl.style.display = "";
    try {
      const payload = JSON.parse(atob(getToken()!.split(".")[1]));
      (document.getElementById("auth-username-display") as HTMLElement).textContent = payload.username || "User";
      const roleText = payload.role === "host"
        ? t("房主 — 可以配置全局 AI 密钥", "Host — can configure global AI key")
        : t("玩家 — 可以配置自己的密钥", "Player — can configure own key");
      (document.getElementById("auth-role-desc") as HTMLElement).textContent = roleText;
    } catch {
      (document.getElementById("auth-username-display") as HTMLElement).textContent = "User";
    }
  } else {
    guestEl.style.display = "";
    userEl.style.display = "none";
    (document.getElementById("auth-title") as HTMLElement).textContent = t("登录", "Login");
  }
}

/** Update the username badge next to 👤 button in lobby and game header */
export function updateUserBadges(): void {
  const badges = ["user-badge-lobby", "user-badge-game"];
  if (isLoggedIn()) {
    try {
      const payload = JSON.parse(atob(getToken()!.split(".")[1]));
      const name = payload.username || "User";
      badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display = ""; el.textContent = name; }
      });
    } catch {
      badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
    }
  } else {
    badges.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.display = ""; el.textContent = t("游客", "Guest"); }
    });
  }
}

// ─── Actions ────────────────────────────────────────────────────────

async function handleLogin(): Promise<void> {
  const statusEl = document.getElementById("auth-status") as HTMLElement;
  const username = (document.getElementById("auth-username") as HTMLInputElement).value.trim();
  const password = (document.getElementById("auth-password") as HTMLInputElement).value;

  if (!username || !password) {
    statusEl.textContent = t("请输入用户名和密码", "Please enter username and password");
    return;
  }

  try {
    await login(username, password);
    statusEl.textContent = t("✓ 登录成功", "✓ Login successful");
    renderState();
    updateUserBadges();
    // Notify settings to re-render source options
    window.dispatchEvent(new CustomEvent("auth-changed"));
    showToast(t(`欢迎回来，${username} (ﾉ>ω<)ﾉ`, `Welcome back, ${username} (ﾉ>ω<)ﾉ`));
  } catch (err: any) {
    statusEl.textContent = t(`✗ ${err.message}`, `✗ ${err.message}`);
  }
}

async function handleRegister(): Promise<void> {
  const statusEl = document.getElementById("auth-status") as HTMLElement;
  const username = (document.getElementById("auth-username") as HTMLInputElement).value.trim();
  const password = (document.getElementById("auth-password") as HTMLInputElement).value;

  if (!username || !password) {
    statusEl.textContent = t("请输入用户名和密码", "Please enter username and password");
    return;
  }

  try {
    await register(username, password);
    statusEl.textContent = t("✓ 注册成功", "✓ Registration successful");
    renderState();
    updateUserBadges();
    window.dispatchEvent(new CustomEvent("auth-changed"));
    showToast(t(`欢迎加入，${username} ✧*。ヾ(。>﹏<。)`, `Welcome aboard, ${username} ✧*。ヾ(。>﹏<。)`));
  } catch (err: any) {
    statusEl.textContent = t(`✗ ${err.message}`, `✗ ${err.message}`);
  }
}

function handleLogout(): void {
  localStorage.removeItem("storycraft_token");
  renderState();
  updateUserBadges();
  window.dispatchEvent(new CustomEvent("auth-changed"));
  showToast(t("已登出，回到游客模式 (´･ω･`)", "Logged out, back to guest mode (´･ω･`)"));
}
