# Versioning — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Semantic Versioning & Release Management  
> Document Owner: Engineering Lead | Last Updated: 2025-01  
> Classification: Internal — Engineering

---

## Table of Contents

1. [Versioning Policy](#versioning-policy)
2. [Version Number Format](#version-number-format)
3. [Branch Strategy](#branch-strategy)
4. [Tag & Release Process](#tag--release-process)
5. [Changelog Format](#changelog-format)
6. [Breaking Change Policy](#breaking-change-policy)
7. [Current Version](#current-version)
8. [Version History](#version-history)

---

## Versioning Policy

### Semantic Versioning (SemVer)

Wazeer OS follows **Semantic Versioning 2.0.0** as defined at [semver.org](https://semver.org/).

Format: **MAJOR.MINOR.PATCH[-PRERELEASE]+BUILD**

```
MAJOR.MINOR.PATCH
  │    │    │
  │    │    └── Patch: Bug fixes, no new features, no breaking changes
  │    └─────── Minor: New features, backward compatible
  └──────────── Major: Breaking changes (API, schema, architecture)
```

### Version Increment Rules

| Change Type | Increment | Example | Migration Required? |
|---|---|---|---|
| Bug fix (no behavior change) | PATCH | 2.0.0 → 2.0.1 | No |
| Bug fix (behavior change) | PATCH | 2.0.0 → 2.0.1 | No (if backward compatible) |
| New feature (backward compatible) | MINOR | 2.0.0 → 2.1.0 | No |
| New feature (requires migration) | MAJOR | 2.0.0 → 3.0.0 | Yes |
| Breaking API change | MAJOR | 2.0.0 → 3.0.0 | Yes |
| IndexedDB schema change | MAJOR | 2.0.0 → 3.0.0 | Yes (migration script) |
| UI breaking change (removed view) | MAJOR | 2.0.0 → 3.0.0 | Yes |
| Dependency update (breaking) | MAJOR | 2.0.0 → 3.0.0 | Yes |
| Design system breaking change | MINOR or MAJOR | Depends on severity | Possibly |
| Documentation update | No version bump | — | No |

### Pre-release Versions

Pre-release versions are suffixed with a hyphen and identifier:

```
2.0.0-alpha.1     # Alpha release (internal testing)
2.0.0-beta.1      # Beta release (limited testing)
2.0.0-rc.1        # Release candidate (final testing)
2.0.0             # Production release
```

Pre-release ordering (lower to higher):
```
alpha < beta < rc < release
alpha.1 < alpha.2 < beta.1
```

### Build Metadata

Build metadata (optional) is appended with `+`:

```
2.0.0+build.1234    # Build number
2.0.0-beta.1+sha.a1b2c3d  # Git commit SHA
```

Build metadata has **no precedence** — `2.0.0+build.1` = `2.0.0+build.2` in SemVer.

---

## Version Number Format

### In Code

```typescript
// src/constants/version.ts
export const APP_VERSION = '2.0.0';
export const APP_NAME = 'Wazeer OS';
export const BUILD_DATE = '2025-01-15';
```

### In Package.json

```json
{
  "name": "wazeer-os",
  "version": "2.0.0",
  "description": "Wazeer OS — Personal AI Assistant PWA",
  "private": true
}
```

### In Manifest

```json
{
  "version": "2.0.0",
  "version_name": "2.0.0-Rewrite"
}
```

### In UI

Settings → About:
```
Wazeer OS
Version 2.0.0-Rewrite (𓂀)
Built with ❤️ by 100MillionDEV / العرآب
```

### In Service Worker Cache Key

```javascript
const CACHE_NAME = `wazeer-os-v${APP_VERSION}`;
// Result: 'wazeer-os-v2.0.0'
```

---

## Branch Strategy

### Branch Model: GitHub Flow (Simplified)

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/chat-improvements
  │     ├── feature/hermes-agent
  │     ├── fix/auth-persistence
  │     └── feature/dashboard-v2
  │
  └── hotfix/critical-fix (from main)
```

### Branch Types

| Branch | Naming | Source | Target | Purpose |
|---|---|---|---|---|
| `main` | — | — | — | Production-ready code. Always deployable. |
| `develop` | — | main | main | Integration branch. All features merge here first. |
| `feature/*` | `feature/description` | develop | develop | New feature development |
| `fix/*` | `fix/description` | develop | develop | Bug fixes |
| `hotfix/*` | `hotfix/description` | main | main + develop | Critical production fix |
| `release/*` | `release/v2.1.0` | develop | main + develop | Release preparation |
| `docs/*` | `docs/description` | develop | develop | Documentation changes |

### Branch Protection Rules

| Branch | Protected? | Required Checks | Merge Strategy |
|---|---|---|---|
| `main` | ✅ Yes | CI pass, review approval, no conflicts | Squash merge |
| `develop` | ⚠️ Optional | CI pass | Merge commit |
| `feature/*` | ❌ No | CI pass recommended | Merge commit or rebase |
| `hotfix/*` | ❌ No | CI pass + review | Merge commit |

### Feature Branch Lifecycle

```
1. Create:  git checkout develop && git pull && git checkout -b feature/new-feature
2. Develop: Make commits with conventional commit messages
3. Push:    git push -u origin feature/new-feature
4. PR:      Open PR against develop, request review
5. Review:  Code review, CI checks pass
6. Merge:   Squash merge into develop
7. Cleanup:  Delete feature branch (automated or manual)
```

### Hotfix Branch Lifecycle

```
1. Create:  git checkout main && git checkout -b hotfix/critical-bug
2. Fix:     Make minimal fix commits
3. Test:    Run tests, verify fix
4. Merge:   Merge into main (direct)
           Also merge into develop (to prevent regression)
5. Tag:     git tag v2.0.1
6. Cleanup:  Delete hotfix branch
```

---

## Tag & Release Process

### Creating a Release

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Run full test suite
npm run test
npm run lint
npm run build

# 3. Create release branch (optional for minor releases)
git checkout -b release/v2.1.0

# 4. Update version numbers
# - package.json version
# - src/constants/version.ts
# - manifest.json version
# - index.html meta tags (if needed)

# 5. Update CHANGELOG.md
# [See changelog format below]

# 6. Commit version bump
git add -A
git commit -m "chore: bump version to 2.1.0"

# 7. Merge to main
git checkout main
git merge --no-ff release/v2.1.0

# 8. Create git tag
git tag -a v2.1.0 -m "Release v2.1.0 — Feature description"

# 9. Merge back to develop
git checkout develop
git merge --no-ff release/v2.1.0

# 10. Push
git push origin main --tags
git push origin develop

# 11. Build & deploy
npm run build
# Deploy dist/ to Hostinger

# 12. Cleanup
git branch -d release/v2.1.0
```

### Tag Naming Convention

| Pattern | Usage |
|---|---|
| `v2.0.0` | Full release |
| `v2.0.0-alpha.1` | Alpha pre-release |
| `v2.0.0-beta.1` | Beta pre-release |
| `v2.0.0-rc.1` | Release candidate |
| `v2.0.0-rc.1+build.42` | RC with build metadata |

### Annotated Tags Only

Always use annotated tags (with `-a` flag) for releases:

```bash
# ✅ Correct — annotated tag with message
git tag -a v2.0.0 -m "Release v2.0.0 — The Awakening (الصحوة)

Complete rewrite with React 19, Vite 6, Tailwind CSS 4.
New Amoun AI agent, Egyptian Cyberpunk design, real analytics."

# ❌ Incorrect — lightweight tag (no message)
git tag v2.0.0
```

---

## Changelog Format

### CHANGELOG.md Structure

```markdown
# Changelog

All notable changes to Wazeer OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2025-01-15

### Added
- Complete rewrite with React 19 and Vite 6
- Amoun AI agent with Gemini integration via @google/genai 2.4
- Multi-model support (Gemini, GPT, Claude, Ollama)
- Egyptian Cyberpunk design system with glassmorphism
- 5 theme presets (emerald, cyber-blue, crimson, purple, custom)
- Full bilingual AR/EN support with RTL/LTR
- 12 views with responsive mobile-first layout
- MobileBottomNav for mobile experience
- AmounEditor with Monaco + chat + terminal
- LlmDashboard with real metrics from useEventLogger
- Task and memory extraction from conversations
- Firebase Auth (Google + email)
- PWA manifest with install prompt
- Service worker with caching strategy
- Framer Motion animations (page transitions, chat, accordion)
- WCAG 2.1 AA accessibility (keyboard, ARIA, contrast)
- Onboarding wizard (3-step flow)
- Command palette (Cmd+K)
- Template system
- Landing page (LandingPageView)

### Changed
- Migrated from CRA to Vite 6
- Migrated from styled-components to Tailwind CSS 4
- Migrated from context providers to Zustand 5 stores
- Replaced dual LLM system with unified @google/genai
- Redesigned all components with Egyptian Cyberpunk aesthetic

### Deprecated
- v0.x API endpoints (no longer supported)
- v0.x IndexedDB schema (migration provided)

### Removed
- Dual OpenAI + Google LLM system
- All STUB services
- Decorative metrics (replaced with real analytics)
- Dead code from v0.x
- Zomra branding (replaced with Amoun)

### Fixed
- Auth persistence across page reloads
- IndexedDB data loss on schema mismatch
- Name inconsistency between code and UI

### Security
- Added HorusGuard AST scanner for code block security
- Input sanitization for all user-facing content
- CSP headers configuration
- API key management via environment variables

## [0.2.0] - 2024-06-01

### Added
- Initial dual LLM system (OpenAI + Google)
- Basic chat interface
- Settings panel
- Firebase authentication

### Known Issues
- Auth not persisting across reloads
- Dual LLM system causing confusion
- Decorative metrics (not real data)
```

### Commit Message Convention

Based on [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

#### Types

| Type | Purpose | Changelog Section | Version Bump |
|---|---|---|---|
| `feat` | New feature | Added | MINOR |
| `fix` | Bug fix | Fixed | PATCH |
| `docs` | Documentation only | — | No bump |
| `style` | Formatting, no code change | — | No bump |
| `refactor` | Code restructure, no behavior change | — | No bump |
| `perf` | Performance improvement | Changed | PATCH |
| `test` | Adding/updating tests | — | No bump |
| `chore` | Build, deps, tooling | — | No bump |
| `ci` | CI/CD changes | — | No bump |
| `build` | Build system changes | — | No bump |

#### Examples

```bash
feat(chat): add task extraction from Amoun responses
fix(auth): resolve session persistence on page reload
docs(readme): update installation instructions
style(ui): fix RTL alignment for Arabic sidebar
refactor(stores): migrate settings to Zustand persist
perf(splash): lazy load landing page images
test(analytics): add unit tests for useEventLogger
chore(deps): upgrade framer-motion to v12
ci(actions): add Lighthouse CI check
```

#### Breaking Changes

```bash
feat(api)!: change IndexedDB schema format

BREAKING CHANGE: IndexedDB schema has changed. Migration script 
will run automatically, but v0.x data may not fully migrate.
```

The `!` after type indicates a breaking change.

---

## Breaking Change Policy

### What Constitutes a Breaking Change

| Category | Breaking? | Example |
|---|---|---|
| IndexedDB schema change | ✅ Yes | New store, renamed key, changed data format |
| Store interface change | ✅ Yes | Removed method, changed parameter type |
| Component prop removal | ✅ Yes | Removed required prop from public component |
| View removal | ✅ Yes | Removed Settings sub-view users bookmark |
| API endpoint change | ✅ Yes | Changed request/response format |
| Default behavior change | ✅ Yes | Changed default model, default theme |
| CSS class rename | ❌ No | Internal Tailwind classes (not public API) |
| Internal refactor | ❌ No | If behavior is preserved |
| New feature addition | ❌ No | Always backward compatible |
| Bug fix (behavior change) | ⚠️ Maybe | If it changes expected behavior significantly |

### Breaking Change Process

1. **Identify**: Developer recognizes a breaking change during feature development
2. **Document**: Add `BREAKING CHANGE` footer to commit message
3. **Version**: Bump MAJOR version
4. **Migration**: Provide migration script or guide
5. **Communicate**: Add prominent notice in CHANGELOG and release notes
6. **Test**: Verify migration works from previous version

### IndexedDB Migration Strategy

```typescript
// db.ts — IndexedDB version management
const DB_VERSION = 3; // Increment for schema changes

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wazeer_os_db', DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      if (oldVersion < 1) {
        // v0.x → v1.0.0: Initial schema
        createStores(db);
      }
      
      if (oldVersion < 2) {
        // v1.x → v2.0.0: Schema change
        migrateV1toV2(db);
      }
      
      if (oldVersion < 3) {
        // v2.x → v3.0.0: Future migration
        migrateV2toV3(db);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function migrateV1toV2(db: IDBDatabase): void {
  // Example: Rename 'chatHistory' store to 'conversations'
  // and add 'eventLog' store
  
  if (!db.objectStoreNames.contains('conversations')) {
    const conversations = db.createObjectStore('conversations', { keyPath: 'id' });
    conversations.createIndex('timestamp', 'timestamp', { unique: false });
  }
  
  if (!db.objectStoreNames.contains('eventLog')) {
    db.createObjectStore('eventLog', { keyPath: 'id' });
  }
  
  // Migrate data from old stores to new
  const tx = db.transaction(['chatHistory', 'conversations'], 'readwrite');
  const oldStore = tx.objectStore('chatHistory');
  const newStore = tx.objectStore('conversations');
  
  oldStore.openCursor().onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      newStore.put({
        ...cursor.value,
        id: cursor.value.id || crypto.randomUUID(),
      });
      cursor.continue();
    }
  };
}
```

---

## Current Version

| Field | Value |
|---|---|
| **Version** | `2.0.0-Rewrite` |
| **SemVer** | `2.0.0` |
| **Prerelease** | `Rewrite` (suffix for branding) |
| **Codename** | "The Awakening" (الصحوة) |
| **Status** | Active development → Alpha |
| **Release Date** | Q1 2025 (target) |
| **Branch** | `develop` |
| **Previous** | `0.2.0` |

### Why "Rewrite"?

The `-Rewrite` suffix indicates this is a **complete codebase rewrite** from v0.x. It's not a semver prerelease identifier — it's a branding suffix that communicates the magnitude of change to users. In package.json, the version is `2.0.0`.

---

## Version History

| Version | Date | Codename | Summary |
|---|---|---|---|
| `0.1.0` | 2024-03 | — | Initial prototype: basic chat, single model |
| `0.2.0` | 2024-06 | — | Dual LLM (OpenAI + Google), settings, auth |
| `2.0.0-Rewrite` | 2025-01 Q1 | "The Awakening" (الصحوة) | Complete rewrite: React 19, Vite 6, Tailwind 4, Amoun, Egyptian Cyberpunk |
| `2.1.0` | 2025-02 Q1 (planned) | — | Hermes agent, advanced search, voice input |
| `2.2.0` | 2025-03 Q1 (planned) | — | 7orus full implementation, swarm improvements |
| `3.0.0` | 2025 Q2 (planned) | TBD | Major: Collaborative features, API platform |

### Future Version Planning

| Version | Tentative Features |
|---|---|
| 2.1.0 | Hermes coding agent, voice STT, advanced search, file management |
| 2.2.0 | 7orus full HorusGuard, swarm orchestration, workspace management |
| 2.3.0 | Plugin system, custom agent creation, advanced templates |
| 3.0.0 | Collaboration, shared workspaces, API for extensions, cloud sync (optional) |

---

*Document 𓂀 Wazeer OS Versioning Policy v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
