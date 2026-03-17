const SLOT_STORAGE_KEY = "veryanime-drops-v1";
const draggableCards = Array.from(document.querySelectorAll(".team-card[data-team]"));
const dropSlots = Array.from(document.querySelectorAll("[data-slot]"));

function teamPayloadFromCard(card) {
  const image = card.querySelector("img");
  const nameNode = card.querySelector("span");

  return {
    name: card.dataset.team || nameNode?.textContent?.trim() || "Unknown",
    imageSrc: image?.src || "",
    imageAlt: image?.alt || "",
  };
}

function makeSlotTeamMarkup(payload) {
  return `
    <div class="slot-team" draggable="true" data-team="${payload.name}">
      <img src="${payload.imageSrc}" alt="${payload.imageAlt || payload.name}" />
      <span>${payload.name}</span>
      <button type="button" class="clear-slot">Clear</button>
    </div>
  `;
}

function readStoredSlots() {
  try {
    const raw = sessionStorage.getItem(SLOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredSlots(data) {
  sessionStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(data));
}

function captureSlotDefaults() {
  dropSlots.forEach((slot) => {
    if (!slot.dataset.defaultLabel) {
      slot.dataset.defaultLabel = slot.textContent.trim();
    }
  });
}

function clearSlot(slot) {
  slot.innerHTML = slot.dataset.defaultLabel || "";
  slot.classList.remove("slot-has-team");
}

function fillSlot(slot, payload) {
  slot.innerHTML = makeSlotTeamMarkup(payload);
  slot.classList.add("slot-has-team");
  enableFilledSlotDragging(slot);
}

function enableFilledSlotDragging(slot) {
  const slotTeam = slot.querySelector(".slot-team");
  const clearButton = slot.querySelector(".clear-slot");

  if (slotTeam) {
    slotTeam.addEventListener("dragstart", (event) => {
      const img = slotTeam.querySelector("img");
      const label = slotTeam.querySelector("span");
      const payload = {
        name: slotTeam.dataset.team || label?.textContent?.trim() || "",
        imageSrc: img?.src || "",
        imageAlt: img?.alt || "",
      };
      event.dataTransfer.setData("application/json", JSON.stringify(payload));
      event.dataTransfer.effectAllowed = "copy";
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      const data = readStoredSlots();
      delete data[slot.dataset.slot];
      writeStoredSlots(data);
      clearSlot(slot);
    });
  }
}

function hydrateSlotsFromSession() {
  captureSlotDefaults();
  const data = readStoredSlots();

  dropSlots.forEach((slot) => {
    const payload = data[slot.dataset.slot];
    if (payload && payload.imageSrc && payload.name) {
      fillSlot(slot, payload);
    } else {
      clearSlot(slot);
    }
  });
}

function bindSourceDragging() {
  draggableCards.forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      const payload = teamPayloadFromCard(card);
      event.dataTransfer.setData("application/json", JSON.stringify(payload));
      event.dataTransfer.effectAllowed = "copy";
    });
  });
}

function bindDropSlots() {
  dropSlots.forEach((slot) => {
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

      fillSlot(slot, payload);
      const data = readStoredSlots();
      data[slot.dataset.slot] = payload;
      writeStoredSlots(data);
    });
  });
}

bindSourceDragging();
bindDropSlots();
hydrateSlotsFromSession();
