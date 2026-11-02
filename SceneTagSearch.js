/*
  Scene Tag Search v1.0.0

  On a Stash scene details page, the native tag chips become a read-only
  multi-select search composer. The plugin reads tag IDs from Stash's own
  native tag-filter links and navigates to Stash's native /scenes filter.

  It performs no GraphQL mutations and never edits scene metadata.
*/
(function () {
  'use strict';

  const PLUGIN = 'SceneTagSearch';
  const CONTROL_ID = 'scene-tag-search-controls';
  const CHIP_CLASS = 'scene-tag-search-chip';
  const SELECTED_CLASS = 'scene-tag-search-selected';
  const boundContainers = new WeakSet();

  let currentSceneId = null;
  let selectedIds = new Set();
  let mode = 'ALL';
  let refreshQueued = false;

  function sceneIdFromPath() {
    const match = location.pathname.match(/^\/scenes\/(\d+)(?:\/|$)/);
    return match ? match[1] : null;
  }

  function findTagsHeading() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const heading of headings) {
      if (heading.textContent.trim() !== 'Tags') continue;
      const container = heading.parentElement;
      if (!container) continue;
      const hasNativeTagLink = Array.from(container.querySelectorAll('a[href]')).some(anchor =>
        isNativeTagSearchLink(anchor.getAttribute('href'))
      );
      if (hasNativeTagLink) return heading;
    }
    return null;
  }

  function isNativeTagSearchLink(href) {
    if (!href) return false;
    try {
      const url = new URL(href, location.origin);
      if (url.origin !== location.origin || url.pathname !== '/scenes') return false;
      const criterion = url.searchParams.get('c') || '';
      return /["']type["']\s*:\s*["']tags["']/.test(criterion);
    } catch (_) {
      return false;
    }
  }

  function tagFromNativeLink(anchor) {
    const href = anchor.getAttribute('href');
    if (!isNativeTagSearchLink(href)) return null;

    try {
      const criterion = new URL(href, location.origin).searchParams.get('c') || '';
      const idMatch = criterion.match(/["']id["']\s*:\s*["'](\d+)["']/);
      if (!idMatch) return null;
      const chip = anchor.closest('.tag-item') || anchor.parentElement;
      const label = (chip && chip.getAttribute('data-sort-name')) || anchor.textContent.trim();
      if (!label) return null;
      return { id: idMatch[1], label: label, anchor: anchor, chip: chip || anchor };
    } catch (_) {
      return null;
    }
  }

  function collectTags(heading) {
    const tags = [];
    let node = heading.nextElementSibling;
    while (node && !/^H[1-6]$/.test(node.tagName)) {
      const anchors = node.matches && node.matches('a[href]')
        ? [node]
        : Array.from(node.querySelectorAll ? node.querySelectorAll('a[href]') : []);
      for (const anchor of anchors) {
        const tag = tagFromNativeLink(anchor);
        if (tag && !tags.some(existing => existing.id === tag.id)) tags.push(tag);
      }
      node = node.nextElementSibling;
    }
    return tags;
  }

  function encodeCriterion(tags) {
    const modifier = mode === 'ANY' ? 'INCLUDES' : 'INCLUDES_ALL';
    const items = tags.map(tag =>
      '("id":"' + tag.id + '","label":"' + escapeRisonString(tag.label) + '")'
    ).join(',');
    const criterion =
      '("type":"tags","modifier":"' + modifier + '","value":(' +
      '"items":[' + items + '],"excluded":[],"depth":0))';
    return encodeURIComponent(criterion);
  }

  function escapeRisonString(value) {
    // Tag labels observed in Stash's native filter links are JSON-style quoted.
    // Escape the only characters that can end or alter that quoted value.
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function makeButton(text, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    return button;
  }

  function buildControls(heading) {
    const existing = document.getElementById(CONTROL_ID);
    if (existing) return existing;

    const controls = document.createElement('div');
    controls.id = CONTROL_ID;
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Scene Tag Search');

    const title = document.createElement('span');
    title.className = 'scene-tag-search-title';
    title.textContent = 'Scene Tag Search';

    const modes = document.createElement('span');
    modes.className = 'scene-tag-search-modes';
    modes.setAttribute('role', 'group');
    modes.setAttribute('aria-label', 'Tag matching mode');

    const allButton = makeButton('Match ALL', 'btn btn-sm btn-secondary scene-tag-search-mode');
    allButton.dataset.mode = 'ALL';
    const anyButton = makeButton('Match ANY', 'btn btn-sm btn-secondary scene-tag-search-mode');
    anyButton.dataset.mode = 'ANY';
    modes.append(allButton, anyButton);

    const status = document.createElement('span');
    status.className = 'scene-tag-search-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const clearButton = makeButton('Clear', 'btn btn-sm btn-secondary scene-tag-search-clear');
    const searchButton = makeButton('Search selected tags', 'btn btn-sm btn-primary scene-tag-search-search');

    controls.append(title, modes, status, clearButton, searchButton);
    heading.insertAdjacentElement('afterend', controls);

    controls.addEventListener('click', event => {
      const modeButton = event.target.closest('.scene-tag-search-mode');
      if (modeButton) {
        mode = modeButton.dataset.mode === 'ANY' ? 'ANY' : 'ALL';
        updateUi(heading);
        return;
      }

      if (event.target.closest('.scene-tag-search-clear')) {
        selectedIds.clear();
        updateUi(heading);
        return;
      }

      if (event.target.closest('.scene-tag-search-search')) {
        searchSelected(heading);
      }
    });

    return controls;
  }

  function bindTagClicks(heading) {
    const container = heading.parentElement;
    if (!container || boundContainers.has(container)) return;
    boundContainers.add(container);

    container.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const chip = event.target.closest('.' + CHIP_CLASS);
      if (!chip || !container.contains(chip)) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

      const id = chip.dataset.sceneTagSearchId;
      if (!id) return;
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
      updateUi(heading);
    }, true);
  }

  function searchSelected(heading) {
    const chosen = collectTags(heading).filter(tag => selectedIds.has(tag.id));
    if (!chosen.length) return;
    const url = '/scenes?c=' + encodeCriterion(chosen) + '&sortby=date';
    // Use normal same-tab navigation so Stash receives exactly the native URL
    // shape it already emits for tag chips.
    location.assign(url);
  }

  function updateUi(heading) {
    const tags = collectTags(heading);
    const available = new Set(tags.map(tag => tag.id));
    selectedIds = new Set(Array.from(selectedIds).filter(id => available.has(id)));

    for (const tag of tags) {
      tag.chip.classList.add(CHIP_CLASS);
      tag.chip.classList.toggle(SELECTED_CLASS, selectedIds.has(tag.id));
      tag.chip.dataset.sceneTagSearchId = tag.id;
      tag.anchor.setAttribute('aria-pressed', selectedIds.has(tag.id) ? 'true' : 'false');
      tag.anchor.setAttribute('title',
        (selectedIds.has(tag.id) ? 'Remove ' : 'Select ') + tag.label + ' for Scene Tag Search'
      );
    }

    const controls = buildControls(heading);
    const status = controls.querySelector('.scene-tag-search-status');
    const searchButton = controls.querySelector('.scene-tag-search-search');
    const clearButton = controls.querySelector('.scene-tag-search-clear');

    controls.querySelectorAll('.scene-tag-search-mode').forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.mode === mode ? 'true' : 'false');
    });

    const count = selectedIds.size;
    status.textContent = count
      ? count + ' tag' + (count === 1 ? '' : 's') + ' selected'
      : 'Select one or more tag chips';
    searchButton.disabled = count === 0;
    clearButton.disabled = count === 0;
    searchButton.textContent = count
      ? 'Search ' + mode + ' (' + count + ')'
      : 'Search selected tags';
  }

  function removeStaleControls() {
    const controls = document.getElementById(CONTROL_ID);
    if (controls) controls.remove();
    document.querySelectorAll('.' + CHIP_CLASS).forEach(chip => {
      chip.classList.remove(CHIP_CLASS, SELECTED_CLASS);
      delete chip.dataset.sceneTagSearchId;
      const anchor = chip.querySelector('a[aria-pressed]');
      if (anchor) {
        anchor.removeAttribute('aria-pressed');
        anchor.removeAttribute('title');
      }
    });
  }

  function refresh() {
    refreshQueued = false;
    const sceneId = sceneIdFromPath();
    if (sceneId !== currentSceneId) {
      currentSceneId = sceneId;
      selectedIds.clear();
      mode = 'ALL';
      removeStaleControls();
    }
    if (!sceneId) {
      removeStaleControls();
      return;
    }

    const heading = findTagsHeading();
    if (!heading) return;
    buildControls(heading);
    bindTagClicks(heading);
    updateUi(heading);
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    window.requestAnimationFrame(refresh);
  }

  const observer = new MutationObserver(queueRefresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', queueRefresh);
  window.addEventListener('hashchange', queueRefresh);

  // Newer Stash builds expose a location event to UI plugins. The fallback
  // polling below also supports builds/themes where that API is unavailable.
  try {
    if (window.PluginApi && window.PluginApi.Event) {
      window.PluginApi.Event.addEventListener('stash:location', queueRefresh);
    }
  } catch (error) {
    console.warn('[' + PLUGIN + '] Could not attach stash:location listener:', error);
  }

  queueRefresh();
  window.setInterval(queueRefresh, 1000);
})();

