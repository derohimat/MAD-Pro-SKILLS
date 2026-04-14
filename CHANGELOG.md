# Changelog

All notable changes to MAD Pro CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-04-13

### Added — Architecture & Quality Gate
- `mad-pro doctor`: Interactive project scanner supporting MVVM, MVI, MVP, Clean+MVI, and VIPER architectures.
- Adaptive architecture rules engine to prevent God-classes and strict Domain layer bypasses.
- `--security` flag for `doctor`: Scans for hardcoded APIs, insecure HTTP, plaintext SharedPreferences, and memory leaks (`GlobalScope.launch`, decoupled BroadcastReceivers).
- `--review <branch>` flag for `doctor`: Targeted git diff reviewer for CI/CD and Pull Request validations.
- `--fix` (Beta) flag to scaffold auto-fixes.

### Added — Agent Context Improvements
- `mad-pro prompt`: Context-aware prompt generator. Reads `.mad-pro.json` to generate specialized instructions based on architecture and DI choices.
- `Design Tokens`: Base templates for unified AI-generated styling. Installs `color-tokens.md`, `typography-tokens.md`, and `spacing-tokens.md` via `mad-pro add`.

### Added — Documentation
- `docs/WIKI.md`: Comprehensive CLI documentation manual.
- Updated `docs/index.html` referencing the new scanner GUI and flags.

## [1.2.0] - 2026-03-25

### Added — Platform Capabilities
- `references/widget_glance.md`: Glance home & lock screen widgets, WorkManager refresh
- `references/app_shortcuts.md`: Static, dynamic, and pinned shortcuts with deep links
- `references/camera_media.md`: CameraX preview, photo/video capture, zoom & focus
- `references/barcode_qr.md`: ML Kit barcode scanner, QR generation, torch control
- `references/image_editing.md`: uCrop, color filters, Canvas annotation, brightness sliders, export
- `references/voice_speech.md`: SpeechRecognizer, TextToSpeech, waveform visualization, multi-language

### Added — AI & Emerging Tech
- `references/gemini_api.md`: Gemini SDK, text, vision, streaming, multi-turn chat, function calling
- `references/llm_ui_patterns.md`: Typewriter streaming UI, thinking indicator, Markdown rendering, stop button
- `references/ar_core.md`: AR furniture placement, measurement tool, face filters, image tracking

### Added — Industry Verticals (references/industry/)
- `logistics_fleet.md`: Live fleet map, driver dispatch, route optimizer, proof of delivery, geofencing
- `insurance.md`: Policy dashboard, claim submission wizard, photo evidence, premium calculator
- `hr_attendance.md`: GPS clock-in/out, attendance calendar, leave request, payslip viewer, face recognition
- `pos_retail.md`: POS checkout UI, cart, payment methods, Bluetooth ESC/POS printer, inventory
- `travel_booking.md`: Flight search, adaptive results list, interactive seat picker, digital boarding pass
- `gaming_leaderboard.md`: Podium UI, achievements, unlock animation, in-game store, Google Play Games
- `media_streaming.md`: ExoPlayer/Media3, custom controls, PiP, HLS/DASH, DRM Widevine, offline download
- `google_play_subscriptions.md`: Monthly/yearly/weekly plans, free trial, intro pricing, upgrade/downgrade with proration, grace period, on-hold, paused, cancelled lifecycle states, server-side acknowledgment, manage subscription deep link

### Updated
- `SKILL.md`: Reorganized to 26 categories with new Platform Capabilities, AI & Emerging Tech, and expanded Industry & Monetization sections
- `docs/index.html`: Stats updated to 76+ skills, 26+ categories, 23 industry verticals; new Platform Capabilities and AI & Emerging Tech skill grids

---

## [1.1.0] - 2026-03-17

### Added
- Multi-IDE support: `--ide` flag for `init` command (VS Code, Cursor, Windsurf, Android Studio, IntelliJ, Sublime, Vim, Neovim, Zed, Code Insiders)
- Interactive IDE selector on documentation site

### Added — Industry Verticals (initial batch)
- `references/industry/` directory with 15 domain-specific skill files:
  Banking, E-commerce, Ride-hailing, On-demand, Food delivery, Healthcare, EdTech, Property, Social feed, Real-time chat, Government, Web3/Crypto, Hardware integration

### Added — Cross-Industry Skills
- `real_time_sync.md`: WebSocket, Firebase RTDB, SSE, optimistic updates
- `maps_location.md`: Google Maps Compose, geofencing, FusedLocationProvider
- `push_notifications.md`: FCM, notification channels, Android 13+ permission
- `in_app_payments.md`: Google Play Billing, subscriptions, paywall UI
- `analytics_tracking.md`: Event naming, tracker abstraction, funnel tracking
- `offline_first.md`: Single source of truth, WorkManager sync, conflict resolution

### Added — Advanced Technical Skills
- `widget_glance.md`, `app_shortcuts.md`, `camera_media.md`, `barcode_qr.md`

### Updated
- Premium documentation site with stats, timeline, skill grids, and IDE showcase

---

## [1.0.0] - 2026-03-14

### Added
- Initial release of MAD Pro CLI
- `mad-pro init` command to scaffold AI skill files into any Android project
- Core MAD skill references:
  - UI Layer: State Management, UI Patterns, Layouts, Modifiers, Theming, Navigation
  - Domain Layer: Use Cases
  - Data Layer: Room, Networking
  - Utilities: Architecture & DI, Concurrency, Performance, Testing, Security, Advanced UI, Accessibility, Google Play Skills, WorkManager
  - Advanced: Modularization, KMP, Adaptive UI, Observability, Advanced Performance, Deep Links, On-Device AI
  - Engineering Excellence: Clean Architecture, SOLID Principles, Design Systems
  - Migration: XML→Compose, Android→KMP, Compose→CMP, CI/CD
