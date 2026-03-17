const REQUESTED_SKINS = [
  "Battle academia ezreal",
  "Battle academia cait",
  "Petals of spring lilia",
  "Soul fighter sett",
  "Spirit blossoms irelia",
  "Spirit blossoms ahri",
  "Spirit blossoms sett",
  "Battle queen katarina",
  "Battle queen gwen",
  "Aegis frame galio",
  "Immortal journey zaheen",
  "Cafe cuties bard",
  "Dream dragon yasuo",
  "Dumpling darlings seraphine",
  "Spirit blossom varus",
  "Porcelain darius",
  "Broken covenant rakan",
  "Star guardian zoe",
  "Star guardian syndra",
  "Gun goddes miss fortune",
  "Secret agent xin zhao",
  "Warring Kingdoms Katarina",
  "Constable Trundle",
  "Debonair Vi",
  "Phoenix Quinn",
  "Aether Wing Kayle",
  "Sultan Tryndamere",
  "Music Fan Gragas",
  "Pool party syndra",
  "Valiant sword riven",
  "Pajama guardian lux",
  "Odyssey yasuo",
];

const SLOT_STORAGE_KEY = "veryanime-32-slots-v2";

const leftConference = document.querySelector("#leftConference");
const rightConference = document.querySelector("#rightConference");
const previewPane = document.querySelector("#previewPane");
const previewImage = document.querySelector("#previewImage");
const previewName = document.querySelector("#previewName");
const previewClose = document.querySelector("#previewClose");

function fallbackSplash(name) {
  const label = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f7e9d4"/>
          <stop offset="100%" stop-color="#ecd8bd"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bg)"/>
      <text x="320" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#1b1511">${label}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const DDRAGON_VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

const SKIN_REQUESTS = [
  { requested: "Battle academia ezreal", champion: "Ezreal", query: "battle academia" },
  { requested: "Battle academia cait", champion: "Caitlyn", query: "battle academia" },
  { requested: "Petals of spring lilia", champion: "Lillia", query: "petals of spring" },
  { requested: "Soul fighter sett", champion: "Sett", query: "soul fighter" },
  { requested: "Spirit blossoms irelia", champion: "Irelia", query: "spirit blossom" },
  { requested: "Spirit blossoms ahri", champion: "Ahri", query: "spirit blossom" },
  { requested: "Spirit blossoms sett", champion: "Sett", query: "spirit blossom" },
  { requested: "Battle queen katarina", champion: "Katarina", query: "battle queen" },
  { requested: "Battle queen gwen", champion: "Gwen", query: "battle queen" },
  { requested: "Aegis frame galio", champion: "Galio", query: "aegis" },
  { requested: "Immortal journey zaheen", champion: "Yasuo", query: "immortal journey" },
  { requested: "Cafe cuties bard", champion: "Bard", query: "cafe cuties" },
  { requested: "Dream dragon yasuo", champion: "Yasuo", query: "dream dragon" },
  { requested: "Dumpling darlings seraphine", champion: "Seraphine", query: "dumpling darlings" },
  { requested: "Spirit blossom varus", champion: "Varus", query: "spirit blossom" },
  { requested: "Porcelain darius", champion: "Darius", query: "porcelain" },
  { requested: "Broken covenant rakan", champion: "Rakan", query: "broken covenant" },
  { requested: "Star guardian zoe", champion: "Zoe", query: "star guardian" },
  { requested: "Star guardian syndra", champion: "Syndra", query: "star guardian" },
  { requested: "Gun goddes miss fortune", champion: "MissFortune", query: "gun goddess" },
  { requested: "Secret agent xin zhao", champion: "XinZhao", query: "secret agent" },
  { requested: "Warring Kingdoms Katarina", champion: "Katarina", query: "warring kingdoms" },
  { requested: "Constable Trundle", champion: "Trundle", query: "constable" },
  { requested: "Debonair Vi", champion: "Vi", query: "debonair" },
  { requested: "Phoenix Quinn", champion: "Quinn", query: "phoenix" },
  { requested: "Aether Wing Kayle", champion: "Kayle", query: "aether wing" },
  { requested: "Sultan Tryndamere", champion: "Tryndamere", query: "sultan" },
  { requested: "Music Fan Gragas", champion: "Gragas", query: "superfan" },
  { requested: "Pool party syndra", champion: "Syndra", query: "pool party" },
  { requested: "Valiant sword riven", champion: "Riven", query: "valiant sword" },
  { requested: "Pajama guardian lux", champion: "Lux", query: "pajama guardian" },
  { requested: "Odyssey yasuo", champion: "Yasuo", query: "odyssey" },
];

