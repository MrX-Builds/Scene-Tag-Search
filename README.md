# Scene Tag Search

Scene Tag Search is a read-only UI plugin for [Stash](https://stashapp.cc/)
that turns the tags already attached to a scene into a multi-select search
builder.

Open a scene, select its existing tag chips, choose **Match ALL** or
**Match ANY**, and open Stash's native Scenes page with those tag IDs applied.

## Features

- Works directly under **Details -> Tags** on scene detail pages.
- Selects from the current scene's existing tags without typing or copying.
- **Match ALL** finds scenes containing every selected tag.
- **Match ANY** finds scenes containing at least one selected tag.
- Uses Stash's native tag IDs and native `/scenes` filter.
- Does not edit scene metadata, tags, files, settings, or other plugins.

## Install with Stash Plugin Manager

In Stash, open **Settings -> Plugins -> Available Plugins -> Add Source** and
add this URL:

```text
https://raw.githubusercontent.com/MrX-Builds/Scene-Tag-Search/main/index.yml
```

Reload the available plugins, find **Scene Tag Search**, and install it.

## Manual installation

1. Download `SceneTagSearch_v1.0.0.zip` from the
   [v1.0.0 release](https://github.com/MrX-Builds/Scene-Tag-Search/releases/tag/v1.0.0).
2. Extract the ZIP.
3. Copy the enclosed `SceneTagSearch` folder into the Stash plugins folder.
4. Confirm the manifest path is
   `.../plugins/SceneTagSearch/SceneTagSearch.yml`.
5. In Stash, select **Settings -> Plugins -> Reload plugins**.
6. Refresh the browser page.

## Usage

1. Open a scene and select the **Details** tab.
2. Click one or more existing tag chips. Selected chips turn pink.
3. Choose **Match ALL** or **Match ANY**.
4. Select the Search button.

Click a selected chip again to remove it. **Clear** resets the selection.
Changing scenes also resets it.

## Read-only boundary

Scene Tag Search only changes temporary browser UI state and navigates to a
native Stash scene-filter URL. It sends no GraphQL mutations and does not
create, edit, delete, tag, organize, or otherwise modify Stash metadata.

## Compatibility and testing

Version 1.0.0 was built and checked against Stash v0.32.0. Automated tests
cover multi-selection, navigation prevention, visible selection, and correct
ALL/ANY URL generation. Both generated filters were also accepted by a live
Stash v0.32.0 instance.

Stash's UI plugin API is experimental, so future Stash interface changes may
require compatibility updates.

## License

MIT

