import { t } from "../i18n";
import { getNarrationMode, type NarrationMode } from "../services/dialogue-provider";
import { getKeyConfig, testKeyConfig, saveKeyConfig, isLoggedIn } from "../services/api-client";
import { reinitDialogueService } from "./game";

// ─── Pending state (applied only on Save) ───────────────────────────
let pendingMode: NarrationMode;
let pendingSource: "host" | "custom";

// ─── Shared button styles ───────────────────────────────────────────
function setActive(btn: HTMLElement): void {
  btn.className = "toggle-btn toggle-btn-active";
  btn.style.flex = "1";
}
function setInactive(btn: HTMLElement): void {
  btn.className = "toggle-btn";
  btn.style.flex = "1";
}

// ─── Init ───────────────────────────────────────────────────────────
export function initSettings(): void {
  document.getElementById("settings-btn-lobby")?.addEventListener("click", openSettings);
  document.getElementById("settings-btn-game")?.addEventListener("click", openSettings);
  document.getElementById("settings-close")!.addEventListener("click", closeSettings);
  document.getElementById("settings-save")!.addEventListener("click", saveSettings);
  document.getElementById("settings-mode-normal")?.addEventListener("click", () => switchMode("normal"));
  document.getElementById("settings-mode-smart")?.addEventListener("click", () => switchMode("smart"));
  document.getElementById("settings-src-custom")?.addEventListener("click", () => switchSource("custom"));
  document.getElementById("settings-src-env")?.addEventListener("click", () => switchSource("host"));
  document.getElementById("settings-test-btn")?.addEventListener("click", handleTest);

  // Re-render source when auth state changes (login/logout from auth modal)
  window.addEventListener("auth-changed", () => {
    pendingSource = "host";
    void renderSource();
  });
}

// ─── Open / Close ───────────────────────────────────────────────────
export async function openSettings(): Promise<void> {
  (document.getElementById("settings-modal") as HTMLElement).classList.remove("hidden");
  (document.getElementById("settings-title") as HTMLElement).textContent = t("叙事设置", "Narrator Settings");
  (document.getElementById("settings-save") as HTMLElement).textContent = t("保存", "Save");

  pendingMode = getNarrationMode();
  pendingSource = "host";

  renderMode(pendingMode);
  await renderSource();

  (document.getElementById("settings-status") as HTMLElement).textContent = "";
}

function closeSettings(): void {
  (document.getElementById("settings-modal") as HTMLElement).classList.add("hidden");
}

// ─── Mode switching ─────────────────────────────────────────────────

function renderMode(mode: NarrationMode): void {
  const normalBtn = document.getElementById("settings-mode-normal") as HTMLElement;
  const smartBtn = document.getElementById("settings-mode-smart") as HTMLElement;
  const descEl = document.getElementById("settings-mode-desc") as HTMLElement;
  const configEl = document.getElementById("settings-smart-config") as HTMLElement;

  if (mode === "normal") {
    setActive(normalBtn);
    setInactive(smartBtn);
    descEl.textContent = t("普通模式：NPC 通过固定话题按钮对话，不使用 AI。", "Normal mode: NPCs use fixed topic buttons, no AI.");
    configEl.style.display = "none";
  } else {
    setInactive(normalBtn);
    setActive(smartBtn);
    descEl.textContent = t("智能模式：NPC 由 AI 驱动自由对话。", "Smart mode: NPCs are driven by AI for free-form dialogue.");
    configEl.style.display = "";
    void renderSource();
  }
}

function switchMode(mode: NarrationMode): void {
  pendingMode = mode;
  renderMode(mode);
}

// ─── Config source display ─────────────────────────────────────────

async function renderSource(): Promise<void> {
  const envInfo = document.getElementById("settings-env-info") as HTMLElement;
  const envModel = document.getElementById("settings-env-model") as HTMLElement;
  const customFields = document.getElementById("settings-custom-fields") as HTMLElement;
  const srcEnvBtn = document.getElementById("settings-src-env") as HTMLElement;
  const srcCustomBtn = document.getElementById("settings-src-custom") as HTMLElement;

  customFields.style.display = "none";
  envInfo.style.display = "none";

  if (pendingSource === "host") {
    // Show host key info
    setActive(srcEnvBtn);
    setInactive(srcCustomBtn);
    envInfo.style.display = "";

    try {
      const config = await getKeyConfig();
      if (config) {
        envModel.textContent = `${config.model} (${config.baseUrl.replace(/https?:\/\//, "").split("/")[0]})`;
      } else {
        envModel.textContent = t("房主还没配置密钥", "Host hasn't configured a key yet");
      }
    } catch {
      envModel.textContent = t("无法连接服务器", "Cannot connect to server");
    }
  } else {
    // "用自己的" selected
    if (!isLoggedIn()) {
      // Guest → show message in status area + revert to host
      const statusEl = document.getElementById("settings-status") as HTMLElement;
      statusEl.textContent = t("房主摆了摆手，表示不用客气 ヽ(´ー`)ﾉ", "The host waves dismissively — no need to be polite ヽ(´ー`)ﾉ");
      pendingSource = "host";
      setActive(srcEnvBtn);
      setInactive(srcCustomBtn);
      envInfo.style.display = "";
      try {
        const config = await getKeyConfig();
        if (config) {
          envModel.textContent = `${config.model} (${config.baseUrl.replace(/https?:\/\//, "").split("/")[0]})`;
        }
      } catch { /* ignore */ }
    } else {
      // Logged in → show input fields
      setInactive(srcEnvBtn);
      setActive(srcCustomBtn);
      customFields.style.display = "";
    }
  }
}

