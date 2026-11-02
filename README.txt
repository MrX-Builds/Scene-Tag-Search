Scene Tag Search 1.0.0 for Stash
================================

Scene Tag Search turns the tags already shown on every Stash scene details
page into a multi-select search composer. Select the tags that matter for the
next search, choose Match ALL or Match ANY, and open Stash's native Scenes page
with those tag IDs applied.

FEATURES
- Works directly in Details -> Tags on scene detail pages.
- Selects from the current scene's existing tag chips; no typing or copying.
- Match ALL finds scenes containing every selected tag.
- Match ANY finds scenes containing at least one selected tag.
- Uses Stash tag IDs parsed from Stash's own native tag-filter links.
- Opens the native /scenes filter, so normal sorting, paging, cards and saved
  Stash behavior continue to apply.
- Makes no GraphQL mutations and does not edit metadata, files, settings or
  other plugins.

INSTALLATION
1. Extract SceneTagSearch_v1.0.0.zip.
2. Copy the enclosed SceneTagSearch folder into the Stash plugins folder.
   The final manifest path must be:
   .../plugins/SceneTagSearch/SceneTagSearch.yml
3. In Stash, open Settings -> Plugins and select Reload plugins.
4. Refresh the Stash browser page.

USAGE
1. Open any scene detail page and leave the Details tab selected.
2. Under Tags, click one or more existing tag chips. Selected chips turn pink.
3. Choose Match ALL or Match ANY.
4. Click Search ALL (n) or Search ANY (n).
5. Stash opens its native Scenes page with the chosen tag IDs in the filter.

Click a selected chip again to remove it. Clear removes the complete selection.
Changing to another scene resets the selection.

Modified clicks (Ctrl, Command, Shift or Alt) are left to the browser/Stash.
This allows advanced users to retain normal link behavior in cases where their
browser or platform assigns an action to that modified click.

READ-ONLY BOUNDARY
The plugin only changes temporary browser UI state and navigates to a native
Stash scene-filter URL. It never creates, edits, deletes, tags, organizes or
otherwise mutates Stash metadata. It does not replace Stash tag chips or alter
other plugin files.

COMPATIBILITY
- Built and checked against a live Stash v0.32.0 interface.
- Uses current native scene filter modifiers: INCLUDES_ALL for Match ALL and
  INCLUDES for Match ANY.
- The UI plugin API and Stash markup are experimental and may change. The plugin
  locates the Tags section semantically, reads IDs from native links, and uses
  a polling fallback to reduce dependence on internal React component names.

REMOVE
Delete the SceneTagSearch plugin folder, reload plugins, and refresh Stash.

FILES
- SceneTagSearch.yml: Stash plugin manifest.
- SceneTagSearch.js: behavior and native filter URL construction.
- SceneTagSearch.css: controls and selected-chip styling.
- README.txt: installation, use and boundaries.
- CHANGELOG.txt: release history.
- LICENSE.txt: MIT license.

