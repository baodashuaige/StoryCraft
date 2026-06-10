/**
 * Static mapping from game IDs to illustration file paths.
 * Images live in /public/images/ and are served by Vite.
 */

export const ROOM_IMAGE: Record<string, string> = {
  room_great_hall: "/images/GreatHall.png",
  room_study: "/images/Study.png",
  room_servants_hall: "/images/Servants'Hall.png",
  room_bell_tower: "/images/BellTower.png",
  room_winter_garden: "/images/WinterGarden.png",
  room_coach_yard: "/images/CoachYard.png",
  room_gatehouse: "/images/Gatehouse.png",
};

export const NPC_IMAGE: Record<string, string> = {
  npc_mina_arlen: "/images/MinaArlen.png",
  npc_theo_rusk: "/images/TheoRusk.png",
  npc_captain_vale: "/images/CaptainRowanVale.png",
};
