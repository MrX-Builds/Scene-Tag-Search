# Scene Tag Search 1.0.0 test results

Test date: 2026-11-02  
Target checked: local Stash v0.32.0 (`9e9ad972`)

## Automated checks

- `node --check SceneTagSearch.js`: passed.
- Headless Chrome interaction harness: passed.
- The harness verified:
  - controls appear only on a scene detail route with native scene-tag links;
  - all native scene tag chips are discovered;
  - ordinary chip clicks do not navigate;
  - two chips can be selected and visibly marked;
  - Search is disabled with no selection;
  - Match ALL emits `INCLUDES_ALL` with only the selected tag IDs;
  - Match ANY emits `INCLUDES` with only the selected tag IDs.

Run the interaction harness from the project root with:

```powershell
node .\SceneTagSearch_v1.0_source\test_scene_tag_search.cjs
```

The harness uses the installed Google Chrome executable and the project's
existing Playwright library. It operates on synthetic HTML and does not write
to Stash.

## Live read-only compatibility checks

- Read the local Stash version through GraphQL: v0.32.0.
- Queried scene `93741` (`A Slutty Guest`) read-only and confirmed the native
  page exposes 17 tag IDs matching the reference screenshot.
- Verified through read-only GraphQL counts that tags `73` and `26` produce:
  - Match ANY / `INCLUDES`: 28,497 scenes.
  - Match ALL / `INCLUDES_ALL`: 7,218 scenes.
- Opened the generated ALL URL in Stash and confirmed the native filter summary
  displayed `Tags includes all Big Tits, Blond Hair`.
- Opened the generated ANY URL in Stash and confirmed the native filter summary
  displayed `Tags includes Big Tits, Blond Hair`; 40 native scene cards rendered
  on the first page and no filter error was shown.

## Boundary

No plugin was installed into Stash during these checks. No GraphQL mutation was
sent, and no Stash scene, tag, file, setting, plugin, or other metadata was
changed. Final post-install visual coexistence with every third-party theme and
plugin remains an installation-time check.

