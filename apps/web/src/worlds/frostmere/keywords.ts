/**
 * Frostmere-specific bilingual keyword map for gate review.
 * Maps English keywords from NPC secret definitions to Chinese equivalents.
 */
export const FROSTMERE_KEYWORDS: Record<string, string[]> = {
  // Actions
  "saw": ["看到", "看见", "目击", "见到"],
  "meeting": ["见面", "会面", "相遇"],
  "asked": ["问", "询问", "提到"],
  "confronts": ["对质", "质问", "质询", "质问"],
  "presents": ["出示", "展示", "拿出", "给"],
  "requests": ["请求", "要求"],
  "offers": ["提供", "给"],
  "gathered": ["收集", "搜集", "找到"],
  "shows": ["展示", "给看", "出示"],
  "file": ["提交", "写报告", "立案"],
  "report": ["报告", "立案", "正式"],
  "triggered": ["触发", "激活"],
  "sell": ["卖", "出售", "卖掉"],
  "staged": ["伪造", "伪造现场", "假造"],
  "drugged": ["下药", "迷药", "药物"],

  // Objects
  "bell": ["钟", "铃", "钟声", "铃声"],
  "tower": ["塔", "塔楼", "钟楼"],
  "key": ["钥匙"],
  "designs": ["设计", "设计图", "作品"],
  "gloves": ["手套"],
  "ledger": ["账本", "账簿", "账目"],
  "footprints": ["脚印", "足迹", "痕迹"],
  "evidence": ["证据", "线索"],

  // People
  "alden": ["奥登"],
  "theo": ["西奥"],
  "mina": ["米娜"],
  "vale": ["韦尔", "维尔"],

  // Places
  "garden": ["花园"],
  "study": ["书房", "办公室"],
  "stair": ["楼梯", "通道"],
  "servant": ["仆人", "仆役"],

  // Time
  "night": ["晚上", "夜里", "那晚", "当晚"],
  "dawn": ["天亮", "黎明", "天明"],
  "after": ["之后", "以后", "后"],
  "death": ["死", "死亡", "死后"],

  // Qualifiers
  "substantial": ["足够", "充分", "大量"],
  "mercy": ["宽恕", "仁慈", "原谅"],
  "betrayal": ["背叛", "出卖"],
};
