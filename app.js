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
  "Immortal journey zhaeen",
  "Cafe cuties bard",
  "Dream dragon yasuo",
  "Dumpling darlings seraphine",
  "Spirit blossom varus",
  "Porcelain darius",
  "Broken covenant rakan",
  "Star guardian zoe",
  "Star guardian syndra",
  "Gun goddess miss fortune",
];

const STORAGE_KEY = "veryanime-bracket-v2";
const SKINS_API_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json";
const ROUND_NAMES = ["Opening Arc", "Redemption Arc", "Quarterfinals", "Semifinals", "Grand Finale"];

const elements = {
  statGrid: document.querySelector("#statGrid"),
  bracket: document.querySelector("#bracket"),
  resolutionList: document.querySelector("#resolutionList"),
  resolutionSummary: document.querySelector("#resolutionSummary"),
  matchSummary: document.querySelector("#matchSummary"),
  noticeBar: document.querySelector("#noticeBar"),
  statePayload: document.querySelector("#statePayload"),
  shuffleButton: document.querySelector("#shuffleButton"),
  resetButton: document.querySelector("#resetButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  copyButton: document.querySelector("#copyButton"),
  viewerModeButton: document.querySelector("#viewerModeButton"),
  adminModeButton: document.querySelector("#adminModeButton"),
  sendVotesButton: document.querySelector("#sendVotesButton"),
  voterName: document.querySelector("#voterName"),
  competitorCardTemplate: document.querySelector("#competitorCardTemplate"),
};

const state = {
  mode: "viewer",
  seedOrder: [],
  officialWinners: {},
  viewerVotes: {},
  participants: [],
  unresolvedEntries: [],
};

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bblossoms\b/g, "blossom")
    .replace(/\blilia\b/g, "lillia")
    .replace(/\bzhaeen\b/g, "zilean")
    .replace(/\bcait\b/g, "caitlyn")
    .replace(/\bstar guardian\b/g, "starguardian")
    .replace(/\bspirit blossom\b/g, "spiritblossom")
    .replace(/\bbattle academia\b/g, "battleacademia")
    .replace(/\bbattle queen\b/g, "battlequeen")
    .replace(/\bimmortal journey\b/g, "immortaljourney")
    .replace(/\bdumpling darlings\b/g, "dumplingdarling")
    .replace(/\baegis frame\b/g, "aegisframe")
    .replace(/\bbroken covenant\b/g, "brokencovenant")
    .replace(/\bdream dragon\b/g, "dreamdragon")
    .replace(/\bgun goddess\b/g, "gungoddess")
    .trim();
}

