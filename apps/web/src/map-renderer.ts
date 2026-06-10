import type { AdventureDefinition, WorldState } from "@shared";

const NODE_WIDTH = 100;
const NODE_HEIGHT = 42;
const H_STEP = NODE_WIDTH + 30; // horizontal distance between rooms
const V_STEP = NODE_HEIGHT + 18; // vertical distance between rooms
const SVG_NS = "http://www.w3.org/2000/svg";

// Map direction strings to grid offsets (col, row)
function directionToOffset(dir: string): { dx: number; dy: number } {
  const d = dir.toLowerCase().replace(/[\s_-]/g, "");
  switch (d) {
    case "north": case "n": case "up": return { dx: 0, dy: -1 };
    case "south": case "s": case "down": return { dx: 0, dy: 1 };
    case "east": case "e": case "right": return { dx: 1, dy: 0 };
    case "west": case "w": case "left": return { dx: -1, dy: 0 };
    case "northeast": case "ne": return { dx: 1, dy: -1 };
    case "northwest": case "nw": return { dx: -1, dy: -1 };
    case "southeast": case "se": return { dx: 1, dy: 1 };
    case "southwest": case "sw": return { dx: -1, dy: 1 };
    default: return { dx: 0, dy: 1 }; // fallback: down
  }
}

/**
 * Generate a dynamic SVG map using direction-aware BFS placement.
 * Each exit has a `direction` field that determines where the child room is placed
 * relative to its parent. This ensures the map respects compass directions.
 */
