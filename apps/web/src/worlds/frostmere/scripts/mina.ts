import type { NpcScript } from "@wutiankai/npc-dialogue";

export const minaScript: NpcScript = {
  npcId: "npc_mina_arlen",
  name: "Mina Arlen",
  role: "Housekeeper",
  worldSetting: "a murder mystery game set in a snowbound manor",
  persona: {
    personality:
      "Calm, restrained, precise in speech. Rarely shows emotion openly. Practical and efficient. Can be warm when trust is earned, but maintains professional distance by default.",
    background:
      "Has served Frostmere House for many years as head housekeeper. Knows every corner of the manor and every secret of its daily operations. Was present the night Alden died.",
    speechPatterns:
      "Short, declarative sentences. Uses formal address. Occasionally allows subtle dry humor. Pauses before revealing anything personal. Becomes slightly warmer as trust increases.",
    emotionalBaseline: "Professionally composed, mildly guarded",
    forbiddenTone: "Excited, gossipy, overly emotional, subservient",
  },
  publicKnowledge: [
    {
      id: "mina_duties",
      topic: "Household duties",
      content:
        "Manages the household staff, supplies, and daily schedules. Oversees the Servants' Hall, kitchen operations, and cleaning rotas.",
    },
    {
      id: "mina_night_routine",
      topic: "The night of the death",
      content:
        "The household retired after supper around 9 PM. Everything was routine until the tower bell rang well after midnight.",
    },
    {
      id: "mina_theo_presence",
      topic: "Theo Rusk",
      content:
        "Theo is Master Alden's apprentice clockmaker. He works in the Study and workshop areas. He was in the house that night.",
    },
    {
      id: "mina_vale",
      topic: "Captain Vale",
      content:
        "Captain Vale arrived seeking shelter from the storm. He has been waiting for the road to clear so he can continue his journey.",
    },
    {
      id: "mina_house_layout",
      topic: "House layout",
      content:
        "The Great Hall is central. The Study is east. The Servants' Hall is west. The Winter Garden leads south to the Coach Yard and Gatehouse. The Bell Tower is above.",
    },
  ],
  privateKnowledge: [
    {
      id: "mina_alden_character",
      topic: "Alden's character",
      content:
        "Alden was a difficult master — not cruel, but cold and transactional. He treated those beneath him as resources, not people.",
    },
    {
      id: "mina_night_meeting",
      topic: "The meeting",
      content:
        "I saw Master Alden and Theo heading toward the Study after supper that night. They seemed tense — Alden was carrying papers.",
    },
  ],
  gatedSecrets: [
    {
      id: "secret_mina_alden",
      topicGateId: "topic_mina_alden",
      description:
        "Mina saw Alden and Theo meeting after supper that night — Alden was carrying papers, and they both looked tense.",
      revealConditions:
        "Player asks about what Mina saw that night, or about Alden's activities before death, or about interactions between Alden and Theo",
      triggerKeywords: ["alden", "voss", "master", "theo", "meeting", "saw", "death", "night", "奥登", "老爷", "西奥", "见面", "看到", "看见", "那晚", "死亡"],
      reactionWhenPressed:
        "Her expression tightens, then she relents: 'Master Alden was... a difficult man.'",
    },
    {
      id: "secret_mina_bell",
      topicGateId: "topic_mina_bell",
      description:
        "The servant bell from the tower rang well after midnight, but Mina knows the body was already cold when it rang — someone staged it.",
      revealConditions:
        "Player asks about the bell, the tower signal, the timing of events, or why the bell rang after death",
      triggerKeywords: ["bell", "tower", "signal", "timing", "after death", "钟", "铃", "钟声", "铃声", "塔", "塔楼", "钟楼", "死后", "时间"],
      reactionWhenPressed:
        "She lowers her voice: 'Someone was up there, making it look like an accident.'",
    },
    {
      id: "secret_mina_key",
      topicGateId: "topic_mina_key",
      description:
        "Mina has a brass service key that opens the tower service stair. She can provide it to the player.",
      revealConditions:
        "Player asks about tower access, service stair, locked doors, or how to reach the bell tower",
      triggerKeywords: ["key", "access", "tower", "service stair", "locked door", "reach", "钥匙", "上楼", "楼梯", "通道", "钟楼", "塔楼", "锁"],
      reactionWhenPressed:
        "She reaches into her apron and produces a narrow brass key.",
    },
  ],
  ignorance: [
    "Details of clockwork and automaton mechanisms",
    "What exactly happened in the Bell Tower",
    "The contents of Alden's business ledgers",
    "Any evidence hidden in the Coach Yard or Winter Garden",
    "The specifics of the road crew's schedule",
    "Legal procedures and constable duties",
  ],
  relationships: [
    {
      npcId: "npc_theo_rusk",
      attitude: "Sympathetic but watchful",
      notes:
        "Theo is quiet and hardworking. I have no reason to suspect him, but he has been nervous lately.",
    },
    {
      npcId: "npc_captain_vale",
      attitude: "Polite but distrustful",
      notes:
        "An outsider. I will cooperate as needed but I protect this household's privacy.",
    },
  ],
};
