import type { WorldPack } from "./world-registry";

export type Lang = "zh" | "en";

// --- Shared UI strings (world-agnostic) ---
export const UI = {
  lobbyTitle: () => t("StoryCraft — 选择你的故事", "StoryCraft — Choose Your Story"),
  lobbySubtitle: () => t("探索不同的世界，揭开隐藏的真相", "Explore different worlds, uncover hidden truths"),
  backToLobby: () => t("返回大厅", "Back to Lobby"),
  playAgain: () => t("再来一次", "Play Again"),
  turns: (n: number) => t(`剩余回合：${n}`, `Turns: ${n}`),
  mapHeading: () => t("地图", "Map"),
  npcHeading: () => t("在场人物", "People Here"),
  sceneHeading: () => t("场景", "Scene"),
  invHeading: () => t("物品栏", "Inventory"),
  cluesHeading: () => t("线索", "Clues"),
  trustHeading: () => t("信任度", "Trust"),
  conseqHeading: () => t("后果", "Consequences"),
  empty: () => t("空", "Empty"),
  noneDiscovered: () => t("尚未发现", "None discovered"),
  none: () => t("无", "None"),
  searched: () => t("已搜索", "Searched"),
  searchBtn: () => t("搜索", "Search"),
  takeBtn: () => t("拾取", "Take"),
  useBtn: () => t("使用", "Use"),
  accuseBtn: () => t("公开指控", "Public Accuse"),
  accuseMercyBtn: () => t("私下指控", "Private Accuse"),
  talkLabel: () => t("谈谈", "Talk"),
  endingConseq: () => t("你的选择带来的后果", "Consequences"),
  inputPH: () => t("说点什么…", "Say something…"),
  langBtn: () => (lang === "zh" ? "中文" : "EN"),
  locked: () => t("🔒", "🔒"),
  settingsTitle: () => t("AI 叙事设置", "AI Narrator Settings"),
  settingsSave: () => t("保存", "Save"),
  settingsConfigured: () => t("已配置", "Configured"),
  settingsNotConfigured: () => t("未配置 — 将使用默认文本", "Not configured — using fallback text"),
  settingsSaved: () => t("✓ 已保存，AI 叙事已启用", "✓ Saved, AI narration enabled"),
  settingsCleared: () => t("已清除，使用默认文本", "Cleared, using fallback text"),
  noOneHere: () => t("这里没有人", "No one here"),
  nothingHere: () => t("这里没有特别的物品", "Nothing of note here"),
  accuseLabel: () => t("指控：", "Accuse: "),
};

// --- Global lang state ---
let lang: Lang = (localStorage.getItem("storycraft_lang") as Lang) || "zh";

export function getLang(): Lang {
  return lang;
}

export function setLang(l: Lang): void {
  lang = l;
  localStorage.setItem("storycraft_lang", l);
}

export function t(zh: string, en: string): string {
  return lang === "zh" ? zh : en;
}

// --- Per-world translator ---
export interface Translator {
  lang: Lang;
  room(id: string): string;
  roomDesc(id: string): string;
  npc(id: string): string;
  npcRole(id: string): string;
  item(id: string): string;
  clue(id: string): string;
  ending(id: string): string;
  endingSummary(id: string): string;
  consequence(id: string): string;
  interactive(id: string): string;
  strength(s: string): string;
  translateMsg(msg: string): string;
  intro(): string;
  help(): string;
}

