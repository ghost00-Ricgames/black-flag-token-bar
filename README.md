# Black Flag Token Bar

A compact, draggable **GM HUD for Black Flag Roleplaying (Tales of the Valiant)** in Foundry VTT.

## Supported versions

- **Foundry VTT:** V14 (user smoke-tested on build **14.370**)
- **Black Flag Roleplaying:** 3.0.079 (later 3.x releases have not been individually verified)
- **Token Bar:** 1.2.1

Version 1.2.0 passed initial functional testing on Foundry V14. Following the November 2 release of Foundry **V14.370**, the user confirmed that all seven smoke-test checks passed on November 6, 2026. This is **user-reported runtime verification**, not an independently executed automated integration test. The precise installed Black Flag patch version was not separately reported with this V14.370 check. v1.2.1 updates metadata and documentation only; its gameplay code is identical to v1.2.0.

GitHub distribution uses an independent manifest and ZIP; the module is **not** listed in the Foundry package directory.

## Features

- At-a-glance PC Armor Class, current Hit Points, and Luck Points.
- Draggable GM-only HUD with per-client saved position.
- Click a PC portrait to focus and select an active token or open the character sheet.
- Selected-token display and condition toggles using the game system's native status API.
- Condition icon tooltips displaying the localized **condition name only**.
- Roll requests for ability checks, saving throws, skills, and blind death saves.
- Visible DCs can be passed into the game system's roll workflow.
- Hidden DCs are not embedded in player-visible request cards. The GM receives a separate private DC reminder and adjudicates the rolled result.
- Confirmation before deleting Token Bar request messages.

## V14.370 verification (November 6, 2026)

The following smoke-test checks were reported as **passed** by the user after upgrading Foundry to V14.370:

1. GM HUD loads when entering the world.
2. PC portraits, Armor Class, Hit Points, and Luck render correctly.
3. Selecting an NPC refreshes the target row.
4. Condition buttons display name-only tooltips and toggle conditions.
5. GM can send a saving throw or skill roll request.
6. Player can use the chat card to complete a roll.
7. HUD can be repositioned and keeps its position after a reload.

The previous v1.2.0 feature testing remains the basis for other functionality. This patch does **not** introduce new behavior or imply additional testing beyond these checks.

## Install through GitHub

In Foundry Setup, navigate to **Add-on Modules → Install Module**. Paste this URL into the **Manifest URL** field:

```text
https://github.com/ghost00-Ricgames/black-flag-token-bar/releases/latest/download/module.json
```

Then enable the module in your Black Flag world. GitHub Releases supplies both the installer ZIP and the manifest.

**GitHub-only distribution:** No Foundry website publication or Foundry API key is involved. Automatic update checks use the GitHub-hosted manifest.

## Installing manually

Alternatively, download the `black-flag-token-bar.zip` attachment from the matching [GitHub release](https://github.com/ghost00-Ricgames/black-flag-token-bar/releases), extract its contents into `{Foundry User Data}/Data/modules/black-flag-token-bar`, and restart Foundry. The release ZIP contains `module.json` at the archive root. Make sure the file ends up inside the `black-flag-token-bar` directory, not a second nested folder.

Back up active worlds before making major Foundry or game-system version changes.

## Bug reports

Use [GitHub Issues](https://github.com/ghost00-Ricgames/black-flag-token-bar/issues), including the Foundry and Black Flag versions, reproduction steps, actual and expected results, and browser console errors when available.

## Release workflow

1. Review and merge changes to `main`.
2. Confirm that the **Validate and Package GitHub Release** GitHub Actions check passes.
3. Create a GitHub release with a new `vX.Y.Z` tag (for example, `v1.2.1`) pointing at the release commit.
4. Publishing the release triggers GitHub Actions to validate the tag, build the ZIP, and attach both `module.json` and `black-flag-token-bar.zip`.
5. Check both assets exist before sharing the install URL.

The ZIP download URL in each version's manifest is **version-specific**, so previous releases remain reproducible.

## License

MIT; see [LICENSE](LICENSE).
