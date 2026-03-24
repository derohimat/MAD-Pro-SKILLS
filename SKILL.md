---
name: Modern Android Development (MAD) Skills
description: Expert guidance for building robust, scalable, and maintainable Android applications using Modern Android Development (MAD) principles.
---

# Modern Android Development (MAD) Skills

You are an expert Android developer specializing in Modern Android Development (MAD). Your goal is to help the user build high-quality, maintainable, and idiomatic Android applications following the official Google recommendations.

Follow these core principles:

1. **Multi-layered Architecture**: Separate code into UI, Domain, and Data layers.
2. **Unidirectional Data Flow (UDF)**: Ensure a clear separation of state (flowing down) and events (flowing up).
3. **Reactive Programming**: Use `Flow` and `StateFlow` to handle data streams across all layers.
4. **Dependency Injection**: Use Hilt (recommended) or Koin to manage component dependencies.
5. **Modern UI**: Use Jetpack Compose and Material 3 for all new features.

## Architecture Layers

### 1. UI Layer

- **[State Management](references/state_management.md)**: `UiState` patterns, ViewModels, and `collectAsStateWithLifecycle`.
- **[UI Patterns](references/ui_patterns.md)**: Slot APIs and reusable components.
- **[Layouts & Structure](references/layouts.md)**: Building responsive UI with `Scaffold` and Material 3.
- **[Modifiers](references/modifiers.md)**: Chaining, ordering, and best practices.
- **[Theming](references/theming.md)**: Material 3, typography, and Dynamic Color.
- **[Navigation](references/navigation.md)**: Type-safe navigation.

### 2. Domain Layer

- **[Domain Layer](references/domain_layer.md)**: Use Cases and business logic isolation.

### 3. Data Layer

- **[Data Layer & Room](references/local_data.md)**: Offline-first with Room and DataStore.
- **[Networking](references/network_data.md)**: Retrofit/Ktor, JSON serialization, and error handling.

## Utilities & Specialized Skills

- **[Architecture & DI](references/architecture_di.md)**: Orchestrating layers with Hilt and Koin.
- **[Concurrency & Flow](references/concurrency.md)**: Coroutines and Flows across the stack.
- **[Performance](references/performance.md)**: Stability and recomposition optimization.
- **[Testing](references/testing.md)**: Semantic UI tests and Unit testing.
- **[Security](references/security.md)**: Secure storage, biometrics, and permissions.
- **[Advanced UI (Pro)](references/advanced_ui.md)**: Animations, Canvas, and custom layouts.
- **[Accessibility](references/accessibility.md)**: Inclusivity and Semantics.
- **[Google Play Skills](references/google_play_skills.md)**: Compliance and release management.
- **[WorkManager](references/workmanager.md)**: Persistent and reliable background tasks.
- **[Widget & Glance](references/widget_glance.md)**: Home screen and lock screen widgets with Glance.
- **[App Shortcuts](references/app_shortcuts.md)**: Static, dynamic, and pinned launcher shortcuts.
- **[Camera & Media](references/camera_media.md)**: CameraX, photo/video capture, Media3, and Coil.
- **[Barcode & QR Code](references/barcode_qr.md)**: ML Kit barcode scanner, QR generation, and overlay UI.
- **[Image Editing](references/image_editing.md)**: Crop (uCrop), filters, Canvas annotation, and export.
- **[Voice & Speech](references/voice_speech.md)**: SpeechRecognizer, TextToSpeech, and voice input UI.
- **[Gemini API](references/gemini_api.md)**: Text, vision, streaming, multi-turn chat, and function calling.
- **[LLM UI Patterns](references/llm_ui_patterns.md)**: Streaming text, typewriter effect, Markdown rendering, and chat UX.
- **[ARCore](references/ar_core.md)**: Product placement, measurement tool, face filters, and image tracking.

### 4. Advanced & Ecosystem Skills

- **[Modularization](references/modularization.md)**: Multi-module architecture and Version Catalogs.
- **[KMP & Multiplatform](references/multiplatform.md)**: Logic sharing and Compose Multiplatform.
- **[Adaptive UI](references/adaptive_layouts.md)**: Large screens, foldables, and Window Size Classes.
- **[Observability & Health](references/observability.md)**: Crashlytics, Remote Config, and Monitoring.
- **[Advanced Performance](references/advanced_performance.md)**: Baseline Profiles and Macrobenchmarking.
- **[Deep Links](references/deeplinks.md)**: App Links and verified navigation.
- **[On-Device AI](references/ai_ml.md)**: Gemini Nano and ML Kit integration.

### 5. Engineering Excellence

- **[Clean Architecture](references/clean_architecture.md)**: Layers, dependency rule, and MAD mapping.
- **[SOLID Principles](references/solid_principles.md)**: Sustainable software design with Android examples.
- **[Design Systems](references/design_systems.md)**: Professional tokens and shared components at scale.

### 6. Platform Evolution & Migration

- **[XML to Compose](references/migration_xml_to_compose.md)**: Gradual UI modernization.
- **[Android to KMP](references/kmp_migration.md)**: Sharing logic across platforms.
- **[Compose to CMP](references/cmp_migration.md)**: Sharing UI across platforms.
- **[Automation & CI/CD](references/automation_cicd.md)**: GitHub Actions and Fastlane pipelines.

## Industry Skills

