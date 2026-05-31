import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface GeocodedLocation {
  displayName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  suburb?: string;
  state?: string;
  state_district?: string;
  country?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

const normalize = (r: NominatimResult): GeocodedLocation => {
  const a = r.address || {};
  const streetParts = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean);
  return {
    displayName: r.display_name,
    address: streetParts.join(' '),
    city: a.city || a.town || a.village || a.municipality || a.suburb || a.county || '',
    state: a.state || a.state_district || '',
    country: a.country || '',
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  };
};

interface Props {
  value: GeocodedLocation | null;
  onSelect: (loc: GeocodedLocation | null) => void;
  label?: string;
  placeholder?: string;
}

export interface LocationSearchHandle {
  searchFor: (query: string) => void;
  clear: () => void;
  focus: () => void;
}

export const LocationSearch = forwardRef<LocationSearchHandle, Props>(({
  value,
  onSelect,
  label = 'Property Location',
  placeholder = 'Search address, city, or landmark…',
}, ref) => {
  const [query, setQuery] = useState(value?.displayName || '');
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value === null && query !== '') {
      // Parent cleared selection — also clear input
      setQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMsg('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept-Language': navigator.language || 'en' },
      });
      if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
      const data: NominatimResult[] = await res.json();
      const normalized = data.map(normalize);
      setResults(normalized);
      setOpen(true);
      setActiveIdx(-1);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('LocationSearch error:', err);
      setErrorMsg('Lookup failed — check your connection');
      setResults([]);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (value) onSelect(null);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchResults(v), 500);
  };

  const handleSelect = (loc: GeocodedLocation) => {
    onSelect(loc);
    setQuery(loc.displayName);
    setOpen(false);
    setResults([]);
  };

  const clearSelection = () => {
    onSelect(null);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  useImperativeHandle(ref, () => ({
    searchFor: (q: string) => {
      setQuery(q);
      if (value) onSelect(null);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      fetchResults(q);
      inputRef.current?.focus();
    },
    clear: clearSelection,
    focus: () => inputRef.current?.focus(),
  }), [value, onSelect, fetchResults]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10px] uppercase font-black text-outline tracking-wider ml-1 block mb-1.5">
        {label}
      </label>
      <div className="flex items-center bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg focus-within:ring-2 focus-within:ring-surface-tint/20 transition-all">
        <span className="material-symbols-outlined text-outline pl-3">search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => { if (results.length > 0 || errorMsg) setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none text-sm text-on-surface py-3 px-3 outline-none placeholder-outline/50"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && (
          <span className="material-symbols-outlined text-tertiary text-sm pr-3 animate-spin">progress_activity</span>
        )}
        {!loading && value && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-outline hover:text-on-surface pr-3 transition-colors"
            aria-label="Clear selection"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {value && (
        <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-tertiary/5 border border-tertiary/20 rounded-lg">
          <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">check_circle</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-tertiary font-bold uppercase tracking-wider">Location confirmed</p>
            <p className="text-xs text-on-surface mt-0.5 truncate">
              {[value.address, value.city, value.state, value.country].filter(Boolean).join(', ')}
            </p>
            <p className="text-[10px] text-outline mt-0.5 font-mono">
              {value.lat.toFixed(4)}°, {value.lng.toFixed(4)}°
            </p>
          </div>
        </div>
      )}

      {open && (results.length > 0 || errorMsg) && (
        <div className="absolute top-[68px] left-0 right-0 bg-surface-container-highest border border-outline-variant/20 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
          {errorMsg ? (
            <p className="px-4 py-3 text-error text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span> {errorMsg}
            </p>
          ) : (
            <>
              {results.map((r, i) => {
                const primary = r.address || r.city || r.displayName.split(',')[0];
                const secondary = [r.city, r.state, r.country].filter(Boolean).join(' • ') || 'No location data';
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full text-left px-4 py-3 transition-colors border-b border-outline-variant/5 last:border-0 ${
                      activeIdx === i ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <p className="text-sm font-semibold text-on-surface line-clamp-1">{primary}</p>
                    <p className="text-xs text-outline line-clamp-1 mt-0.5">{r.displayName}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-outline">
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>location_on</span>
                      {secondary}
                    </div>
                  </button>
                );
              })}
              <p className="px-4 py-2 text-[9px] text-outline border-t border-outline-variant/10 bg-surface-container-low/30">
                Powered by OpenStreetMap • Nominatim
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
});

LocationSearch.displayName = 'LocationSearch';
