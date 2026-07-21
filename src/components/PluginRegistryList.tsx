import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';

const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface SummaryInfo {
  text: string;
  count: number;
  colorclass: string;
}

interface PluginMetadata {
  description?: string;
  author?: string;
  version?: string;
  release_date?: string;
}

interface PluginEntryPointVal {
  class?: string;
  description?: string[];
  spec?: unknown;
}

export interface PluginRecord {
  name: string;
  package_name?: string;
  code_home: string;
  documentation_url?: string;
  pip_install_cmd?: string;
  development_status: string;
  entry_point_prefix?: string;
  aiida_version?: string;
  commits_count?: number;
  is_installable?: string;
  metadata: PluginMetadata;
  summaryinfo?: SummaryInfo[];
  entry_points?: Record<string, Record<string, PluginEntryPointVal | string>>;
}

type StatusDict = Record<string, [string, string]>;

interface Props {
  plugins: Record<string, PluginRecord>;
  statusDict: StatusDict;
}

type SortMode = 'release' | 'commits' | 'alpha';

const SORT_LABELS: Record<SortMode, string> = {
  release: 'Recent release',
  commits: 'Yearly commits',
  alpha: 'Alphabetical',
};

function splitOther(text: string): { label: string; tooltip?: string } {
  const m = text.match(/^Other\s*\(([^)]*)\)\s*$/);
  return m ? { label: 'Other', tooltip: m[1].trim() } : { label: text };
}

/* Upstream encodes status colours as hex in SVG filenames; we map the well-known
   keys to our colour palette instead so the badges fit our theme. */
const STATUS_COLOR: Record<string, string> = {
  planning: 'red',
  'pre-alpha': 'red',
  alpha: 'orange',
  beta: 'yellow',
  stable: 'green',
  mature: 'brightgreen',
  inactive: 'gray',
};

function statusTooltip(statusKey: string, dict: StatusDict): string {
  return dict[statusKey]?.[0] ?? statusKey;
}

function statusColorClass(statusKey: string): string {
  return STATUS_COLOR[statusKey] ?? 'gray';
}

function sortPlugins(plugins: Record<string, PluginRecord>, mode: SortMode): [string, PluginRecord][] {
  const entries = Object.entries(plugins);
  if (mode === 'alpha') {
    return entries.sort(([a], [b]) => a.localeCompare(b));
  }
  if (mode === 'commits') {
    return entries.sort(([, a], [, b]) => (b.commits_count ?? 0) - (a.commits_count ?? 0));
  }
  /* release */
  return entries.sort(([, a], [, b]) => {
    const da = a.metadata?.release_date;
    const db = b.metadata?.release_date;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return new Date(db).getTime() - new Date(da).getTime();
  });
}

/* Build the Fuse index lazily — searching across all plugins + entry points
   is expensive on a 1.4 MB blob, so we defer it until the user starts typing. */
function buildFuse(plugins: Record<string, PluginRecord>): Fuse<PluginRecord> {
  const list: PluginRecord[] = [];
  for (const [, p] of Object.entries(plugins)) {
    /* Flatten entry-point payloads into a searchable string per plugin. */
    const epStrings: string[] = [];
    if (p.entry_points) {
      for (const [group, eps] of Object.entries(p.entry_points)) {
        for (const [name, val] of Object.entries(eps)) {
          epStrings.push(`${group}.${name}`);
          if (typeof val === 'object' && val) {
            if (val.class) epStrings.push(val.class);
            if (Array.isArray(val.description)) epStrings.push(...val.description);
          }
        }
      }
    }
    list.push({ ...p, _ep: epStrings.join(' ') } as PluginRecord & { _ep: string });
  }
  return new Fuse(list, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'metadata.description', weight: 1.5 },
      { name: 'entry_point_prefix', weight: 1 },
      { name: 'metadata.author', weight: 0.5 },
      { name: '_ep', weight: 1 },
    ],
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.35,
    minMatchCharLength: 2,
  });
}

function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="reg-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5" />
      <line x1="11" y1="11" x2="14.5" y2="14.5" />
    </svg>
  );
}

