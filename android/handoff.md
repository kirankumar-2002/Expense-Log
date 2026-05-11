# Expense Log Pro — Android Build Handoff

## Goal
Deploy the Expense Log Pro web app (hosted at `https://expenselogpro.netlify.app/`) as a native Android application using a WebView wrapper with biometric authentication.

---

## Current State (as of 2026-05-12)

### Architecture
- **WebView-based app**: All business logic (Supabase, Firebase Auth, transactions, wallet, etc.) runs on the Netlify-hosted web app
- **Native layer**: Only provides biometric unlock + WebView container
- **Single source file**: `MainActivity.kt` (217 lines) — contains both the activity and the WebView composable

### Project Structure
```
android/
├── build.gradle.kts              ← Root: AGP 8.2.2, Kotlin 2.0.21, Google Services 4.4.4
├── settings.gradle.kts           ← google(), mavenCentral(), gradlePluginPortal()
├── gradle.properties             ← 2GB heap, AndroidX, Jetifier
├── gradle/wrapper/
│   └── gradle-wrapper.properties ← Gradle 8.5
└── app/
    ├── build.gradle.kts          ← App module config
    ├── google-services.json      ← Firebase config (present)
    ├── proguard-rules.pro        ← ProGuard rules for release builds
    └── src/main/
        ├── AndroidManifest.xml   ← Clean manifest, no Hilt/WorkManager providers
        ├── java/com/expenselogpro/app/
        │   └── MainActivity.kt   ← AppCompatActivity + WebView + BiometricPrompt
        └── res/
            ├── drawable-xxxhdpi/splash_bg.png
            ├── mipmap-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png
            └── values/
                ├── colors.xml     ← Brand colors (#6366F1 primary)
                ├── strings.xml    ← App name
                └── styles.xml     ← Theme.ExpenseLogPro (AppCompat-based)
```

### Current Build Error
```
Task :app:compileDebugKotlin FAILED

firebase-auth-24.1.0 → Kotlin metadata version 2.3.0
play-services-measurement-23.2.0 → Kotlin metadata version 2.2.0
Project Kotlin version → 2.0.21 (reads metadata 2.0.0)
```

**Root Cause**: Firebase BoM `34.13.0` ships libraries compiled with Kotlin 2.2–2.3, but the project uses Kotlin `2.0.21`. Kotlin cannot read metadata from a *newer* major version.

---

## Changes Made This Session

### 1. Gradle Infrastructure (Fixed ✅)
| File | Change | Reason |
|------|--------|--------|
| `settings.gradle.kts` | Added `google()`, `mavenCentral()`, `gradlePluginPortal()` repos | Plugins couldn't resolve from default repos |
| `gradle-wrapper.properties` | Set Gradle to `8.5` | Compatibility with AGP 8.2.2 |
| `gradle.properties` | Set `-Xmx2048m`, enabled AndroidX/Jetifier | Build was OOM-crashing |
| `build.gradle.kts` (root) | Updated Google Services to `4.4.4`, Kotlin to `2.0.21` | Plugin version compatibility |

### 2. Manifest Fixes (Fixed ✅)
| Issue | Fix |
|-------|-----|
| `roundIcon` resource not found | Removed `android:roundIcon` attribute |
| InitializationProvider authority conflict with WorkManager | Added `tools:node="replace"` then later removed entirely |
| WorkManagerInitializer meta-data warning | Removed (no longer using WorkManager) |

### 3. Architecture Simplification (Done ✅)
**Removed** the entire over-engineered native layer that was causing cascading build failures:
- ❌ Hilt/Dagger DI (`@AndroidEntryPoint`, `@HiltAndroidApp`, `@Module`, kapt)
- ❌ Room database (local caching — unnecessary, web handles data)
- ❌ WorkManager (background sync — unnecessary, web handles sync)
- ❌ Supabase Kotlin client + Ktor HTTP (unnecessary, web handles API calls)
- ❌ kotlinx-serialization (unnecessary without native data layer)
- ❌ 15+ source files across `data/`, `di/`, `domain/`, `ui/` packages

**Kept** only what the app needs:
- ✅ `MainActivity.kt` with `AppCompatActivity` + Compose + WebView + BiometricPrompt
- ✅ Firebase Auth + Analytics SDK (for `google-services.json` integration)
- ✅ App icons across all density buckets
- ✅ Resource XMLs (colors, strings, styles)

### 4. Missing Files Created (Done ✅)
| File | Purpose |
|------|---------|
| `proguard-rules.pro` | Referenced in build.gradle.kts, was missing |
| `values/colors.xml` | Brand colors for theme |
| `values/strings.xml` | App name string resource |
| `values/styles.xml` | `Theme.ExpenseLogPro` (AppCompat-based, needed for BiometricPrompt) |
| `mipmap-{hdpi,mdpi,xhdpi,xxhdpi}/ic_launcher.png` | Only xxxhdpi existed; other densities were missing |

### 5. AppModule.kt Package Fix (Done ✅, then file deleted)
- Added missing `package com.expenselogpro.app.di` declaration
- Later deleted entirely as part of architecture simplification

---

## Failed Attempts & Why

