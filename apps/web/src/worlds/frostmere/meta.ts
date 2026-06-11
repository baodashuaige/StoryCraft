import type { WorldMeta } from "../world-registry";

export const frostmereMeta: WorldMeta = {
  id: "adv_frostmere_house",
  title: { zh: "霜钟楼的最后一声钟响", en: "The Last Bell at Frostmere House" },
  subtitle: {
    zh: "暴风雪中的庄园疑案",
    en: "A Snowbound Manor Mystery",
  },
  premise: {
    zh: "暴风雪之夜，庄园主人奥登·沃斯被发现死在钟楼之下。家中众人声称钟楼门从内部锁死。黎明时分，山路将被打通，嫌疑人将四散而去。你只有 <strong>9 个调查回合</strong> 来揭开真相。",
    en: "Master Alden Voss is found dead below the bell tower during a snowstorm. The household claims the tower door was locked from the inside. At dawn, the mountain road opens and the suspects can leave. You have <strong>9 investigation turns</strong> to find the truth.",
  },
  intro: {
    zh: "暴风雪之夜，庄园主人奥登·沃斯被发现死在钟楼之下。家中众人声称钟楼门从内部锁死。黎明时分，山路将被打通，嫌疑人将四散而去。你只有 8 个调查回合来揭开真相。",
    en: "You stand in the Great Hall of Frostmere House. A covered body lies near the stair. The tower door looms above the landing. Captain Rowan Vale watches you with impatient eyes.",
  help: {
    zh: "可以点击右侧地图和按钮操作，也可以输入命令：look, go, search, take, talk, use, inventory, accuse",
    en: "Click the map and buttons on the right, or type commands: look, go, search, take, talk, use, inventory, accuse",
  },
  coverImage: "🏔️",
  turns: 9,
  npcTopics: {
    npc_mina_arlen: [
      { alias: "alden", zh: "奥登", en: "Alden" },
      { alias: "bell", zh: "铃声", en: "Bell" },
      { alias: "key", zh: "钥匙", en: "Key" },
    ],
    npc_theo_rusk: [
      { alias: "designs", zh: "设计", en: "Designs" },
      { alias: "gloves", zh: "手套", en: "Gloves" },
      { alias: "ledger", zh: "账本", en: "Ledger" },
      { alias: "mercy", zh: "怜悯", en: "Mercy" },
    ],
    npc_captain_vale: [
      { alias: "report", zh: "报告", en: "Report" },
      { alias: "rush", zh: "催促", en: "Rush" },
    ],
  },
  npcAliases: {
    npc_mina_arlen: "mina",
    npc_theo_rusk: "theo",
    npc_captain_vale: "vale",
  },
  itemsByRoom: {
    room_servants_hall: ["item_brass_service_key"],
    room_study: ["item_torn_ledger_page"],
    room_winter_garden: ["item_soot_stained_gloves"],
    room_coach_yard: ["item_vial_laudanum"],
    room_bell_tower: ["item_cracked_bell_clapper"],
  },

}};
