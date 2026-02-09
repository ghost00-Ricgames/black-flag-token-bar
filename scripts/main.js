const MODULE_ID = 'black-flag-token-bar';

Hooks.once('init', () => {
    game.settings.register(MODULE_ID, "pos", {
        scope: "client", config: false, type: Object,
        default: { top: 60, left: window.innerWidth / 2 - 200 }
    });
});

Hooks.on('ready', () => {
    if (game.user.isGM) {
        if (game.blackFlagTokenBar) game.blackFlagTokenBar.close();
        game.blackFlagTokenBar = new BlackFlagTokenBar();
        game.blackFlagTokenBar.render(true);
    }
});

// NPC Selection Hook
Hooks.on("controlToken", () => {
    if (game.user.isGM && game.blackFlagTokenBar) {
        setTimeout(() => game.blackFlagTokenBar._updateNPCRow(), 50);
    }
});

class BlackFlagTokenBar extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: MODULE_ID,
            template: `modules/${MODULE_ID}/templates/bar.html`,
            popOut: false,
            minimizable: false
        });
    }

    getData() {
        const actors = game.actors.filter(a => (a.type === "character" || a.type === "pc") && a.hasPlayerOwner);
        return {
            tokens: actors.map(a => ({
                id: a.id,
                name: a.name,
                img: a.prototypeToken?.texture?.src || a.img || "icons/svg/mystery-man.svg",
                ac: a.system.attributes?.ac?.value ?? 10,
                hp: { value: a.system.attributes?.hp?.value ?? 0, max: a.system.attributes?.hp?.max ?? 0 },
                luck: a.system.attributes?.luck?.value ?? 0
            }))
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.makeDraggable(html);
        html.find('.request-rolls-btn').on('click', () => this._openRequestDialog());
        html.find('.clear-rolls-btn').on('click', () => this._clearAllRequests());
        
        html.find('.token-portrait').on('click', ev => {
            const actorId = ev.currentTarget.dataset.actorId;
            if (!actorId) return;
            const actor = game.actors.get(actorId);
            const token = actor?.getActiveTokens()[0];
            if (token) { 
                canvas.animatePan({x: token.center.x, y: token.center.y}); 
                token.control({releaseOthers: true}); 
            } else actor?.sheet.render(true);
        });

        html.on('click', '.condition-btn', ev => {
            ev.preventDefault();
            this._toggleCondition(ev.currentTarget.dataset.id);
        });

        this._updateNPCRow(html);
    }

    async _toggleCondition(id) {
        const controlled = canvas.tokens.controlled;
        if (controlled.length === 0) return ui.notifications.warn("No token selected!");
        
        for (let token of controlled) {
            const actor = token.actor;
            if (!actor) continue;

            const effect = actor.effects.find(e => e.statuses.has(id));
            if (effect) {
                await effect.delete({render: false});
            } else {
                const effectData = CONFIG.statusEffects.find(e => e.id === id);
                if (effectData) {
                    await actor.createEmbeddedDocuments("ActiveEffect", [{
                        ...effectData,
                        name: game.i18n.localize(effectData.name),
                        statuses: [id],
                        origin: actor.uuid
                    }], {render: false});
                }
            }
        }
        setTimeout(() => this._updateNPCRow(), 100);
    }

    _updateNPCRow(html) {
        const root = html || $(`#${MODULE_ID}`);
        const targetContainer = root.find('#active-target-content');
        if (!targetContainer.length) return;

        const controlled = canvas.tokens.controlled;
        if (controlled.length === 0) {
            targetContainer.html('<div class="no-target-text">No token selected</div>');
            return;
        }

        const token = controlled[0];
        const actor = token.actor;
        if (!actor) return;

        const ac = actor.system.attributes?.ac?.value ?? "??";
        const hp = actor.system.attributes?.hp?.value ?? "??";

        const activeStatuses = new Set();
        actor.effects.forEach(e => e.statuses.forEach(s => activeStatuses.add(s)));

        const conditions = [
            { id: "blinded", icon: "fas fa-eye-slash", label: "Blinded" },
            { id: "charmed", icon: "fas fa-heart", label: "Charmed" },
            { id: "deafened", icon: "fas fa-deaf", label: "Deafened" },
            { id: "exhausted", icon: "fas fa-bed", label: "Exhausted" },
            { id: "frightened", icon: "fas fa-ghost", label: "Frightened" },
            { id: "grappled", icon: "fas fa-hand-rock", label: "Grappled" },
            { id: "incapacitated", icon: "fas fa-hourglass-end", label: "Incapacitated" },
            { id: "invisible", icon: "fas fa-user-secret", label: "Invisible" },
            { id: "paralyzed", icon: "fas fa-pause", label: "Paralyzed" },
            { id: "petrified", icon: "fas fa-mountain", label: "Petrified" },
            { id: "poisoned", icon: "fas fa-skull-crossbones", label: "Poisoned" },
            { id: "prone", icon: "fas fa-arrow-down", label: "Prone" },
            { id: "restrained", icon: "fas fa-link", label: "Restrained" },
            { id: "stunned", icon: "fas fa-bolt", label: "Stunned" }
        ];

        let effectsHtml = conditions.map(c => {
            const activeClass = activeStatuses.has(c.id) ? "active" : "";
            return `<button class="condition-btn ${activeClass}" data-id="${c.id}" title="${c.label}"><i class="${c.icon}"></i></button>`;
        }).join("");

        targetContainer.html(`
            <div class="token-stat-block">
                <img class="token-portrait" src="${token.document.texture.src}" title="${token.name}">
                <div class="stat-values">
                    <span class="stat ac" title="Armor Class"><i class="fas fa-shield-alt"></i> ${ac}</span>
                    <span class="stat hp" title="Health"><i class="fas fa-heart"></i> ${hp}</span>
                </div>
                <div class="effect-controls-grid">
                    ${effectsHtml}
                </div>
            </div>
        `);
    }

    makeDraggable(html) {
        const bar = html[0];
        const savedPos = game.settings.get(MODULE_ID, "pos");
        bar.style.top = `${savedPos.top}px`;
        bar.style.left = `${savedPos.left}px`;
        const handle = bar.querySelector('.drag-handle');
        handle.onmousedown = (e) => {
            let p3 = e.clientX, p4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = document.onmousemove = null;
                game.settings.set(MODULE_ID, "pos", { top: bar.offsetTop, left: bar.offsetLeft });
            };
            document.onmousemove = (ev) => {
                bar.style.top = `${bar.offsetTop - (p4 - ev.clientY)}px`;
                bar.style.left = `${bar.offsetLeft - (p3 - ev.clientX)}px`;
                p3 = ev.clientX; p4 = ev.clientY;
            };
        };
    }

    _openRequestDialog() {
        const abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
        const skills = ["athletics", "acrobatics", "sleightOfHand", "stealth", "arcana", "history", "investigation", "nature", "religion", "animalHandling", "insight", "medicine", "perception", "survival", "deception", "intimidation", "performance", "persuasion"];

        let content = `<div class="bfr-selector">
            <div class="bfr-dc-row">
                <b>DC:</b> <input type="number" id="bfr-dc" value="10">
                <label><input type="checkbox" id="bfr-hide-dc"> Hide DC</label>
            </div>
            <div class="bfr-section-title">SAVING THROWS</div>
            <div class="bfr-link-grid">` + 
            abilities.map(a => `<a class="roll-link" data-type="save" data-id="${a}">${a.substring(0,3).toUpperCase()}</a>`).join("") + 
            `<a class="roll-link death-save-link" data-type="death" data-id="death">DEATH</a>` +
            `</div><div class="bfr-section-title">ABILITY CHECKS</div>
            <div class="bfr-link-grid">` + 
            abilities.map(a => `<a class="roll-link" data-type="ability" data-id="${a}">${a.substring(0,3).toUpperCase()}</a>`).join("") + 
            `</div><div class="bfr-section-title">SKILLS</div>
            <div class="bfr-link-grid">` + 
            skills.map(s => {
                const label = s.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return `<a class="roll-link" data-type="skill" data-id="${s}">${label}</a>`;
            }).join("") + 
            `</div></div>`;

        new Dialog({
            title: "Black Flag Roll Request",
            content: content,
            buttons: {},
            render: (html) => {
                html.find('.roll-link').on('click', ev => {
                    const dc = html.find('#bfr-dc').val();
                    const hidden = html.find('#bfr-hide-dc').is(':checked');
                    this._sendToChat(ev.currentTarget.dataset.type, ev.currentTarget.dataset.id, dc, hidden);
                });
            }
        }).render(true);
    }

    async _sendToChat(type, id, dc, hidden) {
        let targets = canvas.tokens.controlled.map(t => t.actor);
        if (targets.length === 0) targets = game.actors.filter(a => (a.type === "character" || a.type === "pc") && a.hasPlayerOwner);
        const displayDC = hidden ? "???" : dc;
        for (let actor of targets) {
            const owners = Object.entries(actor.ownership).filter(([u, l]) => l === 3 && u !== game.user.id).map(([u]) => u);
            
            const requestText = type === "death" ? "DEATH SAVE (BLIND)" : `${id.toUpperCase()} ${type.toUpperCase()}`;
            const dcLine = type === "death" ? "" : `<br>Target DC: <b>${displayDC}</b>`;

            const content = `<div class="bfr-chat-card" data-bfr-request="true" style="border:2px solid #ff6400; padding:8px; background:rgba(0,0,0,0.6); border-radius:5px; text-align:center; color: white;">
                <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">${actor.name}</div>
                <div style="margin-bottom: 8px;">Request: <b>${requestText}</b>${dcLine}</div>
                <button class="bfr-chat-roll-btn" data-type="${type}" data-id="${id}" data-actor-id="${actor.id}" data-dc="${dc}" 
                    style="background:#ff6400; color:black; cursor:pointer; width:100%; border:none; font-weight:bold; padding: 6px; border-radius: 3px;">
                    ROLL NOW
                </button>
            </div>`;
            await ChatMessage.create({ content, whisper: owners.length > 0 ? owners : [game.user.id] });
        }
    }

    async _clearAllRequests() {
        const messages = game.messages.filter(m => m.content.includes('data-bfr-request="true"'));
        if (messages.length === 0) return ui.notifications.warn("No active roll requests found.");
        new Dialog({
            title: "Clear Requests",
            content: `<p>Delete ${messages.length} pending roll requests from chat?</p>`,
            buttons: {
                yes: { label: "Delete", callback: async () => { for (let m of messages) await m.delete(); } },
                no: { label: "Cancel" }
            }
        }).render(true);
    }
}

document.addEventListener("click", async (event) => {
    const btn = event.target.closest(".bfr-chat-roll-btn");
    if (!btn) return;
    event.preventDefault();
    const { type, id, actorId, dc } = btn.dataset;
    const actor = game.actors.get(actorId);
    if (!actor) return;
    
    try {
        if (type === "save") await actor.rollAbilitySave({ ability: id }, { target: parseInt(dc) });
        else if (type === "death") await actor.rollDeathSave({ rollMode: "blindroll" }); // Forced Blind Roll
        else if (type === "ability") await actor.rollAbilityCheck({ ability: id }, { target: parseInt(dc) });
        else if (type === "skill") await actor.rollSkill({ skill: id }, { target: parseInt(dc) });
    } catch (e) { console.error(e); }
}, true);
