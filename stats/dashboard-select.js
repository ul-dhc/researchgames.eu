/* Shared select-only combobox. Original selects remain the data/filter interface. */
(function () {
  'use strict';
  if (window.RGDashboardSelect) return;
  const widgets = new Map();
  let opened = null, serial = 0;
  const fold = text => text.trim().toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  function enhance(select) {
    if (widgets.has(select) || select.multiple || select.size > 1) return;
    const id = 'rg-select-' + (++serial);
    const wrapper = document.createElement('span');
    wrapper.className = select.className + ' rg-select';
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.id = id + '-trigger';
    trigger.className = 'rg-select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', id + '-list');
    const value = document.createElement('span'); value.className = 'rg-select-value';
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 24 24'); arrow.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm6 9 6 6 6-6'); arrow.append(path);
    trigger.append(value, arrow);
    const list = document.createElement('div');
    list.id = id + '-list'; list.className = 'rg-select-list'; list.hidden = true;
    list.setAttribute('role', 'listbox');
    if (typeof list.showPopover === 'function') list.setAttribute('popover', 'manual');
    select.before(wrapper); wrapper.append(select, trigger); document.body.append(list);
    select.setAttribute('data-rg-native-select', '');
    let options = [], active = -1, signature = '', typed = '', typedAt = 0;
    function usable(index) { return index >= 0 && index < options.length && !options[index].disabled; }
    function position() {
      if (opened !== widget) return;
      const box = trigger.getBoundingClientRect(), gap = 6, inset = 12;
      const below = window.innerHeight - box.bottom - gap - inset;
      const above = box.top - gap - inset;
      const up = below < 160 && above > below;
      const maxHeight = Math.max(40, Math.min(320, up ? above : below));
      list.style.width = Math.min(Math.max(box.width, 190), window.innerWidth - inset * 2) + 'px';
      list.style.maxHeight = maxHeight + 'px';
      list.style.left = Math.max(inset, Math.min(box.left, window.innerWidth - list.offsetWidth - inset)) + 'px';
      list.style.top = (up ? Math.max(inset, box.top - gap - Math.min(list.scrollHeight, maxHeight)) : box.bottom + gap) + 'px';
    }
    function highlight(index, scroll = true) {
      if (!usable(index)) return;
      active = index;
      Array.from(list.children).forEach((node, i) => node.dataset.active = String(i === active));
      trigger.setAttribute('aria-activedescendant', id + '-option-' + active);
      if (scroll) list.children[active]?.scrollIntoView({block:'nearest'});
    }
    function close(focus = false) {
      if (opened !== widget) return;
      if (typeof list.hidePopover === 'function' && list.matches(':popover-open')) list.hidePopover();
      list.hidden = true; opened = null;
      trigger.setAttribute('aria-expanded', 'false'); trigger.removeAttribute('aria-activedescendant');
      if (focus) trigger.focus();
    }
    function sync() {
      const label = select.getAttribute('aria-label') || Array.from(select.labels || []).map(node => node.textContent.trim()).join(' ') || select.name || select.id;
      trigger.setAttribute('aria-label', label); list.setAttribute('aria-label', label);
      if (select.getAttribute('aria-labelledby')) trigger.setAttribute('aria-labelledby', select.getAttribute('aria-labelledby'));
      else trigger.removeAttribute('aria-labelledby');
      if (select.getAttribute('aria-describedby')) trigger.setAttribute('aria-describedby', select.getAttribute('aria-describedby'));
      else trigger.removeAttribute('aria-describedby');
      trigger.disabled = select.disabled;
      value.textContent = select.selectedOptions[0]?.textContent.trim() || '–';
      options = Array.from(select.options).map(option => ({text:option.textContent.trim(), value:option.value, disabled:option.disabled || option.hidden || (option.parentElement.tagName === 'OPTGROUP' && option.parentElement.disabled)}));
      const next = JSON.stringify(options);
      if (next !== signature) {
        signature = next; list.replaceChildren();
        options.forEach((option, index) => {
          const row = document.createElement('div'); row.id = id + '-option-' + index;
          row.className = 'rg-select-option'; row.setAttribute('role', 'option');
          if (option.disabled) row.setAttribute('aria-disabled', 'true');
          const check = document.createElement('span'); check.className = 'rg-select-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
          const label = document.createElement('span'); label.textContent = option.text;
          row.append(check, label);
          row.addEventListener('pointermove', () => highlight(index, false));
          row.addEventListener('mousedown', event => event.preventDefault());
          row.addEventListener('click', () => choose(index));
          list.append(row);
        });
      }
      Array.from(list.children).forEach((row, index) => row.setAttribute('aria-selected', String(index === select.selectedIndex)));
      if (opened === widget) {
        if (select.disabled || !options.some((_, index) => usable(index))) close();
        else { highlight(usable(active) ? active : options.findIndex((_, index) => usable(index)), false); position(); }
      }
    }
    function open() {
      sync();
      if (trigger.disabled || !options.some((_, index) => usable(index))) return;
      opened?.close(); opened = widget; typed = '';
      list.hidden = false;
      if (typeof list.showPopover === 'function') list.showPopover();
      trigger.setAttribute('aria-expanded', 'true');
      position(); highlight(usable(select.selectedIndex) ? select.selectedIndex : options.findIndex((_, index) => usable(index)));
    }
    function choose(index) {
      if (!usable(index)) return;
      const changed = select.selectedIndex !== index;
      select.selectedIndex = index;
      close(true); sync();
      if (changed) { select.dispatchEvent(new Event('input', {bubbles:true})); select.dispatchEvent(new Event('change', {bubbles:true})); }
    }
    function move(direction) {
      let index = active + direction;
      while (index >= 0 && index < options.length) { if (usable(index)) { highlight(index); return; } index += direction; }
    }
    trigger.addEventListener('click', () => opened === widget ? close() : open());
    trigger.addEventListener('keydown', event => {
      if (['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(event.key)) {
        event.preventDefault();
        if (event.key === 'Escape') { close(); return; }
        if (event.key === 'Enter' || event.key === ' ') { if (opened === widget) choose(active); else open(); return; }
        const wasOpen = opened === widget;
        if (!wasOpen) open();
        if (event.key === 'Home') highlight(options.findIndex((_, index) => usable(index)));
        else if (event.key === 'End') { for (let index = options.length - 1; index >= 0; index--) if (usable(index)) { highlight(index); break; } }
        else if (wasOpen) move(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Tab') close();
      else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        if (opened !== widget) open();
        const now = Date.now(); typed = now - typedAt > 700 ? event.key : typed + event.key; typedAt = now;
        const search = fold(Array.from(typed).every(char => char === typed[0]) ? typed[0] : typed);
        for (let offset = 1; offset <= options.length; offset++) {
          const index = (active + offset) % options.length;
          if (usable(index) && fold(options[index].text).startsWith(search)) { highlight(index); break; }
        }
      }
    });
    const widget = {select, trigger, list, sync, close, position}; widgets.set(select, widget);
    select.addEventListener('change', sync); select.addEventListener('input', sync);
    new MutationObserver(sync).observe(select, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','hidden','selected','value','label','aria-label','aria-labelledby','aria-describedby']});
    sync();
  }
  function syncAll() {
    if (getComputedStyle(document.documentElement).getPropertyValue('--rg-select-ready').trim() !== '1') return;
    document.querySelectorAll('select').forEach(enhance);
    widgets.forEach(widget => widget.sync());
  }
  document.addEventListener('pointerdown', event => { if (opened && !opened.trigger.contains(event.target) && !opened.list.contains(event.target)) opened.close(); });
  document.addEventListener('click', event => {
    if (event.target instanceof Element) {
      const label = event.target.closest('label');
      if (label?.control && widgets.has(label.control)) { event.preventDefault(); widgets.get(label.control).trigger.focus(); }
    }
    queueMicrotask(syncAll);
  });
  document.addEventListener('reset', () => setTimeout(syncAll, 0));
  window.addEventListener('resize', () => opened?.position());
  window.addEventListener('scroll', event => { if (opened && !opened.list.contains(event.target)) opened.close(); }, true);
  document.addEventListener('focusin', event => { if (opened && event.target !== opened.trigger && !opened.list.contains(event.target)) opened.close(); });
  new MutationObserver(() => queueMicrotask(syncAll)).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  window.RGDashboardSelect = {sync:syncAll};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncAll, {once:true}); else syncAll();
})();
