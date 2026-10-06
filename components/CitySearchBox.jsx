'use client';

// ─────────────────────────────────────────────────────────────
//  Navbar ka shehar search — desktop aur mobile dono (UX fixes A + B).
//  ARIA combobox: ↑ ↓ se chuno, Enter se search, Esc se list band.
//  Suggestions: useCitySuggest (local fuzzy pehle, phir API).
//  Search ke baad input khaali + blur (pehle jaisa).
// ─────────────────────────────────────────────────────────────
import { useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import useCitySuggest from '@/hooks/useCitySuggest';

export default function CitySearchBox({ onSubmit, inputClassName, label = 'Search city or zip code' }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const listId = useId();
  const { items, didYouMean } = useCitySuggest(value);
  const showList = open && items.length > 0;

  const finish = (text, item) => {
    if (!text.trim()) return;
    onSubmit(text.trim(), item || null);
    setValue('');
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i < items.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i > 0 ? i - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showList && active >= 0 && items[active]) finish(items[active].name, items[active]);
      else finish(value, null);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <MapPin className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Search city or zip code"
        className={inputClassName}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="City suggestions"
          className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-[#d6e4ff] rounded-2xl shadow-lg overflow-hidden py-1"
        >
          {didYouMean && (
            <li role="presentation" className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500">
              Did you mean…?
            </li>
          )}
          {items.map((s, i) => (
            <li
              key={s.slug || `${s.name}-${s.country}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown par blur na ho — warna click se pehle list band
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => finish(s.name, s)}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-2 px-4 min-h-11 text-sm cursor-pointer transition-colors ${
                i === active ? 'bg-[#f0f5ff] text-[#0077b6]' : 'text-gray-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="font-semibold truncate">{s.name}</span>
              <span className="text-xs text-gray-400 ml-auto shrink-0">{s.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