function CheckIcon() {
  /* Filled green circle with white check — mirrors the original aiida-registry
     MUI <CheckCircleIcon> so the "installable" indicator stays a single, bold
     glyph instead of a labelled pill. */
  return (
    <svg
      className="reg-installable-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <polyline
        points="6.5 12.5 10.5 16.5 17.5 8.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AiidaLogo() {
  /* Multi-coloured AiiDA glyph from the upstream registry. Shipped as a
     real asset under public/plugin-registry/ rather than a data URL so the
     bytes round-trip cleanly. */
  return (
    <img
      src={`${base}/plugin-registry/aiida-logo.png`}
      alt=""
      width="15"
      height="15"
      className="reg-badge-logo"
    />
  );
}

export default function PluginRegistryList({ plugins, statusDict }: Props): ReactNode {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('release');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const fuseRef = useRef<Fuse<PluginRecord> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function getFuse(): Fuse<PluginRecord> {
    if (!fuseRef.current) fuseRef.current = buildFuse(plugins);
    return fuseRef.current;
  }

  /* Single Fuse pass per keystroke — visibleEntries and suggestions both derive from this. */
  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    return getFuse().search(trimmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, plugins]);

  const visibleEntries = useMemo(() => {
    if (!searchResults) return sortPlugins(plugins, sortMode);
    /* Preserve Fuse's score-based ordering when searching. */
    return searchResults.slice(0, 200).map(r => [r.item.name, r.item] as [string, PluginRecord]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, sortMode, plugins]);

  const suggestions = useMemo(() => {
    if (!searchResults) return [] as { name: string; description: string }[];
    return searchResults.slice(0, 6).map(r => ({
      name: r.item.name,
      description: r.item.metadata?.description ?? '',
    }));
  }, [searchResults]);

  /* Keep activeSuggestion within bounds when results shrink as the user types. */
  const clampedActive = Math.min(activeSuggestion, Math.max(0, suggestions.length - 1));

  /* Close suggestions on outside click */
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const s = suggestions[clampedActive];
      if (s) {
        window.location.href = `${base}/plugin-registry/${encodeURIComponent(s.name)}/`;
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(0);
    }
  }

  return (
    <>
      <div className="reg-toolbar">
        <div className="reg-search" ref={wrapRef}>
          <SearchIcon />
          <input
            type="text"
            className="reg-search-input"
            placeholder="Search plugins, entry points, authors…"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true); setActiveSuggestion(0); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={onKeyDown}
            aria-label="Search plugins"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="reg-suggestions-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              showSuggestions && suggestions.length > 0
                ? `reg-sg-${clampedActive}`
                : undefined
            }
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="reg-suggestions"
              role="listbox"
              id="reg-suggestions-listbox"
              aria-label="Plugin suggestions"
            >
              {suggestions.map((s, i) => (
                <a
                  key={s.name}
                  id={`reg-sg-${i}`}
                  className="reg-suggestion"
                  href={`${base}/plugin-registry/${encodeURIComponent(s.name)}/`}
                  data-active={i === clampedActive}
                  role="option"
                  aria-selected={i === clampedActive}
                >
                  <div className="reg-suggestion-name">{highlight(s.name, query)}</div>
                  {s.description && (
                    <div className="reg-suggestion-snippet">{highlight(s.description, query)}</div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="reg-sort">
          <label htmlFor="reg-sort">Sort by</label>
          <select id="reg-sort" value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}>
            <option value="release">{SORT_LABELS.release}</option>
            <option value="commits">{SORT_LABELS.commits}</option>
            <option value="alpha">{SORT_LABELS.alpha}</option>
          </select>
        </div>
      </div>

      <p className="reg-results-count">
        {query.trim()
          ? `${visibleEntries.length} match${visibleEntries.length === 1 ? '' : 'es'} for "${query.trim()}"`
          : `${visibleEntries.length} plugins`}
      </p>

      {visibleEntries.length === 0 ? (
        <div className="reg-empty">
          <p>No plugins match "{query.trim()}".</p>
          <p>
            Looking for something specific? Ask the community on{' '}
            <a href="https://aiida.discourse.group/" target="_blank" rel="noopener noreferrer">
              Discourse
            </a>{' '}
            — or check the{' '}
            <a href="https://github.com/aiidateam/aiida-registry" target="_blank" rel="noopener noreferrer">
              registry on GitHub
            </a>.
          </p>
        </div>
      ) : (
        <div className="reg-list">
          {visibleEntries.map(([key, p]) => (
            <div key={key} className="reg-card">
              <div className="reg-card-head">
                <h2 className="reg-card-name">
                  <a href={`${base}/plugin-registry/${encodeURIComponent(key)}/`}>{key}</a>
                </h2>
                {p.is_installable === 'True' && (
                  <span
                    className="reg-installable"
                    title="Plugin installs successfully against the latest aiida-core docker image"
                    aria-label="Plugin successfully installed"
                  >
                    <CheckIcon />
                  </span>
                )}
              </div>
              <div className="reg-card-badges">
                <span className="reg-badge" title={statusTooltip(p.development_status, statusDict)}>
                  <span className="reg-badge-left">status</span>
                  <span className={`reg-badge-right ${statusColorClass(p.development_status)}`}>
                    {p.development_status}
                  </span>
                </span>
                {p.aiida_version && (
                  <span className="reg-badge" title={`Compatible with aiida-core ${p.aiida_version}`}>
                    <span className="reg-badge-left">
                      <AiidaLogo />
                      AiiDA
                    </span>
                    <span className="reg-badge-right blue">{p.aiida_version}</span>
                  </span>
                )}
                {sortMode === 'commits' && p.commits_count != null && (
                  <span className="reg-badge">
                    <span className="reg-badge-left">commits/yr</span>
                    <span className="reg-badge-right blue">{p.commits_count}</span>
                  </span>
                )}
                {sortMode === 'release' && p.metadata?.release_date && (
                  <span className="reg-badge">
                    <span className="reg-badge-left">recent release</span>
                    <span className="reg-badge-right blue">{p.metadata.release_date}</span>
                  </span>
                )}
              </div>
              {p.metadata?.description && (
                <p className="reg-card-desc">{p.metadata.description}</p>
              )}
              <ul className="reg-plugin-info">
                <li>
                  <a href={p.code_home} target="_blank" rel="noopener noreferrer">Source Code</a>
                </li>
                {p.documentation_url && (
                  <li>
                    <a href={p.documentation_url} target="_blank" rel="noopener noreferrer">Documentation</a>
                  </li>
                )}
                <li>
                  <a href={`${base}/plugin-registry/${encodeURIComponent(key)}/`}>Plugin details</a>
                </li>
              </ul>
              {p.summaryinfo && p.summaryinfo.length > 0 && (
                <div className="reg-card-summary">
                  {p.summaryinfo.map(s => {
                    const { label, tooltip } = splitOther(s.text);
                    return (
                      <span key={s.text} className="reg-badge">
                        <span
                          className={`reg-badge-left ${s.colorclass}`}
                          title={tooltip}
                        >
                          {label}
                        </span>
                        <span className="reg-badge-right">{s.count}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