function normalizeKey(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\blilia\b/g, "lillia")
    .replace(/\bcait\b/g, "caitlyn")
    .replace(/\bzaheen\b/g, "zaahen")
    .replace(/\bgoddes\b/g, "goddess")
    .replace(/\bblossoms\b/g, "blossom")
    .replace(/\bspirit blossom\b/g, "spiritblossom")
    .replace(/\bbattle academia\b/g, "battleacademia")
    .replace(/\bbattle queen\b/g, "battlequeen")
    .replace(/\bcafe\b/g, "cafe")
    .replace(/\bimmortal journey\b/g, "immortaljourney")
    .replace(/\bdumpling darlings\b/g, "dumplingdarling")
    .replace(/\bwarring kingdoms\b/g, "warringkingdoms")
    .replace(/\baether wing\b/g, "aetherwing")
    .replace(/\bpool party\b/g, "poolparty")
    .replace(/\bpajama guardian\b/g, "pajamaguardian")
    .replace(/\bsecret agent\b/g, "secretagent")
    .replace(/\bmusic fan\b/g, "musicfan")
    .replace(/\bvaliant sword\b/g, "valiantsword")
    .trim();
}

function titleCase(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function shuffleArray(items) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function scoreSkinMatch(requestedName, candidateName) {
  const requested = normalizeKey(requestedName);
  const candidate = normalizeKey(candidateName);
  const requestedTokens = requested.split(" ").filter(Boolean);
  const candidateTokens = candidate.split(" ").filter(Boolean);

  let score = 0;
  if (requested === candidate) {
    score += 100;
  }
  if (candidate.includes(requested) || requested.includes(candidate)) {
    score += 30;
  }

  requestedTokens.forEach((token) => {
    if (candidateTokens.includes(token)) {
      score += 10;
    } else if (candidate.includes(token)) {
      score += 4;
    }
  });

  return score - Math.min(Math.abs(candidate.length - requested.length), 18);
}

async function resolveParticipants() {
  try {
    const versionsResponse = await fetch(DDRAGON_VERSIONS_URL);
    if (!versionsResponse.ok) {
      throw new Error("Versions unavailable");
    }
    const versions = await versionsResponse.json();
    const version = Array.isArray(versions) && versions.length ? versions[0] : "15.20.1";

    const championIds = Array.from(new Set(SKIN_REQUESTS.map((entry) => entry.champion)));
    const championDataMap = {};

    await Promise.all(
      championIds.map(async (championId) => {
        const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championId}.json`;
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }
        const json = await response.json();
        championDataMap[championId] = json.data?.[championId] || null;
      })
    );

    return SKIN_REQUESTS.map((entry, index) => {
      const championData = championDataMap[entry.champion];
      const skins = championData?.skins || [];

      const ranked = skins
        .filter((skin) => skin.num !== 0 && skin.name)
        .map((skin) => ({ skin, score: scoreSkinMatch(entry.query, skin.name) }))
        .sort((left, right) => right.score - left.score);

      const best = ranked[0];
      if (best && best.score >= 10) {
        const splash = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${entry.champion}_${best.skin.num}.jpg`;

        return {
          id: `p-${index}-${entry.champion}-${best.skin.num}`,
          name: titleCase(entry.requested),
          splashUrl: splash,
        };
      }

      return {
        id: `p-${index}`,
        name: titleCase(entry.requested),
        splashUrl: fallbackSplash(entry.requested),
      };
    });
  } catch {
    return SKIN_REQUESTS.map((entry, index) => ({
      id: `p-${index}`,
      name: titleCase(entry.requested),
      splashUrl: fallbackSplash(entry.requested),
    }));
  }
}

function createRoundTitle(side, round, label) {
  const title = document.createElement("p");
  title.className = `round-title ${side}-r${round}-title`;
  title.textContent = label;
  return title;
}

function createTeamCard(participant) {
  const card = document.createElement("div");
  card.className = "team-card";
  card.dataset.team = participant.name;
  card.dataset.image = participant.splashUrl;
  card.draggable = true;
  card.innerHTML = `
    <img src="${participant.splashUrl}" alt="${participant.name}" />
    <span>${participant.name}</span>
  `;

  const image = card.querySelector("img");
  if (image) {
    image.addEventListener("error", () => {
      const fallback = fallbackSplash(participant.name);
      image.src = fallback;
      card.dataset.image = fallback;
    });
  }

  return card;
}

function createMatchBlock(side, matchNumber, participantA, participantB) {
  const globalMatchNumber = side === "left" ? matchNumber : matchNumber + 8;
  const block = document.createElement("article");
  block.className = "team-match";
  block.style.gridColumn = side === "left" ? "1" : "4";
  block.style.gridRow = `${3 + (matchNumber - 1) * 2} / span 2`;
  const tag = document.createElement("div");
  tag.className = "match-tag";
  tag.textContent = `Match ${globalMatchNumber}`;

  const versus = document.createElement("div");
  versus.className = "versus-pill";
  versus.textContent = "VS";

  block.append(tag, createTeamCard(participantA), versus, createTeamCard(participantB));
  return block;
}