export function generateMapSvg(
  adventure: AdventureDefinition,
  state: WorldState,
  roomNameFn: (roomId: string) => string,
  onRoomClick?: (roomId: string) => void,
  npcImageMap?: Record<string, string>,
): SVGSVGElement {
  const rooms = adventure.rooms;
  const exits = adventure.exits;
  const startId = adventure.meta.initialRoomId;

  // 1. BFS to build parent map (first discovery = parent), recording direction
  const parentMap = new Map<string, { parentId: string; direction: string }>();
  const visited = new Set<string>([startId]);
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const room = rooms[current];
    if (!room) continue;

    for (const exitId of room.exitIds) {
      const exit = exits[exitId];
      if (!exit) continue;
      const neighbor = exit.toRoomId;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, { parentId: current, direction: exit.direction });
        queue.push(neighbor);
      }
    }
  }

  // Add any rooms not reached by BFS (safety)
  for (const id of Object.keys(rooms)) {
    if (!visited.has(id)) {
      visited.add(id);
    }
  }

  // 2. Compute grid positions using parent + direction
  const gridPositions = new Map<string, { col: number; row: number }>();
  gridPositions.set(startId, { col: 0, row: 0 });

  // BFS order to assign positions
  const posQueue: string[] = [startId];
  const posVisited = new Set<string>([startId]);

  while (posQueue.length > 0) {
    const current = posQueue.shift()!;
    const currentPos = gridPositions.get(current)!;

    for (const exitId of (rooms[current]?.exitIds ?? [])) {
      const exit = exits[exitId];
      if (!exit) continue;
      const neighbor = exit.toRoomId;
      if (posVisited.has(neighbor)) continue;

      posVisited.add(neighbor);
      const { dx, dy } = directionToOffset(exit.direction);
      gridPositions.set(neighbor, {
        col: currentPos.col + dx,
        row: currentPos.row + dy,
      });
      posQueue.push(neighbor);
    }
  }

  // Handle rooms not reached (fallback)
  for (const id of Object.keys(rooms)) {
    if (!gridPositions.has(id)) {
      gridPositions.set(id, { col: 0, row: Object.keys(rooms).length });
    }
  }

  // 3. Normalize grid positions (shift so min col/row = 0) then convert to pixel coords
  let minCol = Infinity, minRow = Infinity;
  let maxCol = -Infinity, maxRow = -Infinity;
  for (const pos of gridPositions.values()) {
    if (pos.col < minCol) minCol = pos.col;
    if (pos.row < minRow) minRow = pos.row;
    if (pos.col > maxCol) maxCol = pos.col;
    if (pos.row > maxRow) maxRow = pos.row;
  }

  const PADDING = 20;
  const nodes = new Map<string, { id: string; cx: number; cy: number }>();
  for (const [id, pos] of gridPositions) {
    const cx = PADDING + (pos.col - minCol) * H_STEP + NODE_WIDTH / 2;
    const cy = PADDING + (pos.row - minRow) * V_STEP + NODE_HEIGHT / 2;
    nodes.set(id, { id, cx, cy });
  }

  // 4. Compute SVG viewBox
  let svgWidth = 0, svgHeight = 0;
  for (const n of nodes.values()) {
    if (n.cx + NODE_WIDTH / 2 + PADDING > svgWidth) svgWidth = n.cx + NODE_WIDTH / 2 + PADDING;
    if (n.cy + NODE_HEIGHT / 2 + PADDING > svgHeight) svgHeight = n.cy + NODE_HEIGHT / 2 + PADDING;
  }

  // 5. Build SVG
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("id", "map-svg");
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute("xmlns", SVG_NS);
  svg.style.display = "block";
  svg.style.width = "100%";
  svg.style.height = "auto";

  const towerUnlocked = state.flags.towerUnlocked || state.flags.minaGrantedAccess;

  // 6. Draw edges first (behind rooms)
  const drawnEdges = new Set<string>();
  for (const exit of Object.values(exits)) {
    const from = nodes.get(exit.fromRoomId);
    const to = nodes.get(exit.toRoomId);
    if (!from || !to) continue;

    const edgeKey = [exit.fromRoomId, exit.toRoomId].sort().join("|");
    if (drawnEdges.has(edgeKey)) continue;
    drawnEdges.add(edgeKey);

    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(from.cx));
    line.setAttribute("y1", String(from.cy));
    line.setAttribute("x2", String(to.cx));
    line.setAttribute("y2", String(to.cy));

    if (exit.locked && !towerUnlocked) {
      line.classList.add("map-line-locked");
    } else {
      line.classList.add("map-line");
    }
    svg.appendChild(line);
  }

  // 7. Draw rooms
  for (const [id, n] of nodes) {
    const g = document.createElementNS(SVG_NS, "g");
    g.id = `map-room-${id}`;
    g.classList.add("map-room");
    g.dataset.room = id;

    if (id === state.currentRoomId) {
      g.classList.add("map-room-current");
    } else if (state.visitedRoomIds.includes(id)) {
      g.classList.add("map-room-visited");
    }

    const hasLockedExit = Object.values(exits).some(
      (e) => e.toRoomId === id && e.locked,
    );
    if (hasLockedExit && !towerUnlocked) {
      g.classList.add("map-room-locked");
    }

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(n.cx - NODE_WIDTH / 2));
    rect.setAttribute("y", String(n.cy - NODE_HEIGHT / 2));
    rect.setAttribute("width", String(NODE_WIDTH));
    rect.setAttribute("height", String(NODE_HEIGHT));
    rect.setAttribute("rx", "5");
    g.appendChild(rect);

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", String(n.cx));
    text.setAttribute("y", String(n.cy + 5));
    text.setAttribute("text-anchor", "middle");
    text.textContent = roomNameFn(id);
    g.appendChild(text);

    if (onRoomClick) {
      g.addEventListener("click", () => onRoomClick(id));
    }
    svg.appendChild(g);
  }

  // 8. Draw NPC portraits on the map
  for (const [npcId, room] of Object.entries(state.npcRoomById)) {
    const node = nodes.get(room);
    if (!node) continue;
    const imgSrc = npcImageMap?.[npcId];
    if (imgSrc) {
      const imgW = 20, imgH = 20;
      const image = document.createElementNS(SVG_NS, "image");
      image.setAttribute("x", String(node.cx - imgW / 2));
      image.setAttribute("y", String(node.cy - NODE_HEIGHT / 2 - imgH - 4));
      image.setAttribute("width", String(imgW));
      image.setAttribute("height", String(imgH));
      image.setAttribute("href", imgSrc);
      image.setAttribute("preserveAspectRatio", "xMidYMid slice");
      image.classList.add("map-npc-portrait");
      // Clip to circle
      const clipId = `npc-clip-${npcId}`;
      const clip = document.createElementNS(SVG_NS, "clipPath");
      clip.setAttribute("id", clipId);
      const circ = document.createElementNS(SVG_NS, "circle");
      circ.setAttribute("cx", String(node.cx));
      circ.setAttribute("cy", String(node.cy - NODE_HEIGHT / 2 - imgH - 4 + imgH / 2));
      circ.setAttribute("r", String(imgW / 2));
      clip.appendChild(circ);
      svg.appendChild(clip);
      image.setAttribute("clip-path", `url(#${clipId})`);
      svg.appendChild(image);
    } else {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", String(node.cx));
      c.setAttribute("cy", String(node.cy - NODE_HEIGHT / 2 - 6));
      c.setAttribute("r", "5");
      c.classList.add("map-npc-dot");
      svg.appendChild(c);
    }
  }

  return svg;
}
