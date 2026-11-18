# PokéPoly Security Specification

## 1. Data Invariants
1. A `UserProfile` at `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId` and `email_verified == true`.
2. A `CloudSave` at `/users/{userId}/cloudSaves/{saveId}` must belong to an existing `/users/{userId}` parent document (`exists(...)` Master Gate) and have `ownerId == request.auth.uid`.
3. A `MatchRecord` at `/users/{userId}/matchHistory/{matchId}` is append-only (immutable once created) and requires an existing `/users/{userId}` parent document.
4. A `LeaderboardEntry` at `/leaderboard/{userId}` contains zero PII (no email, phone, address), can be read/listed by signed-in users when `score >= 0`, and can only be created/updated by `request.auth.uid == userId` with verified email.
5. All timestamps (`createdAt`, `updatedAt`) are strictly verified against `request.time`, and `createdAt` and ownership fields (`uid`, `ownerId`) are immutable after creation.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Read**: Read `/users/u1` with `auth == null` -> PERMISSION_DENIED.
2. **Cross-User Profile Read**: User `u2` reads `/users/u1` -> PERMISSION_DENIED.
3. **Unverified Email Write**: User `u1` with `email_verified: false` writes `/users/u1` -> PERMISSION_DENIED.
4. **Identity Spoofing on Create**: User `u1` creates `/leaderboard/u1` with `uid: "u2"` -> PERMISSION_DENIED.
5. **Shadow Field Injection**: User `u1` updates `/users/u1` adding `isAdmin: true` -> PERMISSION_DENIED.
6. **ID Poisoning**: User `u1` creates `/users/u1/cloudSaves/bad$id!@#` -> PERMISSION_DENIED.
7. **Orphaned Subcollection Write**: User `u1` creates `/users/u1/cloudSaves/slot1` before `/users/u1` exists -> PERMISSION_DENIED.
8. **Client-Spoofed Timestamp**: User `u1` creates `/leaderboard/u1` with `createdAt: 2020-01-01` instead of `request.time` -> PERMISSION_DENIED.
9. **Immutable Field Tampering**: User `u1` updates `/leaderboard/u1` changing `createdAt` or `uid` -> PERMISSION_DENIED.
10. **Array Exhaustion**: User `u1` writes `pokedexCaught` with 100 entries (> 40 max) -> PERMISSION_DENIED.
11. **Value Poisoning**: User `u1` updates `/leaderboard/u1` setting `score: -500` or `trainerName` > 50 chars -> PERMISSION_DENIED.
12. **Match History Tampering**: User `u1` attempts to `update` an immutable `/users/u1/matchHistory/m1` record -> PERMISSION_DENIED.