function createSlot(slotId, label, gridColumn, gridRowStart, rowSpan, maxEntries = 1) {
  const slot = document.createElement("article");
  slot.className = "slot";
  slot.dataset.slot = slotId;
  slot.dataset.defaultLabel = label;
  slot.dataset.maxEntries = String(maxEntries);
  slot.style.gridColumn = String(gridColumn);
  slot.style.gridRow = `${gridRowStart} / span ${rowSpan}`;
  slot.textContent = label;
  return slot;
}

function buildConference(container, side, participants) {
  container.innerHTML = "";

  const title = document.createElement("h2");
  title.className = "conference-title";
  title.textContent = side === "left" ? "Left Bracket" : "Right Bracket";
  container.append(title);

  if (side === "left") {
    container.append(
      createRoundTitle("left", 1, "Round 1"),
      createRoundTitle("left", 2, "Quarterfinals"),
      createRoundTitle("left", 3, "Semis"),
      createRoundTitle("left", 4, "Final")
    );
  } else {
    container.append(
      createRoundTitle("right", 4, "Final"),
      createRoundTitle("right", 3, "Semis"),
      createRoundTitle("right", 2, "Quarterfinals"),
      createRoundTitle("right", 1, "Round 1")
    );
  }

  for (let index = 0; index < 8; index += 1) {
    const a = participants[index * 2];
    const b = participants[index * 2 + 1];
    container.append(createMatchBlock(side, index + 1, a, b));
  }

  const r2Column = side === "left" ? 2 : 3;
  const r3Column = side === "left" ? 3 : 2;
  const r4Column = side === "left" ? 4 : 1;
  const r2Prefix = side === "left" ? "left-qf" : "right-qf";
  const r3Prefix = side === "left" ? "left-sf" : "right-sf";
  const r4SlotId = side === "left" ? "left-final" : "right-final";
  const r4Label = side === "left" ? "Left Winner" : "Right Winner";

  const qfStartRows = [4, 8, 12, 16];
  const qfLabels =
    side === "left"
      ? ["Winners M1 + M2", "Winners M3 + M4", "Winners M5 + M6", "Winners M7 + M8"]
      : ["Winners M9 + M10", "Winners M11 + M12", "Winners M13 + M14", "Winners M15 + M16"];

  qfStartRows.forEach((startRow, idx) => {
    container.append(createSlot(`${r2Prefix}-${idx + 1}`, qfLabels[idx], r2Column, startRow, 2, 2));
  });

  container.append(createSlot(`${r3Prefix}-1`, side === "left" ? "Winner Quarter 1" : "Winner Quarter 3", r3Column, 6, 4));
  container.append(createSlot(`${r3Prefix}-2`, side === "left" ? "Winner Quarter 2" : "Winner Quarter 4", r3Column, 14, 4));

  container.append(createSlot(r4SlotId, r4Label, r4Column, 10, 4));
}

function payloadFromCard(card) {
  return {
    name: card.dataset.team,
    imageSrc: card.dataset.image,
  };
}

function makeSlotMarkup(payload) {
  return `
    <div class="slot-team" draggable="true" data-team="${payload.name}" data-image="${payload.imageSrc}">
      <img src="${payload.imageSrc}" alt="${payload.name}" />
      <span>${payload.name}</span>
      <button type="button" class="clear-slot">Clear</button>
    </div>
  `;
}

function makeMultiSlotMarkup(entries, maxEntries, label) {
  const filled = entries
    .map(
      (entry, idx) => `
        <div class="slot-team" draggable="true" data-team="${entry.name}" data-image="${entry.imageSrc}" data-index="${idx}">
          <img src="${entry.imageSrc}" alt="${entry.name}" />
          <span>${entry.name}</span>
          <button type="button" class="clear-slot" data-index="${idx}">Clear</button>
        </div>
      `
    )
    .join("");

  const placeholders = Array.from({ length: Math.max(0, maxEntries - entries.length) })
    .map(() => `<div class="slot-placeholder">Drop Winner</div>`)
    .join("");

  return `<div class="slot-stack"><div class="slot-stack-label">${label}</div>${filled}${placeholders}</div>`;
}

