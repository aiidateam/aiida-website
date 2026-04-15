import { useState, useEffect, useRef } from 'react';

const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

const ExtIcon = () => (
  <svg className="navbar-ext-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 1.5H2a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V7.5" />
    <path d="M7 1.5h3.5V5" />
    <path d="M5.5 6.5 10.5 1.5" />
  </svg>
);

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <nav className="navbar">
      <a className="navbar-brand" href={`${base}/`}>
        <img
          src={dark ? `${base}/img/aiida-logo-dark.svg` : `${base}/img/aiida-logo-light.svg`}
          alt="AiiDA"
        />
      </a>
      <button
        className="navbar-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>
      <ul className={`navbar-links${menuOpen ? ' navbar-links--open' : ''}`}>
        <li><a href={`${base}/ecosystem`}>Ecosystem</a></li>
        <li><a href={`${base}/docs`}>Docs</a></li>
        {/* Don't remove tutorail, I just commented for the moment, to see if that makes sense */}
        {/* <li><a href="https://aiida-tutorials.readthedocs.io" target="_blank" rel="noopener noreferrer">Tutorials <ExtIcon /></a></li> */}
        <li><a href="https://aiidateam.github.io/aiida-registry/" target="_blank" rel="noopener noreferrer">Plugins <ExtIcon /></a></li>
        <li><a href={`${base}/blog/`}>News</a></li>
        <li><a href="https://aiida.discourse.group/" target="_blank" rel="noopener noreferrer">Community <ExtIcon /></a></li>
        <li className="navbar-dropdown" ref={moreRef}>
          <button className="navbar-dropdown-btn" onClick={() => setMoreOpen(!moreOpen)}>
            More
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:'10px',height:'10px',marginLeft:'3px'}}>
              <polyline points="2 4 6 8 10 4" />
            </svg>
          </button>
          {moreOpen && (
            <ul className="navbar-dropdown-menu">
              <li><a href={`${base}/team`}>Team</a></li>
              <li><a href={`${base}/events`}>Events</a></li>
              <li><a href={`${base}/science`}>Science</a></li>
              <li><a href={`${base}/gallery`}>Graph Gallery</a></li>
              <li><a href={`${base}/acknowledgements`}>Acknowledgements</a></li>
              <li><a href="https://github.com/aiidateam/aiida-core/wiki/AiiDA-roadmap" target="_blank" rel="noopener noreferrer">Roadmap <ExtIcon /></a></li>
            </ul>
          )}
        </li>
        <li>
          <a className="navbar-github" href="https://github.com/aiidateam/aiida-core" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </li>
        <li>
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </li>
      </ul>
    </nav>
  );
}