### Attempt 1: Fix Gradle plugin resolution
- **Error**: `com.android.application:8.2.2` not found
- **Fix**: Added repos to `settings.gradle.kts` → ✅ Worked

### Attempt 2: Fix `Configuration.fileCollection` method not found  
- **Error**: Gradle API incompatibility
- **Fix**: Upgraded Gradle wrapper to 8.5 → ✅ Worked

### Attempt 3: Fix `processDebugGoogleServices` failure
- **Error**: Missing `google-services.json`
- **Fix**: User downloaded from Firebase Console → ✅ Worked

### Attempt 4: Fix manifest merger conflict
- **Error**: `InitializationProvider@authorities` conflict between app and WorkManager
- **Fix**: Added `tools:node="replace"` to provider → ✅ Worked (with warning)

### Attempt 5: Fix missing `roundIcon` resource
- **Error**: `@mipmap/ic_launcher_round` not found
- **Fix**: Removed `android:roundIcon` from manifest → ✅ Worked

### Attempt 6: Fix Hilt `@AndroidEntryPoint` base class error
- **Error**: Hilt couldn't see `AppCompatActivity` as `ComponentActivity`
- **Fix**: Added `appcompat` dependency → ❌ Still failed (stale kapt cache, deeper issue)
- **Real fix**: Removed Hilt entirely (unnecessary for WebView app) → ✅ Resolved

### Attempt 7: Fix Kotlin metadata version mismatch (1.9 → 2.0)
- **Error**: Firebase BoM 34.13.0 compiled with Kotlin 2.x, project on 1.9.22
- **Fix**: Upgraded Kotlin to 2.0.21 → ❌ Still fails
- **Reason**: `firebase-auth-24.1.0` needs metadata 2.3.0, but Kotlin 2.0.21 only reads 2.0.0

### Attempt 8: Current state — Kotlin 2.0.21 still too old
- **Error**: `metadata is 2.3.0, expected version is 2.0.0`
- **Not yet tried**: See Next Steps below

---

## Next Steps (Try In Order)

### Option A: Remove Firebase SDK entirely (RECOMMENDED — Simplest)
Since this is a WebView app and ALL Firebase authentication happens on the web:
1. Remove `id("com.google.gms.google-services")` from both `build.gradle.kts` files
2. Remove all Firebase dependencies from `app/build.gradle.kts`
3. Delete `google-services.json` from `app/`
4. This eliminates the Kotlin version conflict entirely
5. The web app already handles Firebase Auth via JavaScript — no native SDK needed

### Option B: Downgrade Firebase BoM to Kotlin 2.0-compatible version
1. Change `firebase-bom:34.13.0` → `firebase-bom:33.6.0` (or `33.5.1`)
2. These older versions were published when Kotlin 2.0 was current
3. Keep Kotlin at `2.0.21`

### Option C: Upgrade entire toolchain to Kotlin 2.3
1. Kotlin `2.0.21` → `2.3.0`
2. AGP `8.2.2` → `8.9.x` (Kotlin 2.3 needs AGP 8.7+)
3. Gradle `8.5` → `8.12+` (newer AGP needs newer Gradle)
4. Compose BOM may also need updating
5. **Risk**: Most complex, may introduce new incompatibilities
6. Requires newest Android Studio (Meerkat or newer)

---

## Version Compatibility Matrix

| Component | Current | Option A | Option B | Option C |
|-----------|---------|----------|----------|----------|
| Kotlin | 2.0.21 | 2.0.21 | 2.0.21 | 2.3.0 |
| AGP | 8.2.2 | 8.2.2 | 8.2.2 | 8.9.x |
| Gradle | 8.5 | 8.5 | 8.5 | 8.12+ |
| Firebase BoM | 34.13.0 | *(removed)* | 33.6.0 | 34.13.0 |
| Compose BOM | 2024.02.00 | 2024.02.00 | 2024.02.00 | 2025.x |

---

## Key Files Reference

| File | Path |
|------|------|
| Root build config | `android/build.gradle.kts` |
| App build config | `android/app/build.gradle.kts` |
| Settings | `android/settings.gradle.kts` |
| Gradle properties | `android/gradle.properties` |
| Gradle wrapper | `android/gradle/wrapper/gradle-wrapper.properties` |
| Manifest | `android/app/src/main/AndroidManifest.xml` |
| Main source | `android/app/src/main/java/com/expenselogpro/app/MainActivity.kt` |
| Firebase config | `android/app/google-services.json` |
| Theme styles | `android/app/src/main/res/values/styles.xml` |

---

## Commands

### End old session
Close Android Studio. Kill Gradle daemons:
```powershell
# From android/ directory
.\gradlew.bat --stop
```

### Start fresh session
```powershell
# Clean Gradle caches for this project
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
```
Then reopen in Android Studio → File → Sync Project with Gradle Files → Run.

---

## Instruction for Next Session
Read `handoff.md` and continue exactly from where the previous session stopped. The build currently fails at `:app:compileDebugKotlin` due to Kotlin metadata version mismatch between Firebase BoM 34.13.0 (needs Kotlin 2.3) and the project (Kotlin 2.0.21). Try **Option A** first (remove Firebase SDK — it's unused in the native layer) as it's the simplest and most reliable fix.