export function createTranslator(pack: WorldPack, l: Lang): Translator {
  const tr = pack.translations;
  const adv = pack.adventure;

  // Helper: translate item English name to Chinese
  function trItemEn(en: string): string {
    for (const [id, t] of Object.entries(tr.items)) {
      if (adv.items[id]?.name === en) return t.zh;
    }
    return en;
  }

  function translateMsg(msg: string): string {
    if (l === "en") return msg;
    if (tr.messages[msg]) return tr.messages[msg];

    // Dynamic patterns
    const enterM = msg.match(/^You enter (.+)\.$/);
    if (enterM) {
      for (const [id, t] of Object.entries(tr.rooms)) {
        if (adv.rooms[id]?.name === enterM[1]) return `你进入了${t.zh}。`;
      }
      return `你进入了${enterM[1]}。`;
    }

    const takeM = msg.match(/^You take (.+)\.$/);
    if (takeM) return `你拿起了${trItemEn(takeM[1])}。`;

    const haveM = msg.match(/^You already have (.+)\.$/);
    if (haveM) return `你已经拥有了${trItemEn(haveM[1])}。`;

    const notDisc = msg.match(/^You have not discovered (.+) yet\.$/);
    if (notDisc) return `你还没有发现${trItemEn(notDisc[1])}。`;

    const notCarry = msg.match(/^(.+) is evidence to note, not something you can carry\.$/);
    if (notCarry) return `${trItemEn(notCarry[1])}是需要记录的证据，不能随身携带。`;

    const searchNo = msg.match(/^Searching (.+) reveals nothing useful right now\.$/);
    if (searchNo) return `搜索${searchNo[1]}目前没有发现什么有用的东西。`;

    if (msg.includes("Exits:") || msg.includes("Present:")) return trLookMsg(msg);
    if (msg.includes(": ")) return trEndingMsg(msg);

    return msg;
  }

  function trLookMsg(msg: string): string {
    for (const [id, descTr] of Object.entries(tr.roomDescriptions)) {
      const room = adv.rooms[id];
      if (room && msg.startsWith(room.description)) {
        let r = descTr.zh;
        const eM = msg.match(/Exits: (.+?)\./);
        if (eM) r += ` 出口：${eM[1]}。`;
        const pM = msg.match(/Present: (.+?)\./);
        if (pM) {
          r += ` 在场：${pM[1].split(", ").map((n: string) => {
            for (const [nid, nt] of Object.entries(tr.npcs)) {
              if (adv.npcs[nid]?.name === n.trim()) return `${nt.zh}（${tr.npcRoles[nid]?.zh ?? ""}）`;
            }
            return n;
          }).join("、")}。`;
        }
        return r;
      }
    }
    return msg;
  }

  function trEndingMsg(msg: string): string {
    let r = msg;
    for (const [id, t] of Object.entries(tr.endings)) {
      const e = adv.endings?.[id];
      if (e) {
        r = r.replace(e.title, t.zh);
        r = r.replace(e.summary, tr.endingSummaries[id]?.zh ?? e.summary);
      }
    }
    for (const [id, t] of Object.entries(tr.npcs)) {
      const npc = adv.npcs[id];
      if (npc) r = r.replace(npc.name, t.zh);
    }
    r = r.replace("but the evidence is insufficient.", "但证据不足。");
    r = r.replace("Your accusation fails to convince. The case goes unresolved.", "你的指控未能说服众人。案件悬而未决。");
    r = r.replace("You accuse", "你指控了");
    return r;
  }

  return {
    lang: l,
    room: (id) => l === "zh" ? (tr.rooms[id]?.zh ?? id) : (tr.rooms[id]?.en ?? adv.rooms[id]?.name ?? id),
    roomDesc: (id) => l === "zh" ? (tr.roomDescriptions[id]?.zh ?? "") : (adv.rooms[id]?.description ?? ""),
    npc: (id) => l === "zh" ? (tr.npcs[id]?.zh ?? id) : (tr.npcs[id]?.en ?? adv.npcs[id]?.name ?? id),
    npcRole: (id) => l === "zh" ? (tr.npcRoles[id]?.zh ?? "") : (tr.npcRoles[id]?.en ?? adv.npcs[id]?.role ?? ""),
    item: (id) => l === "zh" ? (tr.items[id]?.zh ?? id) : (tr.items[id]?.en ?? adv.items[id]?.name ?? id),
    clue: (id) => l === "zh" ? (tr.clues[id]?.zh ?? id) : (tr.clues[id]?.en ?? adv.clues[id]?.title ?? id),
    ending: (id) => l === "zh" ? (tr.endings[id]?.zh ?? id) : (tr.endings[id]?.en ?? adv.endings?.[id]?.title ?? id),
    endingSummary: (id) => l === "zh" ? (tr.endingSummaries[id]?.zh ?? "") : (tr.endingSummaries[id]?.en ?? adv.endings?.[id]?.summary ?? ""),
    consequence: (id) => l === "zh" ? (tr.consequences[id]?.zh ?? id) : (tr.consequences[id]?.en ?? adv.consequences?.[id]?.label ?? id),
    interactive: (id) => l === "zh" ? (tr.interactives[id]?.zh ?? adv.interactives[id]?.name ?? id) : (adv.interactives[id]?.name ?? id),
    strength: (s) => l === "zh" ? (tr.strengths[s]?.zh ?? s) : s,
    translateMsg,
    intro: () => l === "zh" ? pack.meta.intro.zh : pack.meta.intro.en,
    help: () => l === "zh" ? pack.meta.help.zh : pack.meta.help.en,
  };
}
