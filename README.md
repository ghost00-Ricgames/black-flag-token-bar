# Black Flag Token Bar

Draggable GM HUD for Black Flag Roleplaying (Tales of the Valiant).

## Compatibility
- Foundry VTT 14
- Black Flag Roleplaying 3.0.079 (and later 3.x versions, pending testing)
- Token Bar 1.2.0 (development)

## Features
PC Armor Class, HP and Luck tracking; draggable GM HUD; player portrait focus; roll requests; condition toggles on selected tokens.

Roll requests support ability saves, ability checks, skills, and blind death saves. For hidden DCs the player never receives the target number; the GM receives a separate private target reference and adjudicates the roll against it.

## GitHub-only installation
After v1.2.0 is reviewed and published as a GitHub release, in Foundry's Add-on Modules screen choose Install Module and paste:

https://github.com/ghost00-Ricgames/black-flag-token-bar/releases/latest/download/module.json

The release workflow uploads both a module.json manifest and a ZIP. No Foundry package directory submission is used.

## Testing before release
Use Foundry V14 with Black Flag 3.0.079. Verify: GM bar rendering and saved position; player and NPC stats; token selection; statuses and exhaustion; roll modifiers and DCs; hidden DC privacy; blind death saves; chat ownership/permissions; deletion confirmation; multiple user sessions.

This development branch is not a tested release. Manual runtime testing is necessary.

## License
MIT.
