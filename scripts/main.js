const MODULE_ID = "black-flag-token-bar";
const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const CONDITION_IDS = [
  "blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled",
  "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", "prone",
  "restrained", "stunned", "surprised", "unconscious"
];

function escapeHTML(value) {
  const el = document.createElement("span");
  el.textContent = String(value ?? "");
  return el.innerHTML;
}

function playerActors() {
  return game.actors.filter(actor => actor.type === "pc" && actor.hasPlayerOwner);
}

function gmRecipients() {
  return game.users.filter(user => user.isGM).map(user => user.id);
}

function actorOwners(actor) {
  return game.users.filter(user => !user.isGM && actor.testUserPermission(user, "OWNER"))
    .map(user => user.id);
}

function showError(error) {
  console.error(MODULE_ID, error);
  ui.notifications.error("Black Flag Token Bar encountered an error. See the console.");
}

class BlackFlagTokenBar extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: MODULE_ID,
    tag: "section",
    classes: ["black-flag-token-bar-app"],
    window: { frame: false },
    position: { width: "auto", height: "auto" },
    actions: {
      openRolls: this.openRolls,
      clearRequests: this.clearRequests,
      focusToken: this.focusToken,
      toggleCondition: this.toggleCondition
    }
  };

  static PARTS = {
    bar: { template: "modules/black-flag-token-bar/templates/bar.html" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const tokens = playerActors().map(actor => ({
      uuid: actor.uuid,
      name: actor.name,
      img: actor.prototypeToken?.texture?.src || actor.img || "icons/svg/mystery-man.svg",
      ac: actor.system.attributes?.ac?.value ?? "—",
      hp: actor.system.attributes?.hp?.value ?? "—",
      luck: actor.system.attributes?.luck?.value ?? "—"
    }));

    const token = canvas.ready ? canvas.tokens.controlled[0] : null;
    const actor = token?.actor;
    const statuses = actor?.statuses ?? new Set();
    const conditions = actor ? CONDITION_IDS.map(id => {
      const effect = CONFIG.statusEffects.find(entry => entry.id === id);
      return {
        id,
        label: effect?.name ?? id,
        img: effect?.img ?? "icons/svg/aura.svg",
        active: statuses.has(id) ||
          (id === "exhaustion" && (actor.system.attributes?.exhaustion ?? 0) > 0)
      };
    }) : [];
    return {
      ...context,
      tokens,
      target: actor ? {
        name: token.name,
        img: token.document.texture.src || actor.img,
        ac: actor.system.attributes?.ac?.value ?? "—",
        hp: actor.system.attributes?.hp?.value ?? "—"
      } : null,
      conditions
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._enableDragging();
  }

  _enableDragging() {
    const handle = this.element.querySelector(".drag-handle");
    if (!handle) return;
    handle.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const origin = this.element.getBoundingClientRect();
      handle.setPointerCapture(event.pointerId);

      const move = moveEvent => {
        const left = Math.max(0, Math.min(window.innerWidth - 70,
          origin.left + moveEvent.clientX - startX));
        const top = Math.max(0, Math.min(window.innerHeight - 35,
          origin.top + moveEvent.clientY - startY));
        this.setPosition({ left, top });
      };
      const finish = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        game.settings.set(MODULE_ID, "pos", {
          top: this.position.top,
          left: this.position.left
        }).catch(showError);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    });
  }

  static async focusToken(event, target) {
    const actor = await fromUuid(target.dataset.actorUuid);
    if (!actor) return;
    const token = actor.getActiveTokens()[0];
    if (token) {
      await canvas.animatePan({ x: token.center.x, y: token.center.y });
      token.control({ releaseOthers: true });
    } else {
      actor.sheet?.render(true);
    }
  }

  static async toggleCondition(event, target) {
    const id = target.dataset.conditionId;
    if (!CONDITION_IDS.includes(id)) return;
    const controlled = canvas.ready ? canvas.tokens.controlled : [];
    if (!controlled.length) return ui.notifications.warn("Select a token first.");
    try {
      for (const token of controlled) {
        if (token.actor) await token.actor.toggleStatusEffect(id);
      }
      await this.render();
    } catch (error) {
      showError(error);
    }
  }

  static async openRolls() {
    await this._openRollDialog();
  }

  async _openRollDialog() {
    const abilities = Object.entries(CONFIG.BlackFlag.abilities)
      .filter(([id]) => ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].includes(id));
    const skills = Object.entries(CONFIG.BlackFlag.skills);
    const buttons = (entries, type) => entries.map(([id, data]) => {
      const label = type === "skill"
        ? game.i18n.localize(data.label)
        : (data.abbreviation || id.slice(0, 3)).toUpperCase();
      return '<button type="button" class="roll-link" data-roll-type="' + type +
        '" data-roll-id="' + escapeHTML(id) + '">' + escapeHTML(label) + '</button>';
    }).join("");

    const content =
      '<div class="bfr-selector">' +
      '<div class="bfr-dc-row"><label>DC <input name="dc" type="number" min="1" max="99" value="10"></label>' +
      '<label><input name="hidden" type="checkbox"> Hide DC</label></div>' +
      '<div class="bfr-section-title">SAVING THROWS</div><div class="bfr-link-grid">' +
      buttons(abilities, "save") + '<button type="button" class="roll-link death-save-link" data-roll-type="death" data-roll-id="death">DEATH</button></div>' +
      '<div class="bfr-section-title">ABILITY CHECKS</div><div class="bfr-link-grid">' +
      buttons(abilities, "ability") + '</div>' +
      '<div class="bfr-section-title">SKILLS</div><div class="bfr-link-grid">' +
      buttons(skills, "skill") + '</div></div>';

    const dialog = new DialogV2({
      window: { title: "Black Flag Roll Request" },
      content,
      buttons: [{ action: "close", label: "Close" }]
    });
    await dialog.render({ force: true });
    dialog.element.addEventListener("click", event => {
      const button = event.target.closest("[data-roll-type]");
      if (!button) return;
      event.preventDefault();
      const dc = Number(dialog.element.querySelector('[name="dc"]').value);
      const hidden = dialog.element.querySelector('[name="hidden"]').checked;
      if (button.dataset.rollType !== "death" && (!Number.isInteger(dc) || dc < 1 || dc > 99)) {
        ui.notifications.warn("Enter a DC between 1 and 99.");
        return;
      }
      this._sendRollRequests(button.dataset.rollType, button.dataset.rollId, dc, hidden)
        .catch(showError);
    });
  }

  async _sendRollRequests(type, id, dc, hidden) {
    const allowed = type === "skill" ? CONFIG.BlackFlag.skills
      : CONFIG.BlackFlag.abilities;
    if (type !== "death" && !Object.hasOwn(allowed, id)) return;
    if (type === "death" && id !== "death") return;

    const controlled = canvas.ready ? canvas.tokens.controlled : [];
    const targets = controlled.length
      ? controlled.map(token => token.actor).filter(Boolean)
      : playerActors();
    const unique = [...new Map(targets.map(actor => [actor.uuid, actor])).values()];
    const gmIds = gmRecipients();
    for (const actor of unique) {
      const recipients = [...new Set([...gmIds, ...actorOwners(actor)])];
      const requestLabel = type === "death" ? "DEATH SAVE (BLIND)"
        : (game.i18n.localize((type === "skill" ? CONFIG.BlackFlag.skills[id]?.label : CONFIG.BlackFlag.abilities[id]?.labels?.full) || id)
          + " " + (type === "save" ? "Save" : "Check"));
      const displayDC = type === "death" ? "" : '<p>Target DC: <strong>' +
        (hidden ? "Unknown" : dc) + '</strong></p>';
      // Hidden DCs are never embedded in player-visible HTML or flags.
      const targetData = (hidden || type === "death") ? "" : ' data-target="' + dc + '"';
      const content =
        '<div class="bfr-chat-card"><h3>' + escapeHTML(actor.name) + '</h3>' +
        '<p>Request: ' + escapeHTML(requestLabel) + '</p>' + displayDC +
        '<button type="button" class="bfr-chat-roll-btn" data-type="' + type +
        '" data-id="' + escapeHTML(id) + '" data-actor-uuid="' +
        escapeHTML(actor.uuid) + '"' + targetData + '>ROLL NOW</button></div>';
      await ChatMessage.create({
        content,
        whisper: recipients,
        flags: { [MODULE_ID]: { request: true, actorUuid: actor.uuid } }
      });
      // Only the GM sees the true target when a player-facing DC is hidden.
      // The player's roll has no target; the GM adjudicates against this note.
      if (hidden && type !== "death") {
        await ChatMessage.create({
          content: '<div class="bfr-gm-dc"><strong>GM Only — ' + escapeHTML(actor.name) +
            '</strong>: ' + escapeHTML(requestLabel) + ', DC ' + dc + '</div>',
          whisper: gmIds,
          flags: { [MODULE_ID]: { request: true } }
        });
      }
    }
  }

  static async clearRequests() {
    const messages = game.messages.filter(message => message.getFlag(MODULE_ID, "request"));
    if (!messages.length) return ui.notifications.info("No Token Bar roll requests found.");
    const confirmed = await DialogV2.confirm({
      window: { title: "Clear Token Bar Requests" },
      content: '<p>Delete ' + messages.length + ' Token Bar request messages?</p>',
      modal: true
    });
    if (!confirmed) return;
    try {
      for (const message of messages) await message.delete();
    } catch (error) {
      showError(error);
    }
  }
}