function switchSource(src: "host" | "custom"): void {
  pendingSource = src;
  void renderSource();
}

// ─── Test connectivity ──────────────────────────────────────────────

async function handleTest(): Promise<void> {
  const statusEl = document.getElementById("settings-status") as HTMLElement;
  const testBtn = document.getElementById("settings-test-btn") as HTMLElement;

  testBtn.textContent = t("敲敲门…", "Knocking…");
  testBtn.setAttribute("disabled", "true");

  try {
    const result = await testKeyConfig();
    if (result.ok) {
      const msgs = [
        t("✓ 连上了！NPC 打了个哈欠，表示准备就绪 (๑•̀ㅂ•́)و✧", "✓ Connected! NPC yawned and is ready (๑•̀ㅂ•́)و✧"),
        t("✓ NPC 醒了，正在伸懒腰… 可以开始了 ヾ(≧▽≦*)o", "✓ NPC is awake and stretching… let's go ヾ(≧▽≦*)o"),
        t("✓ 信号良好，NPC 们在搓手等待登场 (≧∇≦)ﾉ", "✓ Signal strong, NPCs are rubbing hands waiting to go (≧∇≦)ﾉ"),
      ];
      statusEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    } else {
      statusEl.textContent = t(`✗ 连不上…AI 可能睡着了 (${result.error})`, `✗ Can't connect… AI might be asleep (${result.error})`);
    }
  } catch (err: any) {
    statusEl.textContent = t(`✗ 测试翻车了: ${err.message}`, `✗ Test crashed: ${err.message}`);
  } finally {
    testBtn.textContent = t("敲门试试", "Knock knock");
    testBtn.removeAttribute("disabled");
  }
}

// ─── Save ───────────────────────────────────────────────────────────

async function saveSettings(): Promise<void> {
  const statusEl = document.getElementById("settings-status") as HTMLElement;

  // 1. Write mode
  if (pendingMode === "normal") {
    localStorage.setItem("storycraft_mode", "normal");
  } else {
    localStorage.setItem("storycraft_mode", "smart");
  }

  // 2. Handle config source
  if (pendingMode === "normal") {
    // Normal mode: no AI, different vibe
    const msgs = [
      t("✓ 好的，NPC 们收起了麦克风，回到了剧本里 (￣▽￣)", "✓ NPCs put away the mic and returned to the script (￣▽￣)"),
      t("✓ AI 被请去喝茶了，NPC 们按剧本走 (・ω・)", "✓ AI was sent off for tea, NPCs follow the script now (・ω・)"),
      t("✓ 明白了，回到经典模式，一切尽在掌握 ✧", "✓ Got it, classic mode. Everything under control ✧"),
    ];
    statusEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  } else if (!isLoggedIn() || pendingSource === "host") {
    const msgs = [
      t("✓ 记下来了，NPC 们已经开始窃窃私语… (ಡωಡ)", "✓ Noted. The NPCs have started whispering… (ಡωಡ)"),
      t("✓ 好的，剧本已更新，演员们就位了 ✧*。", "✓ Script updated, actors are in position ✧*."),
      t("✓ 收到！命运的齿轮悄悄转了一下 ⚙️", "✓ Got it! The gears of fate quietly turned ⚙️"),
    ];
    statusEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  } else {
    const key = (document.getElementById("settings-api-key") as HTMLInputElement).value.trim();
    const base = (document.getElementById("settings-base-url") as HTMLInputElement).value.trim();
    const model = (document.getElementById("settings-model") as HTMLInputElement).value.trim();

    if (!key) {
      statusEl.textContent = t("密钥呢？NPC 们在等灵魂呢 (⊙_⊙)", "Where's the key? NPCs are waiting for souls (⊙_⊙)");
      return;
    }

    statusEl.textContent = t("正在为 NPC 注入灵魂，请屏住呼吸…", "Injecting souls into NPCs, hold your breath…");
    try {
      await saveKeyConfig({ apiKey: key, baseUrl: base || "https://api.deepseek.com/v1", model: model || "deepseek-v4-pro" });
      statusEl.textContent = t("✓ 灵魂注入成功，NPC 睁开了眼睛 (◉◞◉)", "✓ Soul injection complete, NPCs opened their eyes (◉◞◉)");
    } catch (err: any) {
      console.error("[Settings] saveKeyConfig failed:", err);
      statusEl.textContent = t(`✗ 保存失败：${err?.message ?? "未知错误"}`, `✗ Save failed: ${err?.message ?? "unknown error"}`);
    }
  }

  // 3. Rebuild engine
  try {
    await reinitDialogueService();
  } catch {
    // Engine rebuild may fail silently before game starts
  }
}
