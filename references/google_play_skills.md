# Google Play Skills and Compliance

Publishing an app successfully requires adhering to Google Play policies and ensuring technical quality.

## 1. App Quality & Performance

Google Play prioritizes apps that are stable and performant.

- **Vitals**: Monitor Android Vitals in the Play Console to track crash rates and ANRs (Application Not Responding).
- **Frame Rate**: Ensure your Compose UI hits 60fps (or 120fps on capable screens) to avoid "jank" that lowers your store ranking.

## 2. Policy Compliance

- **Data Safety**: Be transparent about data collection. Every app must have a Privacy Policy URL.
- **Permissions**: Only request "dangerous" permissions that are essential for the app's core functionality. Explain clearly to the user why they are needed (Requirement: Data Safety Section).
- **Sensitive Content**: Adhere to content ratings and avoid restricted content (e.g., hate speech, illegal acts).

## 3. Technical Requirements

- **Android App Bundle (AAB)**: Google Play now requires the `.aab` format instead of `.apk` for new apps. This allows for dynamic delivery and smaller download sizes.
- **Target API Level**: Keep your app updated. Google Play requires apps to target a recent API level (usually within 1 year of the latest release).
- **Play Integrity API**: Use this to ensure your app is running on a genuine device and hasn't been tampered with (crucial for games and financial apps).

## 4. App Store Optimization (ASO)

- **Keywords**: Use relevant terms in your title and short description.
- **Visuals**: High-quality screenshots and a compelling feature graphic significantly increase conversion rates.
- **Localization**: Localize your store listing and in-app text for your main target markets.

## 5. Release Management

- **Internal Testing**: Use Internal Testing tracks for quick feedback from your team.
- **Staged Rollouts**: Deploy updates to a small percentage of users (e.g., 1%, 10%) first to catch unforeseen bugs early.
- **Review Management**: Respond to user reviews professionally; this improves user trust and can lead to better ratings.

## 6. Best Practices for Developers

- **API Deprecation**: Monitor the Android Developers blog for upcoming API changes or deprecations.
- **ProGuard/R8**: Always enable R8 in your release builds to shrink and obfuscate your code, reducing app size and protecting your IP.
- **Firebase App Distribution**: Use this for pre-release testing before moving to Play Console tracks.
