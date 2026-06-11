import type { AdventureDefinition } from "../../../shared/src";

export const frostmereAdventure: AdventureDefinition = {
  meta: {
    id: "adv_frostmere_house",
    title: "The Last Bell at Frostmere House",
    initialRoomId: "room_great_hall",
    initialTurnsRemaining: 9
  },
  rooms: {
    room_great_hall: {
      id: "room_great_hall",
      name: "Great Hall",
      description:
        "A cold central hall with a covered body near the stair. The tower door stands above the landing.",
      exitIds: [
        "exit_great_hall_to_bell_tower",
        "exit_great_hall_to_study",
        "exit_great_hall_to_servants_hall",
        "exit_great_hall_to_winter_garden"
      ],
      interactiveIds: [
        "int_great_hall_body",
        "int_great_hall_stair",
        "int_great_hall_tower_door"
      ],
      tags: ["hub", "crime_scene"]
    },
    room_study: {
      id: "room_study",
      name: "Study",
      description:
        "Alden's private office. Ledgers sit beside a cold fireplace and an open wall safe.",
      exitIds: ["exit_study_to_great_hall"],
      interactiveIds: [
        "int_study_desk",
        "int_study_ledgers",
        "int_study_fireplace",
        "int_study_safe"
      ],
      tags: ["motive"]
    },
    room_servants_hall: {
      id: "room_servants_hall",
      name: "Servants' Hall",
      description:
        "A narrow warm room with drying coats, kitchen ledgers, and a servant bell board.",
      exitIds: [
        "exit_servants_hall_to_great_hall",
        "exit_servants_hall_to_bell_tower"
      ],
      interactiveIds: [
        "int_servants_hall_coat_hooks",
        "int_servants_hall_bell_board",
        "int_servants_hall_kitchen_ledger"
      ],
      tags: ["npc_home"]
    },
    room_bell_tower: {
      id: "room_bell_tower",
      name: "Bell Tower",
      description:
        "A cramped tower chamber with a frayed bell rope, latched window, and metal fragments near the platform.",
      exitIds: [
        "exit_bell_tower_to_great_hall",
        "exit_bell_tower_to_servants_hall"
      ],
      interactiveIds: [
        "int_bell_tower_rope",
        "int_bell_tower_clapper_mount",
        "int_bell_tower_window_latch",
        "int_bell_tower_platform_edge"
      ],
      tags: ["crime_scene"]
    },
    room_winter_garden: {
      id: "room_winter_garden",
      name: "Winter Garden",
      description:
        "A glass-roofed conservatory choked with frost and snow tracked in from outside.",
      exitIds: [
        "exit_winter_garden_to_great_hall",
        "exit_winter_garden_to_coach_yard"
      ],
      interactiveIds: [
        "int_winter_garden_snow_trail",
        "int_winter_garden_broken_planter",
        "int_winter_garden_glass_door"
      ],
      tags: ["route"]
    },
    room_coach_yard: {
      id: "room_coach_yard",
      name: "Coach Yard",
      description:
        "Coaches sit under drifts. A lantern burns in the stable arch though no one admits lighting it.",
      exitIds: [
        "exit_coach_yard_to_winter_garden",
        "exit_coach_yard_to_gatehouse"
      ],
      interactiveIds: [
        "int_coach_yard_stable_arch",
        "int_coach_yard_snowbank",
        "int_coach_yard_coach_box"
      ],
      tags: ["evidence"]
    },
    room_gatehouse: {
      id: "room_gatehouse",
      name: "Gatehouse",
      description:
        "The outer gate creaks in the wind. By dawn, the road crew will clear the pass.",
      exitIds: ["exit_gatehouse_to_coach_yard"],
      interactiveIds: [
        "int_gatehouse_gate",
        "int_gatehouse_road_bell",
        "int_gatehouse_evidence_satchel"
      ],
      tags: ["final_threshold"]
    }
  },
  exits: {
    exit_great_hall_to_bell_tower: {
      id: "exit_great_hall_to_bell_tower",
      fromRoomId: "room_great_hall",
      toRoomId: "room_bell_tower",
      direction: "north",
      aliases: ["north", "bell tower", "tower"],
      visible: true,
      locked: true,
      failureText: "The tower door is locked for now."
    },
    exit_great_hall_to_study: {
      id: "exit_great_hall_to_study",
      fromRoomId: "room_great_hall",
      toRoomId: "room_study",
      direction: "east",
      aliases: ["east", "study"],
      visible: true
    },
    exit_great_hall_to_servants_hall: {
      id: "exit_great_hall_to_servants_hall",
      fromRoomId: "room_great_hall",
      toRoomId: "room_servants_hall",
      direction: "west",
      aliases: ["west", "servants hall", "servants' hall"],
      visible: true
    },
    exit_great_hall_to_winter_garden: {
      id: "exit_great_hall_to_winter_garden",
      fromRoomId: "room_great_hall",
      toRoomId: "room_winter_garden",
      direction: "south",
      aliases: ["south", "winter garden", "garden"],
      visible: true
    },
    exit_study_to_great_hall: {
      id: "exit_study_to_great_hall",
      fromRoomId: "room_study",
      toRoomId: "room_great_hall",
      direction: "west",
      aliases: ["west", "great hall", "hall"],
      visible: true
    },
    exit_servants_hall_to_great_hall: {
      id: "exit_servants_hall_to_great_hall",
      fromRoomId: "room_servants_hall",
      toRoomId: "room_great_hall",
      direction: "east",
      aliases: ["east", "great hall", "hall"],
      visible: true
    },
    exit_servants_hall_to_bell_tower: {
      id: "exit_servants_hall_to_bell_tower",
      fromRoomId: "room_servants_hall",
      toRoomId: "room_bell_tower",
      direction: "north-east",
      aliases: ["north-east", "northeast", "bell tower", "tower"],
      visible: true,
      locked: true,
      failureText: "The service stair is locked for now."
    },
    exit_bell_tower_to_great_hall: {
      id: "exit_bell_tower_to_great_hall",
      fromRoomId: "room_bell_tower",
      toRoomId: "room_great_hall",
      direction: "south",
      aliases: ["south", "great hall", "hall"],
      visible: true
    },
    exit_bell_tower_to_servants_hall: {
      id: "exit_bell_tower_to_servants_hall",
      fromRoomId: "room_bell_tower",
      toRoomId: "room_servants_hall",
      direction: "south-west",
      aliases: ["south-west", "southwest", "servants hall", "servants' hall"],
      visible: true
    },
    exit_winter_garden_to_great_hall: {
      id: "exit_winter_garden_to_great_hall",
      fromRoomId: "room_winter_garden",
      toRoomId: "room_great_hall",
      direction: "north",
      aliases: ["north", "great hall", "hall"],
      visible: true
    },
    exit_winter_garden_to_coach_yard: {
      id: "exit_winter_garden_to_coach_yard",
      fromRoomId: "room_winter_garden",
      toRoomId: "room_coach_yard",
      direction: "south",
      aliases: ["south", "coach yard", "yard"],
      visible: true
    },
    exit_coach_yard_to_winter_garden: {
      id: "exit_coach_yard_to_winter_garden",
      fromRoomId: "room_coach_yard",
      toRoomId: "room_winter_garden",
      direction: "north",
      aliases: ["north", "winter garden", "garden"],
      visible: true
    },
    exit_coach_yard_to_gatehouse: {
      id: "exit_coach_yard_to_gatehouse",
      fromRoomId: "room_coach_yard",
      toRoomId: "room_gatehouse",
      direction: "south",
      aliases: ["south", "gatehouse", "gate"],
      visible: true
    },
    exit_gatehouse_to_coach_yard: {
      id: "exit_gatehouse_to_coach_yard",
      fromRoomId: "room_gatehouse",
      toRoomId: "room_coach_yard",
      direction: "north",
      aliases: ["north", "coach yard", "yard"],
      visible: true
    }
  },
  interactives: {
    int_great_hall_body: {
      id: "int_great_hall_body",
      roomId: "room_great_hall",
      name: "covered body",
      aliases: ["body", "covered body", "alden", "voss"],
      visibleFromStart: true,
      searchOutcome: {
        message:
          "A broken watch in Alden's pocket is stopped at 11:47, earlier than the household's midnight story.",
        alreadySearchedMessage:
          "You have already checked the body. The stopped watch remains your clearest time marker.",
        clueIds: ["clue_watch_stopped_1147"]
      }
    },
    int_great_hall_stair: {
      id: "int_great_hall_stair",
      roomId: "room_great_hall",
      name: "stair",
      aliases: ["stair", "stairs"],
      visibleFromStart: true
    },
    int_great_hall_tower_door: {
      id: "int_great_hall_tower_door",
      roomId: "room_great_hall",
      name: "tower door",
      aliases: ["tower door", "door"],
      visibleFromStart: true
    },
    int_study_desk: {
      id: "int_study_desk",
      roomId: "room_study",
      name: "desk",
      aliases: ["desk"],
      visibleFromStart: true,
      searchOutcome: {
        message:
          "A torn ledger page names Theo's automaton designs among assets Alden planned to sell.",
        alreadySearchedMessage:
          "The desk has already yielded the torn ledger page and its motive.",
        clueIds: ["clue_stolen_design_motive"],
        revealedItemIds: ["item_torn_ledger_page"]
      }
    },
    int_study_ledgers: {
      id: "int_study_ledgers",
      roomId: "room_study",
      name: "ledgers",
      aliases: ["ledgers", "ledger"],
      visibleFromStart: true
    },
    int_study_fireplace: {
      id: "int_study_fireplace",
      roomId: "room_study",
      name: "fireplace",
      aliases: ["fireplace"],
      visibleFromStart: true
    },
    int_study_safe: {
      id: "int_study_safe",
      roomId: "room_study",
      name: "open wall safe",
      aliases: ["safe", "wall safe"],
      visibleFromStart: true
    },
    int_servants_hall_coat_hooks: {
      id: "int_servants_hall_coat_hooks",
      roomId: "room_servants_hall",
      name: "coat hooks",
      aliases: ["coat hooks", "coats"],
      visibleFromStart: true,
      searchOutcome: {
        message:
          "Behind the coats you find a brass service key hidden in a coat pocket. Mina will not be pleased that you searched here.",
        alreadySearchedMessage:
          "You have already searched the coat hooks.",
        revealedItemIds: ["item_brass_service_key"],
        clueIds: [],
        consequenceIds: ["conseq_broke_mina_trust"]
      }
    },
    int_servants_hall_bell_board: {
      id: "int_servants_hall_bell_board",
      roomId: "room_servants_hall",
      name: "servant bell board",
      aliases: ["bell board", "servant bell board"],
      visibleFromStart: true,
      searchOutcome: {
        message:
          "The bell board shows the tower signal rang after Alden was already dead.",
        alreadySearchedMessage:
          "The bell board still points to a signal after the likely time of death.",
        clueIds: ["clue_servant_bell_after_death"]
      }
    },
    int_servants_hall_kitchen_ledger: {
      id: "int_servants_hall_kitchen_ledger",
      roomId: "room_servants_hall",
      name: "kitchen ledger",
      aliases: ["kitchen ledger"],
      visibleFromStart: true
    },
    int_bell_tower_rope: {
      id: "int_bell_tower_rope",
      roomId: "room_bell_tower",
      name: "bell rope",
      aliases: ["bell rope", "rope"],
      visibleFromStart: true
    },
    int_bell_tower_clapper_mount: {
      id: "int_bell_tower_clapper_mount",
      roomId: "room_bell_tower",
      name: "clapper mount",
      aliases: ["clapper mount", "mount"],
      visibleFromStart: true,
      searchOutcome: {
        message:
          "The cracked clapper mount shows the tower mechanism was tampered with and the fall was staged.",
        alreadySearchedMessage:
          "The clapper mount has already shown you how the tower scene was staged.",
        clueIds: ["clue_tower_staged"],
        revealedItemIds: ["item_cracked_bell_clapper"]
      }
    },
    int_bell_tower_window_latch: {
      id: "int_bell_tower_window_latch",
      roomId: "room_bell_tower",
      name: "window latch",
      aliases: ["window latch", "latch"],
      visibleFromStart: true
    },
    int_bell_tower_platform_edge: {
      id: "int_bell_tower_platform_edge",
      roomId: "room_bell_tower",
      name: "platform edge",
      aliases: ["platform edge", "edge"],
      visibleFromStart: true
    },
    int_winter_garden_snow_trail: {
      id: "int_winter_garden_snow_trail",
      roomId: "room_winter_garden",
      name: "snow trail",
      aliases: ["snow trail", "trail"],
      visibleFromStart: true,
      searchOutcome: {
        message:
          "Narrow soot-marked footprints cross the frost and double back toward the Coach Yard.",
        alreadySearchedMessage:
          "The doubled-back soot-marked trail remains visible in the frost.",
        clueIds: ["clue_soot_marked_garden_route"],
        revealedItemIds: ["item_soot_stained_gloves"]
      }
    },
    int_winter_garden_broken_planter: {
      id: "int_winter_garden_broken_planter",
      roomId: "room_winter_garden",
      name: "broken planter",
      aliases: ["broken planter", "planter"],
      visibleFromStart: true
    },
    int_winter_garden_glass_door: {
      id: "int_winter_garden_glass_door",
      roomId: "room_winter_garden",
      name: "glass door",
      aliases: ["glass door", "door"],
      visibleFromStart: true
    },
    int_coach_yard_stable_arch: {
      id: "int_coach_yard_stable_arch",
      roomId: "room_coach_yard",
      name: "stable arch",
      aliases: ["stable arch", "arch"],
      visibleFromStart: true
    },
    int_coach_yard_snowbank: {
      id: "int_coach_yard_snowbank",
      roomId: "room_coach_yard",
      name: "snowbank",
      aliases: ["snowbank", "snow bank"],
      visibleFromStart: true,
      searchOutcome: {
        message:
          "A vial of laudanum is tucked into the snowbank, making the fall look less like an accident.",
        alreadySearchedMessage:
          "The snowbank has already given up the laudanum evidence.",
        clueIds: ["clue_drugged_before_fall"],
        revealedItemIds: ["item_vial_laudanum"],
        weakenedByConsequence: "conseq_tipped_off_theo",
        weakenedMessage:
          "You find only a crushed cork in the snow. Someone has been here before you — the real evidence is gone.",
        weakenedClueStrength: "weak"
      }
    },
    int_coach_yard_coach_box: {
      id: "int_coach_yard_coach_box",
      roomId: "room_coach_yard",
      name: "coach box",
      aliases: ["coach box"],
      visibleFromStart: true
    },
    int_gatehouse_gate: {
      id: "int_gatehouse_gate",
      roomId: "room_gatehouse",
      name: "outer gate",
      aliases: ["gate", "outer gate"],
      visibleFromStart: true
    },
    int_gatehouse_road_bell: {
      id: "int_gatehouse_road_bell",
      roomId: "room_gatehouse",
      name: "road bell",
      aliases: ["road bell"],
      visibleFromStart: true
    },
    int_gatehouse_evidence_satchel: {
      id: "int_gatehouse_evidence_satchel",
      roomId: "room_gatehouse",
      name: "evidence satchel",
      aliases: ["evidence satchel", "satchel"],
      visibleFromStart: true
    }
  },
  npcs: {
    npc_mina_arlen: {
      id: "npc_mina_arlen",
      name: "Mina Arlen",
      role: "Housekeeper",
      initialRoomId: "room_servants_hall",
      initialTrust: 0
    },
    npc_theo_rusk: {
      id: "npc_theo_rusk",
      name: "Theo Rusk",
      role: "Apprentice Clockmaker",
      initialRoomId: "room_study",
      initialTrust: 0
    },
    npc_captain_vale: {
      id: "npc_captain_vale",
      name: "Captain Rowan Vale",
      role: "Stranded Constable",
      initialRoomId: "room_great_hall",
      initialTrust: 0
    }
  },
  items: {
    item_brass_service_key: {
      id: "item_brass_service_key",
      name: "Brass Service Key",
      description: "A narrow key for the tower service stair.",
      aliases: ["brass service key", "service key", "key"],
      carryable: true
    },
    item_torn_ledger_page: {
      id: "item_torn_ledger_page",
      name: "Torn Ledger Page",
      description: "A torn page that points toward Alden's stolen design sale.",
      aliases: ["torn ledger page", "ledger page", "page"],
      carryable: true
    },
    item_soot_stained_gloves: {
      id: "item_soot_stained_gloves",
      name: "Soot-Stained Gloves",
      description: "Gloves marked with dark workshop soot.",
      aliases: ["soot-stained gloves", "gloves"],
      carryable: true
    },
    item_vial_laudanum: {
      id: "item_vial_laudanum",
      name: "Vial of Laudanum",
      description: "A small vial with a bitter medicinal smell.",
      aliases: ["vial of laudanum", "laudanum", "vial"],
      carryable: true
    },
    item_cracked_bell_clapper: {
      id: "item_cracked_bell_clapper",
      name: "Cracked Bell Clapper",
      description: "A damaged piece of the bell mechanism.",
      aliases: ["cracked bell clapper", "bell clapper", "clapper"],
      carryable: false
    }
  },
  clues: {
    clue_watch_stopped_1147: {
      id: "clue_watch_stopped_1147",
      title: "Watch Stopped at 11:47",
      summary: "Alden's broken watch fixes the likely death time before midnight.",
      defaultStrength: "standard"
    },
    clue_servant_bell_after_death: {
      id: "clue_servant_bell_after_death",
      title: "Servant Bell After Death",
      summary: "The tower signal rang after Alden was already dead.",
      defaultStrength: "standard"
    },
    clue_stolen_design_motive: {
      id: "clue_stolen_design_motive",
      title: "Stolen Design Motive",
      summary: "Alden planned to sell Theo's automaton designs.",
      defaultStrength: "standard"
    },
    clue_soot_marked_garden_route: {
      id: "clue_soot_marked_garden_route",
      title: "Soot-Marked Garden Route",
      summary: "Soot-marked footprints show someone used the garden path and doubled back.",
      defaultStrength: "standard"
    },
    clue_drugged_before_fall: {
      id: "clue_drugged_before_fall",
      title: "Drugged Before the Fall",
      summary: "Laudanum evidence suggests Alden was incapacitated before the tower fall.",
      defaultStrength: "standard"
    },
    clue_tower_staged: {
      id: "clue_tower_staged",
      title: "Tower Was Staged",
      summary: "The cracked clapper mount shows the locked-room fall was staged.",
      defaultStrength: "standard"
    }
  },
  topicGates: {
    // Mina topics
    topic_mina_greeting: {
      id: "topic_mina_greeting",
      npcId: "npc_mina_arlen",
      topicAliases: ["greeting", "hello", "hi", "你好", "嗨"],
      requires: [],
      blockedResponse: "",
      response:
        "Mina straightens her apron. 'If you need something, ask plainly. I have duties to attend to.'",
      repeatedResponse:
        "Mina nods curtly. 'We have already exchanged pleasantries.'"
    },
    topic_mina_alden: {
      id: "topic_mina_alden",
      npcId: "npc_mina_arlen",
      topicAliases: ["alden", "master", "voss", "death", "奥登", "艾登", "老爷", "被害人", "被害者"],
      requires: [],
      blockedResponse: "",
      response:
        "Mina's expression tightens. 'Master Alden was... a difficult man. He met with Theo after supper that night — I saw them heading toward the Study. He was not kind to those he considered beneath him.'",
      repeatedResponse:
        "Mina shakes her head. 'I have told you what I know about the Master.'",
      trustDelta: 1
    },
    topic_mina_bell: {
      id: "topic_mina_bell",
      npcId: "npc_mina_arlen",
      topicAliases: ["bell", "tower", "servant bell", "铃", "铃声", "钟声", "塔", "塔楼", "钟楼"],
      requires: [
        { kind: "trust_at_least", npcId: "npc_mina_arlen", minTrust: 1 }
      ],
      blockedResponse:
        "Mina's eyes narrow. 'I do not discuss household matters with strangers.'",
      response:
        "Mina lowers her voice. 'The servant bell from the tower rang well after midnight — but I know the body was already cold when it rang. Someone was up there, making it look like an accident.'",
      repeatedResponse:
        "'I have told you about the bell. Someone rang it after Alden was already dead.'",
      revealsClueIds: ["clue_servant_bell_after_death"],
      trustDelta: 1
    },
    topic_mina_key: {
      id: "topic_mina_key",
      npcId: "npc_mina_arlen",
      topicAliases: ["key", "tower access", "access", "service stair", "钥匙", "楼梯", "通道"],
      requires: [
        { kind: "trust_at_least", npcId: "npc_mina_arlen", minTrust: 2 }
      ],
      blockedResponse:
        "Mina's jaw sets. 'There are locked doors in this house for a reason.'",
      response:
        "Mina reaches into her apron and produces a narrow brass key. 'The service stair to the tower. Use it carefully — and do not let Captain Vale see how you got it.'",
      repeatedResponse:
        "'I have already given you what you need for the tower. Be careful.'",
      grantsItemIds: ["item_brass_service_key"],
      flagChanges: { minaGrantedAccess: true }
    },
    // Theo topics
    topic_theo_greeting: {
      id: "topic_theo_greeting",
      npcId: "npc_theo_rusk",
      topicAliases: ["greeting", "hello", "hi", "你好", "嗨"],
      requires: [],
      blockedResponse: "",
      response:
        "Theo startles, then steadies himself. 'Oh — you are the magistrate. I was just... working. On repairs.'",
      repeatedResponse: "Theo nods nervously. 'Yes?'"
    },
    topic_theo_designs: {
      id: "topic_theo_designs",
      npcId: "npc_theo_rusk",
      topicAliases: ["designs", "clockwork", "work", "automaton", "设计", "设计图", "机械", "钟表", "作品"],
      requires: [],
      blockedResponse: "",
      response:
        "A flicker of pride crosses Theo's face. 'My automaton designs were my life's work. Master Alden kept them in the Study safe — said he was protecting my interests.' His voice drops. 'I am not so sure anymore.'",
      repeatedResponse:
        "'I told you about my designs. Master Alden was supposed to protect them.'",
      trustDelta: 1
    },
    topic_theo_gloves: {
      id: "topic_theo_gloves",
      npcId: "npc_theo_rusk",
      topicAliases: ["gloves", "soot", "garden route", "手套", "煤灰"],
      requires: [
        { kind: "has_item", itemId: "item_soot_stained_gloves" },
        { kind: "not_has_consequence", consequenceId: "conseq_tipped_off_theo" }
      ],
      blockedResponse:
        "Theo fidgets with his cuffs. 'I do not know what you mean.'",
      response:
        "Theo's face drains of color when he sees the gloves. 'Where did you — those could belong to anyone. The workshops are always sooty.' He takes a step back. 'I need some air. I'll be in the Great Hall.'",
      repeatedResponse: "Theo avoids your gaze. 'I have nothing more to say about those.'",
      consequenceIds: ["conseq_tipped_off_theo"],
      movesNpcToRoomId: "room_great_hall"
    },
    topic_theo_ledger: {
      id: "topic_theo_ledger",
      npcId: "npc_theo_rusk",
      topicAliases: ["ledger", "page", "contract", "账本", "账簿", "合同"],
      requires: [
        { kind: "has_item", itemId: "item_torn_ledger_page" },
        { kind: "not_has_consequence", consequenceId: "conseq_tipped_off_theo" }
      ],
      blockedResponse:
        "Theo looks puzzled. 'What ledger? I keep my notes in the workshop.'",
      response:
        "Theo freezes when he sees the torn page. 'He was going to sell them. My designs — he was going to sell them and send me away.' His voice cracks. 'I need to leave. I'll wait in the Great Hall.'",
      repeatedResponse:
        "Theo refuses to discuss the ledger further.",
      consequenceIds: ["conseq_tipped_off_theo"],
      movesNpcToRoomId: "room_great_hall"
    },
    topic_theo_mercy: {
      id: "topic_theo_mercy",
      npcId: "npc_theo_rusk",
      topicAliases: ["mercy", "confession", "truth", "怜悯", "宽恕", "认罪", "真相", "自白"],
      requires: [
        { kind: "clue_count_at_least", minStrength: "standard", minClueCount: 4 },
        { kind: "has_consequence", consequenceId: "conseq_tipped_off_theo" }
      ],
      blockedResponse:
        "Theo shakes his head. 'I do not know what you want from me.'",
      response:
        "Theo slumps against the wall. 'You know, don't you? About the designs — about everything.' He stares at the floor. 'He was going to throw my life away. I just... I wanted him to stop. I never meant for it to end like this.'",
      repeatedResponse:
        "'I have told you everything. What happens now is up to you.'",
      flagChanges: { theo_confessed: true }
    },
    // Vale topics
    topic_vale_greeting: {
      id: "topic_vale_greeting",
      npcId: "npc_captain_vale",
      topicAliases: ["greeting", "hello", "hi", "captain", "你好", "嗨", "队长"],
      requires: [],
      blockedResponse: "",
      response:
        "Captain Vale taps his boot impatiently. 'Well? Have you found anything useful, or are we standing around until the road opens?'",
      repeatedResponse: "Vale crosses his arms. 'What now?'"
    },
    topic_vale_report: {
      id: "topic_vale_report",
      npcId: "npc_captain_vale",
      topicAliases: ["report", "official", "arrest", "formal", "报告", "立案", "逮捕", "正式"],
      requires: [
        { kind: "clue_count_at_least", minStrength: "standard", minClueCount: 3 }
      ],
      blockedResponse:
        "Vale scowls. 'Come back when you have something solid. I will not file a report on guesswork.'",
      response:
        "Vale considers your evidence carefully. 'This is substantive. If you can name a suspect and back it up, I will file a complete report. The bruising on the body looked wrong for a simple fall — I noticed that myself.'",
      repeatedResponse:
        "'I have reviewed your evidence. Make your accusation when ready.'",
      trustDelta: 1
    },
    topic_vale_rush: {
      id: "topic_vale_rush",
      npcId: "npc_captain_vale",
      topicAliases: ["rush", "hurry", "pressure", "dawn", "着急", "赶", "催", "天亮", "黎明"],
      requires: [],
      blockedResponse: "",
      response:
        "Vale glances at the window. 'The road opens at dawn. Once it does, people scatter and evidence walks away. We need a name before then.'",
      repeatedResponse: "'Time is running out. I need a name.'",
      consequenceIds: ["conseq_captain_rushed_case"]
    }
  },
  useRules: {
    use_key_tower: {
      id: "use_key_tower",
      itemId: "item_brass_service_key",
      targetAliases: ["tower door", "service stair", "bell tower", "tower"],
      requires: [],
      blockedResponse: "",
      response:
        "The brass key turns in the lock. The tower door clicks open.",
      alreadyUsedResponse: "The tower is already unlocked.",
      unlocksExitIds: ["exit_great_hall_to_bell_tower", "exit_servants_hall_to_bell_tower"],
      consequenceIds: ["conseq_used_private_key"],
      flagChanges: { towerUnlocked: true }
    },
    use_ledger_theo: {
      id: "use_ledger_theo",
      itemId: "item_torn_ledger_page",
      targetAliases: ["theo", "theo rusk"],
      requires: [
        { kind: "not_has_consequence", consequenceId: "conseq_tipped_off_theo" }
      ],
      blockedResponse: "Theo is not here to speak with.",
      response:
        "Theo goes pale when you show him the ledger page. 'He was selling my work — my life's work!' He backs away. 'I need to leave. I'll be in the Great Hall.'",
      consequenceIds: ["conseq_tipped_off_theo"],
      npcPresent: "npc_theo_rusk",
      flagChanges: {}
    },
    use_gloves_theo: {
      id: "use_gloves_theo",
      itemId: "item_soot_stained_gloves",
      targetAliases: ["theo", "theo rusk"],
      requires: [
        { kind: "not_has_consequence", consequenceId: "conseq_tipped_off_theo" }
      ],
      blockedResponse: "Theo is not here to speak with.",
      response:
        "Theo stares at the soot-stained gloves. 'Those are not — anyone could have...' He cannot finish the sentence. 'I need air. I'll be in the Great Hall.'",
      consequenceIds: ["conseq_tipped_off_theo"],
      npcPresent: "npc_theo_rusk",
      flagChanges: {}
    }
  },
  endings: {
    // Priority 1: Best ending — private mercy confession in Great Hall
    ending_apprentice_confession: {
      id: "ending_apprentice_confession",
      title: "The Apprentice's Confession",
      summary:
        "Theo confesses privately and gives up the stolen contract fragments. Public justice is incomplete, but the truth is known to you.",
      priority: 1,
      conditions: [
        { kind: "clue_count_at_least", minStrength: "standard", minClueCount: 4 },
        { kind: "has_clue", clueId: "clue_stolen_design_motive", minStrength: "standard" },
        { kind: "has_clue", clueId: "clue_tower_staged", minStrength: "standard" },
        { kind: "not_has_consequence", consequenceId: "conseq_made_public_accusation" },
        { kind: "has_consequence", consequenceId: "conseq_tipped_off_theo" }
      ],
      requiresNpcId: "npc_theo_rusk",
      requiresMode: "mercy",
      requiresRoomId: "room_great_hall",
      consequenceIds: ["conseq_offered_theo_mercy"]
    },
    // Priority 2: Good ending — formal arrest with full evidence
    ending_bell_rings_true: {
      id: "ending_bell_rings_true",
      title: "The Bell Rings True",
      summary:
        "Theo is arrested. Mina confirms the servant bell detail. Vale files a complete report. The road opens with the truth preserved.",
      priority: 2,
      conditions: [
        { kind: "has_consequence", consequenceId: "conseq_made_public_accusation" },
        { kind: "clue_count_at_least", minStrength: "standard", minClueCount: 4 },
        { kind: "has_clue", clueId: "clue_stolen_design_motive", minStrength: "standard" },
        { kind: "has_clue", clueId: "clue_tower_staged", minStrength: "standard" },
        { kind: "npc_in_room", npcId: "npc_captain_vale" }
      ],
      requiresNpcId: "npc_theo_rusk"
    },
    // Priority 3: Partial ending — right suspect, thin evidence
    ending_rushed_accusation: {
      id: "ending_rushed_accusation",
      title: "A Hasty Verdict",
      summary:
        "You name Theo publicly, but the evidence is thin. Vale makes the arrest reluctantly. The case may not hold at trial.",
      priority: 3,
      conditions: [
        { kind: "has_consequence", consequenceId: "conseq_made_public_accusation" },
        { kind: "clue_count_at_least", minStrength: "standard", minClueCount: 2 },
        { kind: "has_clue", clueId: "clue_stolen_design_motive", minStrength: "standard" }
      ],
      requiresNpcId: "npc_theo_rusk"
    },
    // Priority 4: Wrong person — accuse Mina
    ending_false_accusation: {
      id: "ending_false_accusation",
      title: "The Wrong Hand",
      summary:
        "You accuse Mina Arlen. Vale is skeptical but makes a show of authority. Mina's grief turns cold. The real killer walks free with the road crew.",
      priority: 4,
      conditions: [
        { kind: "has_consequence", consequenceId: "conseq_made_public_accusation" }
      ],
      requiresNpcId: "npc_mina_arlen"
    },
    // Priority 5: Wrong person — accuse Vale
    ending_vale_accused: {
      id: "ending_vale_accused",
      title: "The Constable's Fury",
      summary:
        "You turn on Captain Vale. He is incensed by the accusation. Mina watches in silence. When the road opens, Theo slips away unnoticed.",
      priority: 5,
      conditions: [
        { kind: "has_consequence", consequenceId: "conseq_made_public_accusation" }
      ],
      requiresNpcId: "npc_captain_vale"
    },
    // Priority 6: Private mode dead end — fixes the "private does nothing" bug
    ending_private_dead_end: {
      id: "ending_private_dead_end",
      title: "Whispers in the Cold",
      summary:
        "You make a private accusation against Theo, but without offering mercy or securing enough evidence, the words dissolve into the cold air. Nothing changes. Theo watches you carefully until dawn.",
      priority: 6,
      conditions: [],
      requiresNpcId: "npc_theo_rusk",
      requiresMode: "private"
    },
    // Priority 7: Dawn timeout — only triggered by applyDawnEnding
    ending_dawn_breaks_unanswered: {
      id: "ending_dawn_breaks_unanswered",
      title: "Dawn Breaks, Unanswered",
      summary:
        "Dawn breaks through the frost. The road crew clears the pass, and the suspects scatter before you can name the truth. The case goes unresolved.",
      priority: 7,
      conditions: [
        { kind: "has_consequence", consequenceId: "conseq_spent_dawn_turn" }
      ]
    },
    // Priority 8: Final fallback — insufficient evidence public accusation
    ending_snow_covers_tracks: {
      id: "ending_snow_covers_tracks",
      title: "Snow Covers the Tracks",
      summary:
        "Your accusation fails to convince. The case collapses into silence and snow.",
      priority: 8,
      conditions: []
    }
  },
  consequences: {
    conseq_broke_mina_trust: {
      id: "conseq_broke_mina_trust",
      label: "Broke Mina's Trust",
      description: "You searched Mina's private space without permission."
    },
    conseq_tipped_off_theo: {
      id: "conseq_tipped_off_theo",
      label: "Tipped Off Theo",
      description: "You confronted Theo with evidence before securing all clues."
    },
    conseq_captain_rushed_case: {
      id: "conseq_captain_rushed_case",
      label: "Captain Rushed the Case",
      description: "Captain Vale pressured you for a premature conclusion."
    },
    conseq_used_private_key: {
      id: "conseq_used_private_key",
      label: "Used Private Key",
      description: "You used the stolen service key to access the tower."
    },
    conseq_spent_dawn_turn: {
      id: "conseq_spent_dawn_turn",
      label: "Spent Dawn Turn",
      description: "Time ran out before you could reach a conclusion."
    },
    conseq_made_public_accusation: {
      id: "conseq_made_public_accusation",
      label: "Made Public Accusation",
      description: "You made a formal public accusation."
    },
    conseq_offered_theo_mercy: {
      id: "conseq_offered_theo_mercy",
      label: "Offered Theo Mercy",
      description: "You chose a private resolution instead of public justice."
    },
    conseq_made_private_accusation: {
      id: "conseq_made_private_accusation",
      label: "Made Private Accusation",
      description: "You made an informal private accusation."
    }
  },
  quests: {
    quest_name_alden_truth: {
      id: "quest_name_alden_truth",
      title: "Name What Happened to Alden Voss",
      objectiveIds: [
        "obj_inspect_body",
        "obj_find_motive",
        "obj_test_locked_room",
        "obj_identify_culprit",
        "obj_choose_resolution"
      ]
    }
  },
  objectives: {
    obj_inspect_body: {
      id: "obj_inspect_body",
      questId: "quest_name_alden_truth",
      label: "Inspect the body",
      checkCondition: { kind: "has_clue", clueId: "clue_watch_stopped_1147" }
    },
    obj_find_motive: {
      id: "obj_find_motive",
      questId: "quest_name_alden_truth",
      label: "Find a motive",
      checkCondition: { kind: "has_clue", clueId: "clue_stolen_design_motive" }
    },
    obj_test_locked_room: {
      id: "obj_test_locked_room",
      questId: "quest_name_alden_truth",
      label: "Test the locked room",
      checkCondition: { kind: "has_clue", clueId: "clue_tower_staged" }
    },
    obj_identify_culprit: {
      id: "obj_identify_culprit",
      questId: "quest_name_alden_truth",
      label: "Identify the culprit",
      checkCondition: { kind: "flag_equals", flagKey: "accused", flagValue: true }
    },
    obj_choose_resolution: {
      id: "obj_choose_resolution",
      questId: "quest_name_alden_truth",
      label: "Choose your resolution",
      checkCondition: { kind: "flag_equals", flagKey: "gameComplete", flagValue: true }
    }
  }
};