function readSlots() {
  try {
    const raw = sessionStorage.getItem(SLOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSlots(data) {
  sessionStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(data));
}

function showPreview(payload) {
  if (!payload || !payload.imageSrc) {
    previewPane.classList.remove("visible");
    return;
  }

  previewImage.src = payload.imageSrc;
  previewImage.alt = payload.name || "";
  previewName.textContent = payload.name || "";
  previewPane.classList.add("visible");
}

function hidePreview() {
  previewPane.classList.remove("visible");
}

function attachPreviewHandlersToCard(card) {
  const payload = payloadFromCard(card);
  card.addEventListener("click", () => showPreview(payload));
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "copy";
  });
}

function attachPreviewHandlersToFilledSlot(slotTeam) {
  const payload = {
    name: slotTeam.dataset.team,
    imageSrc: slotTeam.dataset.image,
  };

  slotTeam.addEventListener("click", () => showPreview(payload));
  slotTeam.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "copy";
  });
}

function normalizeSlotEntries(raw) {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((item) => item && item.name && item.imageSrc);
  }
  if (raw.name && raw.imageSrc) {
    return [raw];
  }
  return [];
}

function renderSlot(slot, entries) {
  const maxEntries = Number(slot.dataset.maxEntries || "1");
  const label = slot.dataset.defaultLabel || "";

  if (!entries.length) {
    slot.classList.remove("slot-has-team");
    if (maxEntries > 1) {
      slot.innerHTML = makeMultiSlotMarkup([], maxEntries, label);
    } else {
      slot.innerHTML = label;
    }
    return;
  }

  slot.classList.add("slot-has-team");
  if (maxEntries > 1) {
    slot.innerHTML = makeMultiSlotMarkup(entries.slice(0, maxEntries), maxEntries, label);
  } else {
    slot.innerHTML = makeSlotMarkup(entries[0]);
  }

  const teams = Array.from(slot.querySelectorAll(".slot-team"));
  teams.forEach((slotTeam) => {
    const image = slotTeam.querySelector("img");
    if (image) {
      image.addEventListener("error", () => {
        const fallback = fallbackSplash(slotTeam.dataset.team || "Skin");
        image.src = fallback;
        slotTeam.dataset.image = fallback;
      });
    }
    attachPreviewHandlersToFilledSlot(slotTeam);
  });

  const clearButtons = Array.from(slot.querySelectorAll(".clear-slot"));
  clearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index || "0");
      const state = readSlots();
      const current = normalizeSlotEntries(state[slot.dataset.slot]);

      if (maxEntries > 1) {
        current.splice(index, 1);
        if (current.length) {
          state[slot.dataset.slot] = current;
        } else {
          delete state[slot.dataset.slot];
        }
        writeSlots(state);
        renderSlot(slot, current);
      } else {
        delete state[slot.dataset.slot];
        writeSlots(state);
        renderSlot(slot, []);
      }
    });
  });
}

function bindDragDrop() {
  const sourceCards = Array.from(document.querySelectorAll(".team-card"));
  const slots = Array.from(document.querySelectorAll(".slot[data-slot]"));

  sourceCards.forEach(attachPreviewHandlersToCard);

  slots.forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("drag-over");
      event.dataTransfer.dropEffect = "copy";
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drag-over");
    });

    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("drag-over");

      let payload = null;
      try {
        payload = JSON.parse(event.dataTransfer.getData("application/json"));
      } catch {
        payload = null;
      }

      if (!payload || !payload.name || !payload.imageSrc) {
        return;
      }

      const state = readSlots();
      const maxEntries = Number(slot.dataset.maxEntries || "1");
      const current = normalizeSlotEntries(state[slot.dataset.slot]);

      if (maxEntries > 1) {
        const exists = current.some((entry) => entry.name === payload.name);
        if (!exists) {
          if (current.length < maxEntries) {
            current.push(payload);
          } else {
            current[maxEntries - 1] = payload;
          }
        }
        state[slot.dataset.slot] = current;
        renderSlot(slot, current);
      } else {
        state[slot.dataset.slot] = payload;
        renderSlot(slot, [payload]);
      }

      writeSlots(state);
      showPreview(payload);
    });
  });
}

function bindPreviewControls() {
  if (previewClose) {
    previewClose.addEventListener("click", hidePreview);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hidePreview();
    }
  });
}

function restoreSlotsFromSession() {
  const state = readSlots();
  const slots = Array.from(document.querySelectorAll(".slot[data-slot]"));
  slots.forEach((slot) => {
    renderSlot(slot, normalizeSlotEntries(state[slot.dataset.slot]));
  });
}

async function init() {
  const participants = shuffleArray(await resolveParticipants());
  const left = participants.slice(0, 16);
  const right = participants.slice(16, 32);

  buildConference(leftConference, "left", left);
  buildConference(rightConference, "right", right);
  bindDragDrop();
  bindPreviewControls();
  restoreSlotsFromSession();
}

init();