async function executeChatRoll(message, button) {
  const actorUuid = button.dataset.actorUuid;
  if (actorUuid !== message.getFlag(MODULE_ID, "actorUuid")) return;
  const actor = await fromUuid(actorUuid);
  if (!actor || (!game.user.isGM && !actor.isOwner)) {
    ui.notifications.warn("You do not own this character.");
    return;
  }
  const { type, id } = button.dataset;
  const target = button.hasAttribute("data-target") ? Number(button.dataset.target) : undefined;
  const config = target === undefined ? {} : { target };
  if (type === "death") {
    await actor.rollDeathSave({}, {}, { rollMode: "blindroll" });
  } else if (type === "save" && Object.hasOwn(CONFIG.BlackFlag.abilities, id)) {
    await actor.rollAbilitySave({ ...config, ability: id });
  } else if (type === "ability" && Object.hasOwn(CONFIG.BlackFlag.abilities, id)) {
    await actor.rollAbilityCheck({ ...config, ability: id });
  } else if (type === "skill" && Object.hasOwn(CONFIG.BlackFlag.skills, id)) {
    await actor.rollSkill({ ...config, skill: id });
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "pos", {
    scope: "client",
    config: false,
    type: Object,
    default: { top: 60, left: Math.max(0, Math.round(window.innerWidth / 2 - 200)) }
  });
});

Hooks.once("ready", async () => {
  if (game.system.id !== "black-flag") return;
  if (game.user.isGM) {
    try {
      const bar = new BlackFlagTokenBar();
      game.blackFlagTokenBar = bar;
      await bar.render({ force: true });
      const position = game.settings.get(MODULE_ID, "pos");
      bar.setPosition(position);
    } catch (error) {
      showError(error);
    }
  }
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!message.getFlag(MODULE_ID, "request")) return;
  html.querySelectorAll(".bfr-chat-roll-btn").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      if (button.disabled) return;
      button.disabled = true;
      try {
        await executeChatRoll(message, button);
      } catch (error) {
        showError(error);
      } finally {
        button.disabled = false;
      }
    });
  });
});

function refreshBar() {
  if (game.user?.isGM && game.blackFlagTokenBar) {
    game.blackFlagTokenBar.render().catch(showError);
  }
}

for (const hook of [
  "updateActor", "createActor", "deleteActor",
  "createActiveEffect", "updateActiveEffect", "deleteActiveEffect",
  "controlToken", "updateToken", "createToken", "deleteToken", "canvasReady"
]) Hooks.on(hook, refreshBar);
