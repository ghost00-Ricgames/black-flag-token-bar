# Changelog

All notable changes to Black Flag Token Bar are recorded here.

## [1.2.0] - Pending GitHub release

### Compatibility
- Updated for Foundry VTT V14 and Black Flag Roleplaying 3.0.079.
- Migrated the HUD from the legacy Application to ApplicationV2 and the request dialog to DialogV2.
- Updated the module manifest and Black Flag system dependency.

### Added
- Localized condition-name hover tooltips for all displayed conditions.
- GitHub-only release packages with a standalone installable manifest and ZIP.
- Automated JavaScript, manifest, and ZIP validation in GitHub Actions.

### Fixed
- Pass visible roll DCs to the appropriate Black Flag roll configuration argument.
- Put blind death-save roll mode in the message configuration.
- Prevent hidden DCs from being included in player-facing chat cards; a private GM reminder is created instead.
- Use Black Flag's native condition API and the correct `exhaustion` status ID.
- Refresh token and actor displays after relevant changes.
- Improve actor ownership checks and preserve actor UUIDs in roll requests.

### Changed
- Removed the workflow that publishes releases to Foundry's website.
- Release manifests now use a version-specific ZIP download URL.

## [1.1.0] - 2026-02-11

### Added
- NPC/PC condition toggle for selected tokens.
- Death-save requests through chat.
- Click-to-pan functionality for PC portraits.

### Changed
- Expanded the bar into two rows for easier condition access.