function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function cdragonAssetUrl(path) {
  if (!path) {
    return "";
  }

  const cleanedPath = path
    .replace(/^\/lol-game-data\/assets\//i, "")
    .replace(/^\/+/, "")
    .toLowerCase();

  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${cleanedPath}`;
}

function buildYouTubeSearchUrl(name) {
  const query = encodeURIComponent(`${name} skin spotlight`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

function shuffleArray(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }

  return clone;
}

function nextPowerOfTwo(value) {
  let result = 1;
  while (result < value) {
    result *= 2;
  }
  return result;
}

function scoreCandidate(requestedLabel, candidateName) {
  const requested = normalizeText(requestedLabel);
  const candidate = normalizeText(candidateName);
  const requestedTokens = tokenize(requestedLabel);
  const candidateTokens = tokenize(candidateName);

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

function extractChampionName(name) {
  const tokens = name.split(" ");
  return tokens[tokens.length - 1];
}

function findRequestedSkins(apiSkins) {
  const eligibleSkins = apiSkins.filter((skin) => skin.name && !skin.isBase);
  const usedIds = new Set();
  const resolved = [];
  const unresolved = [];

  REQUESTED_SKINS.forEach((requestedLabel) => {
    const ranked = eligibleSkins
      .map((skin) => ({ skin, score: scoreCandidate(requestedLabel, skin.name) }))
      .sort((left, right) => right.score - left.score);

    const best = ranked.find((entry) => !usedIds.has(entry.skin.id));

    if (!best || best.score < 18) {
      unresolved.push({ requestLabel: requestedLabel, reason: "No confident match from Riot data." });
      return;
    }

    usedIds.add(best.skin.id);
    resolved.push({
      ...best.skin,
      requestLabel: requestedLabel,
      championName: extractChampionName(best.skin.name),
      matchScore: best.score,
    });
  });

  return { resolved, unresolved };
}

function hydrateParticipant(entry, index) {
  const splash =
    cdragonAssetUrl(entry.uncenteredSplashPath) ||
    cdragonAssetUrl(entry.splashPath) ||
    cdragonAssetUrl(entry.tilePath) ||
    cdragonAssetUrl(entry.loadScreenPath);
  const preview =
    cdragonAssetUrl(entry.tilePath) ||
    cdragonAssetUrl(entry.loadScreenPath) ||
    splash;
  const video =
    cdragonAssetUrl(entry.collectionSplashVideoPath) ||
    cdragonAssetUrl(entry.splashVideoPath);

  return {
    id: `skin-${entry.id ?? index}`,
    requestLabel: entry.requestLabel,
    displayName: entry.name,
    championName: entry.championName,
    splashUrl: splash,
    previewUrl: preview,
    videoUrl: video,
    showcaseUrl: buildYouTubeSearchUrl(entry.name),
    assetUrl: splash || buildYouTubeSearchUrl(entry.name),
  };
}

function participantMap() {
  return new Map(state.participants.map((participant) => [participant.id, participant]));
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      mode: state.mode,
      seedOrder: state.seedOrder,
      officialWinners: state.officialWinners,
      viewerVotes: state.viewerVotes,
      voterName: elements.voterName.value.trim(),
    })
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    state.mode = parsed.mode === "admin" ? "admin" : "viewer";
    state.seedOrder = Array.isArray(parsed.seedOrder) ? parsed.seedOrder : [];
    state.officialWinners = parsed.officialWinners || {};
    state.viewerVotes = parsed.viewerVotes || {};
    elements.voterName.value = parsed.voterName || "";
  } catch {
    setNotice("Saved local data was messy, so the bracket restarted fresh.", "warning");
  }
}

function initializeSeedOrder() {
  const ids = shuffleArray(state.participants.map((participant) => participant.id));
  while (ids.length < nextPowerOfTwo(state.participants.length)) {
    ids.push(null);
  }

  state.seedOrder = ids;
  state.officialWinners = {};
  state.viewerVotes = {};
  saveState();
}

function getStoredWinner(matchKey, leftId, rightId) {
  const winnerId = state.officialWinners[matchKey];
  if (winnerId === leftId || winnerId === rightId) {
    return winnerId;
  }

  if (leftId && !rightId) {
    return leftId;
  }

  if (rightId && !leftId) {
    return rightId;
  }

  return null;
}

function computeRounds() {
  const rounds = [];
  let currentSlots = [...state.seedOrder];
  const roundCount = Math.log2(state.seedOrder.length);

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const matchups = [];
    const nextSlots = [];

    for (let slotIndex = 0; slotIndex < currentSlots.length; slotIndex += 2) {
      const leftId = currentSlots[slotIndex];
      const rightId = currentSlots[slotIndex + 1];
      const matchIndex = slotIndex / 2;
      const matchKey = `r${roundIndex}-m${matchIndex}`;
      const winnerId = getStoredWinner(matchKey, leftId, rightId);

      matchups.push({
        matchKey,
        roundIndex,
        matchIndex,
        leftId,
        rightId,
        winnerId,
        isPlayable: Boolean(leftId && rightId),
      });

      nextSlots.push(winnerId || null);
    }

    rounds.push({
      title: ROUND_NAMES[roundIndex] || `Round ${roundIndex + 1}`,
      matchups,
    });

    currentSlots = nextSlots;
  }

  return rounds;
}

function getActiveRoundIndex(rounds) {
  const activeIndex = rounds.findIndex((round) =>
    round.matchups.some((matchup) => matchup.isPlayable && !matchup.winnerId)
  );

  return activeIndex === -1 ? rounds.length - 1 : activeIndex;
}

function setNotice(message, tone = "info") {
  elements.noticeBar.textContent = message;
  elements.noticeBar.className = `notice-bar${tone === "info" ? "" : ` ${tone}`}`;
}

function createStatCard(label, value) {
  const card = document.createElement("div");
  card.className = "stat-card";
  card.innerHTML = `<span class="stat-label">${label}</span><span class="stat-value">${value}</span>`;
  return card;
}

function renderStats(rounds, activeRoundIndex) {
  elements.statGrid.innerHTML = "";
  const participantsById = participantMap();
  const championId = rounds.at(-1)?.matchups?.[0]?.winnerId;
  const currentArc = rounds[activeRoundIndex]?.title || "Opening Arc";
  const voteableMatchups = rounds[activeRoundIndex]?.matchups.filter((matchup) => matchup.isPlayable).length || 0;
  const champion = championId ? participantsById.get(championId)?.displayName : "Awaiting destiny";

  [
    createStatCard("Entrants", state.participants.length),
    createStatCard("Current Arc", currentArc),
    createStatCard("Vote Battles", voteableMatchups),
    createStatCard("Final Boss", champion),
  ].forEach((card) => elements.statGrid.append(card));
}

function buildMediaFrame(frameElement, imageUrl, videoUrl, title) {
  frameElement.innerHTML = "";

  if (videoUrl) {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.poster = imageUrl;
    video.title = `${title} preview`;
    frameElement.append(video);
    return;
  }

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = title;
    image.loading = "lazy";
    frameElement.append(image);
  }
}

function createPlaceholderCard(label) {
  const card = document.createElement("article");
  card.className = "competitor-card is-placeholder";
  card.innerHTML = `<div class="placeholder-copy">${label}</div>`;
  return card;
}

function createCompetitorCard(participant, isWinner, requestedVote) {
  if (!participant) {
    return createPlaceholderCard("Awaiting anime survivor");
  }

  const fragment = elements.competitorCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".competitor-card");
  const requestedLabel = fragment.querySelector(".requested-label");
  const skinName = fragment.querySelector(".skin-name");
  const skinMeta = fragment.querySelector(".skin-meta");
  const showcaseLink = fragment.querySelector(".showcase-link");
  const assetLink = fragment.querySelector(".asset-link");
  const mainFrame = fragment.querySelector(".media-frame-main");
  const previewFrame = fragment.querySelector(".media-frame-preview");

  if (isWinner || requestedVote) {
    card.classList.add("is-winner");
  }

  requestedLabel.textContent = `List entry: ${participant.requestLabel}`;
  skinName.textContent = participant.displayName;
  skinMeta.textContent = `${participant.championName} • ${participant.videoUrl ? "Animated preview unlocked" : "Spotlight link ready"}`;
  showcaseLink.href = participant.showcaseUrl;
  assetLink.href = participant.assetUrl;

  buildMediaFrame(mainFrame, participant.splashUrl, null, participant.displayName);
  buildMediaFrame(previewFrame, participant.previewUrl || participant.splashUrl, participant.videoUrl, participant.displayName);

  return fragment;
}

function clearDependentWinners(matchKey) {
  const [roundPart, matchPart] = matchKey.split("-");
  let roundIndex = Number(roundPart.slice(1)) + 1;
  let matchIndex = Math.floor(Number(matchPart.slice(1)) / 2);

  while (state.officialWinners[`r${roundIndex}-m${matchIndex}`]) {
    delete state.officialWinners[`r${roundIndex}-m${matchIndex}`];
    roundIndex += 1;
    matchIndex = Math.floor(matchIndex / 2);
  }
}

function createAdminButton(label, matchKey, participantId, isActive) {
  const button = document.createElement("button");
  button.className = `winner-button${isActive ? " active" : ""}`;
  button.type = "button";
  button.textContent = label;
  button.disabled = !participantId;
  button.addEventListener("click", () => {
    if (!participantId) {
      return;
    }

    state.officialWinners[matchKey] = participantId;
    clearDependentWinners(matchKey);
    saveState();
    rerender();
    setNotice("Official winner locked in. The next dramatic arc is updating.");
  });
  return button;
}

function createVoteButton(label, matchKey, participantId, isActive, isEnabled) {
  const button = document.createElement("button");
  button.className = `vote-button${isActive ? " active ready-to-send" : ""}`;
  button.type = "button";
  button.textContent = label;
  button.disabled = !participantId || !isEnabled;
  button.addEventListener("click", () => {
    if (!participantId || !isEnabled) {
      return;
    }

    state.viewerVotes[matchKey] = participantId;
    saveState();
    rerender();
  });
  return button;
}

function renderBracket(rounds, activeRoundIndex) {
  elements.bracket.innerHTML = "";
  const participantsById = participantMap();

  rounds.forEach((round, roundIndex) => {
    const column = document.createElement("section");
    column.className = "round-column";

    const header = document.createElement("header");
    header.className = "round-header";
    header.innerHTML = `
      <div class="round-title">${round.title}</div>
      <div class="round-subtitle">
        ${roundIndex === activeRoundIndex ? "Open for voting / admin picks" : roundIndex < activeRoundIndex ? "Already canon" : "Locked until previous arc ends"}
      </div>
    `;
    column.append(header);

    round.matchups.forEach((matchup) => {
      const leftParticipant = participantsById.get(matchup.leftId);
      const rightParticipant = participantsById.get(matchup.rightId);
      const viewerVote = state.viewerVotes[matchup.matchKey];
      const isCurrentRound = roundIndex === activeRoundIndex;

      const card = document.createElement("article");
      card.className = `matchup-card${isCurrentRound ? " active-round" : ""}${matchup.winnerId ? " locked" : ""}`;

      const head = document.createElement("div");
      head.className = "matchup-head";
      head.innerHTML = `
        <div>
          <div class="matchup-title">Battle ${matchup.matchIndex + 1}</div>
          <div class="matchup-note">${matchup.matchKey}</div>
        </div>
        <div class="matchup-note">
          ${matchup.winnerId ? "Official winner chosen" : matchup.isPlayable ? "Crowd deciding" : "Waiting for bracket magic"}
        </div>
      `;

      const body = document.createElement("div");
      body.className = "matchup-body";
      body.append(createCompetitorCard(leftParticipant, matchup.winnerId === matchup.leftId, viewerVote === matchup.leftId));
      body.append(createCompetitorCard(rightParticipant, matchup.winnerId === matchup.rightId, viewerVote === matchup.rightId));

      const controls = document.createElement("div");
      controls.className = "control-row";

      if (state.mode === "admin") {
        controls.append(
          createAdminButton("Make left canon", matchup.matchKey, matchup.leftId, matchup.winnerId === matchup.leftId),
          createAdminButton("Make right canon", matchup.matchKey, matchup.rightId, matchup.winnerId === matchup.rightId)
        );
      } else {
        const isEnabled = isCurrentRound && matchup.isPlayable && !matchup.winnerId;
        controls.append(
          createVoteButton("Vote left", matchup.matchKey, matchup.leftId, viewerVote === matchup.leftId, isEnabled),
          createVoteButton("Vote right", matchup.matchKey, matchup.rightId, viewerVote === matchup.rightId, isEnabled)
        );
      }

      card.append(head, body, controls);
      column.append(card);
    });

    elements.bracket.append(column);
  });
}

function renderResolutionList() {
  elements.resolutionList.innerHTML = "";

  state.participants.forEach((participant) => {
    const item = document.createElement("article");
    item.className = "resolution-item";
    const adjusted = normalizeText(participant.requestLabel) !== normalizeText(participant.displayName);
    item.innerHTML = `
      <strong>${participant.requestLabel}</strong>
      <div>${participant.displayName}</div>
      <div>${adjusted ? "Auto-corrected from your typed list." : "Direct hit from your list."}</div>
    `;
    elements.resolutionList.append(item);
  });

  state.unresolvedEntries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "resolution-item missing";
    item.innerHTML = `
      <strong>${entry.requestLabel}</strong>
      <div>${entry.reason}</div>
    `;
    elements.resolutionList.append(item);
  });

  elements.resolutionSummary.textContent = `${state.participants.length} skins resolved from Riot data.`;
}

function buildVotePayload(rounds, activeRoundIndex) {
  const participantsById = participantMap();
  const activeRound = rounds[activeRoundIndex];
  const voteableMatchups = activeRound.matchups.filter((matchup) => matchup.isPlayable && !matchup.winnerId);

  if (!voteableMatchups.length) {
    return { error: "There is no open round to vote on right now." };
  }

  const missingVote = voteableMatchups.find((matchup) => !state.viewerVotes[matchup.matchKey]);

  if (missingVote) {
    return { error: "Pick a winner in every open battle before sending votes." };
  }

  return {
    voter: elements.voterName.value.trim() || "anonymous-anime-enjoyer",
    round: activeRound.title,
    submittedAt: new Date().toISOString(),
    picks: voteableMatchups.map((matchup) => ({
      matchKey: matchup.matchKey,
      winnerId: state.viewerVotes[matchup.matchKey],
      winnerName: participantsById.get(state.viewerVotes[matchup.matchKey])?.displayName || "Unknown",
    })),
  };
}

async function sendVotes(rounds, activeRoundIndex) {
  const payload = buildVotePayload(rounds, activeRoundIndex);

  if (payload.error) {
    setNotice(payload.error, "warning");
    return;
  }

  const serialized = JSON.stringify(payload, null, 2);
  elements.statePayload.value = serialized;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Very Anime Votes",
        text: serialized,
      });
      setNotice("Vote payload shared. The anime tribunal has been informed.");
      return;
    } catch {
      // Fall through to clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(serialized);
    setNotice("Vote payload copied. Send it to the admin in Discord, chat, or carrier pigeon.");
  } catch {
    setNotice("Vote payload generated below. Copy it manually and send it to the admin.", "warning");
  }
}

function exportState() {
  elements.statePayload.value = JSON.stringify(
    {
      mode: state.mode,
      seedOrder: state.seedOrder,
      officialWinners: state.officialWinners,
      viewerVotes: state.viewerVotes,
      voterName: elements.voterName.value.trim(),
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
  setNotice("Bracket state exported into the payload box.");
}

function importState() {
  const raw = elements.statePayload.value.trim();
  if (!raw) {
    setNotice("Paste a payload into the box first.", "warning");
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const validIds = new Set(state.participants.map((participant) => participant.id));

    if (Array.isArray(parsed.seedOrder)) {
      state.seedOrder = parsed.seedOrder.map((id) => (validIds.has(id) ? id : null));
    }

    state.mode = parsed.mode === "admin" ? "admin" : "viewer";
    state.officialWinners = Object.fromEntries(
      Object.entries(parsed.officialWinners || {}).filter(([, id]) => validIds.has(id))
    );
    state.viewerVotes = Object.fromEntries(
      Object.entries(parsed.viewerVotes || {}).filter(([, id]) => validIds.has(id))
    );

    if (typeof parsed.voterName === "string") {
      elements.voterName.value = parsed.voterName.slice(0, 32);
    }

    saveState();
    rerender();
    setNotice("Payload imported.");
  } catch {
    setNotice("That payload could not be parsed.", "error");
  }
}

async function copyPayload() {
  const payload = elements.statePayload.value.trim();
  if (!payload) {
    setNotice("There is nothing in the payload box yet.", "warning");
    return;
  }

  try {
    await navigator.clipboard.writeText(payload);
    setNotice("Payload copied to clipboard.");
  } catch {
    setNotice("Clipboard copy failed here, but the payload is still in the box.", "warning");
  }
}

function rerender() {
  const rounds = computeRounds();
  const activeRoundIndex = getActiveRoundIndex(rounds);
  const activeRound = rounds[activeRoundIndex];
  const openBattles = activeRound.matchups.filter((matchup) => matchup.isPlayable && !matchup.winnerId);
  const currentVotes = openBattles.filter((matchup) => state.viewerVotes[matchup.matchKey]).length;

  renderStats(rounds, activeRoundIndex);
  renderBracket(rounds, activeRoundIndex);
  renderResolutionList();

  elements.matchSummary.textContent =
    state.mode === "admin"
      ? `Admin throne active. Set official winners to unlock the next round.`
      : openBattles.length
        ? `${activeRound.title} is open. ${currentVotes}/${openBattles.length} viewer votes selected on this device.`
        : "Every round currently has official winners locked in.";
}

async function loadSkinData() {
  loadState();
  setNotice("Summoning Riot skin data and matching your list...");

  try {
    const response = await fetch(SKINS_API_URL);
    if (!response.ok) {
      throw new Error(`Failed with status ${response.status}`);
    }

    const apiSkins = await response.json();
    const { resolved, unresolved } = findRequestedSkins(apiSkins);
    state.participants = resolved.map(hydrateParticipant);
    state.unresolvedEntries = unresolved;

    if (!state.seedOrder.length || state.seedOrder.length !== nextPowerOfTwo(state.participants.length)) {
      initializeSeedOrder();
    } else {
      const validIds = new Set(state.participants.map((participant) => participant.id));
      state.seedOrder = state.seedOrder.map((id) => (validIds.has(id) ? id : null));
      state.officialWinners = Object.fromEntries(
        Object.entries(state.officialWinners).filter(([, id]) => validIds.has(id))
      );
      state.viewerVotes = Object.fromEntries(
        Object.entries(state.viewerVotes).filter(([, id]) => validIds.has(id))
      );
      saveState();
    }

    rerender();

    if (state.unresolvedEntries.length) {
      setNotice(`Loaded ${state.participants.length} skins. A few entries may need manual cleanup.`, "warning");
    } else {
      setNotice("Bracket loaded. The very anime playoffs are live.");
    }
  } catch {
    state.participants = REQUESTED_SKINS.map((name, index) => ({
      id: `fallback-${index}`,
      requestLabel: name,
      displayName: name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      championName: name.split(" ").at(-1),
      splashUrl: "",
      previewUrl: "",
      videoUrl: "",
      showcaseUrl: buildYouTubeSearchUrl(name),
      assetUrl: buildYouTubeSearchUrl(name),
    }));
    state.unresolvedEntries = [];
    initializeSeedOrder();
    rerender();
    setNotice("Could not fetch CommunityDragon skin data, so visuals are unavailable right now.", "error");
  }
}

elements.shuffleButton.addEventListener("click", () => {
  initializeSeedOrder();
  rerender();
  setNotice("The bracket got a full anime training-arc reshuffle.");
});

elements.resetButton.addEventListener("click", () => {
  state.officialWinners = {};
  saveState();
  rerender();
  setNotice("Official winners cleared. Viewer votes stayed local.");
});

elements.viewerModeButton.addEventListener("click", () => {
  state.mode = "viewer";
  saveState();
  rerender();
  setNotice("Viewer mode active. Pick your champions.");
});

elements.adminModeButton.addEventListener("click", () => {
  state.mode = "admin";
  saveState();
  rerender();
  setNotice("Admin throne active. You now decide canon.");
});

elements.sendVotesButton.addEventListener("click", () => {
  const rounds = computeRounds();
  sendVotes(rounds, getActiveRoundIndex(rounds));
});

elements.exportButton.addEventListener("click", exportState);
elements.importButton.addEventListener("click", importState);
elements.copyButton.addEventListener("click", copyPayload);
elements.voterName.addEventListener("input", saveState);

loadSkinData();