Domain-specific patterns for building real-world production apps across major industry verticals.
All industry skill reference files are located in the `references/industry/` folder.

### 7. Banking & Financial

- **[Banking & Finance](references/industry/banking_finance.md)**: Account dashboards, transaction history, biometric auth, masked data, and bank-grade security.
- **[Payment Gateway](references/industry/payment_gateway.md)**: Card tokenization, 3DS flows, payment status polling, and idempotent requests.

### 8. E-Commerce & Retail

- **[E-Commerce](references/industry/ecommerce.md)**: Product grids, cart management, checkout stepper, order tracking, and wishlist.
- **[Product Catalog](references/industry/product_catalog.md)**: Paging 3, filter/sort sheets, search debounce, image galleries, and skeleton loading.

### 9. On-Demand & Mobility

- **[Ride-Hailing](references/industry/ride_hailing.md)**: Google Maps integration, real-time driver tracking, booking flow, and fare estimation.
- **[On-Demand Services](references/industry/on_demand.md)**: Order lifecycle, FCM status updates, ETA countdown, and provider rating.
- **[Food Delivery](references/industry/food_delivery.md)**: Restaurant listing, menu customization, cart summary, delivery tracking map, and vouchers.

### 10. Healthcare

- **[Healthcare](references/industry/healthcare.md)**: Appointment booking, doctor listing, health metrics dashboard, teleconsultation, and HIPAA compliance.

### 11. Education

- **[EdTech](references/industry/edtech.md)**: Course catalog, ExoPlayer video with chapters, quiz engine, progress tracking, and certificate generation.

### 12. Property & Real Estate

- **[Property](references/industry/property.md)**: Map/list toggle, property card, advanced filter, mortgage calculator, and virtual tour.

### 13. Social & Communication

- **[Social Feed](references/industry/social_feed.md)**: Paging 3 timeline, post card, animated like button, stories UI, and notification feed.
- **[Real-Time Chat](references/industry/realtime_chat.md)**: Message bubbles, WebSocket client, typing indicator, chat input bar, and Room persistence.

### 14. Government & Public Sector

- **[Government & Public Sector](references/industry/government.md)**: eID OAuth2 auth, public services dashboard, document submission, WCAG compliance, and offline-capable forms.

### 15. Web3 & Crypto

- **[Web3 & Crypto](references/industry/web3_crypto.md)**: WalletConnect integration, token portfolio UI, transaction signing, NFT gallery, and price charts.

### 16. Hardware Integration

- **[Hardware Integration](references/industry/hardware_integration.md)**: BLE device scanning, NFC read/write, USB serial communication, IoT sensor dashboard, and hardware permissions.

### 17. Logistics & Fleet

- **[Logistics & Fleet](references/industry/logistics_fleet.md)**: Live fleet map, driver dispatch, route optimization, proof of delivery, and geofence arrival.

### 18. Insurance

- **[Insurance](references/industry/insurance.md)**: Policy dashboard, claim submission wizard, photo evidence, premium calculator, and digital policy card.

### 19. HR & Attendance

- **[HR & Attendance](references/industry/hr_attendance.md)**: GPS clock-in/out, attendance calendar, leave request, payslip viewer, and face recognition.

### 20. Point of Sale (POS)

- **[POS & Retail](references/industry/pos_retail.md)**: Checkout UI, cart panel, payment methods, Bluetooth receipt printing, and inventory management.

### 21. Travel Booking

- **[Travel Booking](references/industry/travel_booking.md)**: Flight search, adaptive results list, interactive seat picker, and digital boarding pass.

### 22. Gaming & Leaderboard

- **[Gaming & Leaderboard](references/industry/gaming_leaderboard.md)**: Podium UI, achievements, unlock animations, in-game store, and Google Play Games integration.

### 23. Media Streaming

- **[Media Streaming](references/industry/media_streaming.md)**: ExoPlayer/Media3, custom controls, PiP, HLS/DASH, DRM Widevine, and offline download.

## Cross-Industry Technical Skills

Foundational capabilities that power multiple industry app categories.
All cross-industry reference files are located in the `references/industry/` folder.

### 24. Real-Time & Connectivity

- **[Real-Time Sync](references/industry/real_time_sync.md)**: WebSocket with reconnection, Firebase RTDB, SSE, optimistic updates, and connection banners.
- **[Maps & Location](references/industry/maps_location.md)**: Google Maps Compose, location permissions, FusedLocationProvider, geocoding, polylines, and geofencing.
- **[Push Notifications](references/industry/push_notifications.md)**: FCM setup, notification channels, Android 13+ permission, deep links, and topic subscriptions.

### 25. Monetization

- **[In-App Payments](references/industry/in_app_payments.md)**: Google Play Billing, subscriptions, one-time purchases, server-side verification, and paywall UI.

### 26. Data & Observability

- **[Analytics & Tracking](references/industry/analytics_tracking.md)**: Event naming conventions, tracker abstraction, screen tracking, funnel tracking, and user properties.
- **[Offline-First](references/industry/offline_first.md)**: Single source of truth, NetworkMonitor, WorkManager sync, optimistic create, and conflict resolution.

## Code Style

- Use trailing commas for all composable parameters.
- Order parameters: `Modifier` first (if not required), then functional parameters last.
- Naming: UI state classes should end in `UiState`. Events should end in `UiEvent`.
