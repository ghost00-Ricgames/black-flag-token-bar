const MODULE_ID = 'black-flag-token-bar';

Hooks.once('init', () => {
    game.settings.register(MODULE_ID, "pos", {
        scope: "client", config: false, type: Object,
        default: { top: 60, left: window.innerWidth / 2 - 200 }
    });
});

Hooks.on('ready', () => {
    if (game.user.isGM) new BlackFlagTokenBar().render(true);
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
            const actor = game.actors.get(ev.currentTarget.dataset.actorId);
            const token = actor?.getActiveTokens()[0];
            if (token) { canvas.animatePan({x: token.x, y: token.y}); token.control({releaseOthers: true}); }
            else actor?.sheet.render(true);
        });
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
            <div style="margin-bottom:8px; display: flex; align-items: center; gap: 10px; color: black;">
                <b>DC:</b> <input type="number" id="bfr-dc" value="10" style="width:40px; border:1px solid #444;">
                <label style="font-size: 11px;"><input type="checkbox" id="bfr-hide-dc"> Hide DC</label>
            </div>
            <div class="bfr-section-title">SAVING THROWS</div>
            <div class="bfr-link-grid">` + 
            abilities.map(a => `<a class="roll-link" data-type="save" data-id="${a}" title="Request ${a} Save">${a.substring(0,3).toUpperCase()}</a>`).join("") + 
            `</div><div class="bfr-section-title">ABILITY CHECKS</div>
            <div class="bfr-link-grid">` + 
            abilities.map(a => `<a class="roll-link" data-type="ability" data-id="${a}" title="Request ${a} Check">${a.substring(0,3).toUpperCase()}</a>`).join("") + 
            `</div><div class="bfr-section-title">SKILLS</div>
            <div class="bfr-link-grid">` + 
            skills.map(s => {
                const label = s.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return `<a class="roll-link" data-type="skill" data-id="${s}" title="Request ${label} Check">${label}</a>`;
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
            const content = `
                <div class="bfr-chat-card" data-bfr-request="true" style="border:2px solid #ff6400; padding:8px; background:rgba(0,0,0,0.6); border-radius:5px; text-align:center; color: white;">
                    <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">${actor.name}</div>
                    <div style="margin-bottom: 8px;">Request: <b>${id.toUpperCase()} ${type.toUpperCase()}</b><br>Target DC: <b>${displayDC}</b></div>
                    <button class="bfr-chat-roll-btn" data-type="${type}" data-id="${id}" data-actor-id="${actor.id}" data-dc="${dc}" 
                        style="background:#ff6400; color:black; cursor:pointer; width:100%; border:none; font-weight:bold; padding: 6px; border-radius: 3px;">
                        ROLL NOW
                    </button>
                </div>`;
            
            await ChatMessage.create({ content, whisper: owners.length > 0 ? owners : [game.user.id] });
            
            if (owners.length > 0) {
                game.socket.emit("module.black-flag-token-bar", { type: "NOTIFY", users: owners });
            }
        }
    }

    async _clearAllRequests() {
        const messages = game.messages.filter(m => m.content.includes('data-bfr-request="true"'));
        if (messages.length === 0) return ui.notifications.warn("No active roll requests found.");
        
        new Dialog({
            title: "Clear Requests",
            content: `<p>Delete ${messages.length} pending roll requests from chat?</p>`,
            buttons: {
                yes: {
                    label: "Delete",
                    callback: async () => {
                        for (let m of messages) await m.delete();
                        ui.notifications.info(`Cleared ${messages.length} roll requests.`);
                    }
                },
                no: { label: "Cancel" }
            }
        }).render(true);
    }
}

Hooks.on('ready', () => {
    game.socket.on("module.black-flag-token-bar", data => {
        if (data.type === "NOTIFY" && data.users.includes(game.user.id)) {
            AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, loop: false}, true);
        }
    });
});

document.addEventListener("click", async (event) => {
    const btn = event.target.closest(".bfr-chat-roll-btn");
    if (!btn) return;

    event.preventDefault();
    const { type, id, actorId, dc } = btn.dataset;
    const actor = game.actors.get(actorId);

    if (!actor || (!game.user.isGM && !actor.isOwner)) return;

    const options = { target: parseInt(dc) };

    try {
        if (type === "save") await actor.rollAbilitySave({ ability: id }, options);
        else if (type === "ability") await actor.rollAbilityCheck({ ability: id }, options);
        else if (type === "skill") await actor.rollSkill({ skill: id }, options);
    } catch (e) {
        console.error("BFR Token Bar | Roll Error:", e);
    }
}, true);