import type { ReactNode } from 'react';

const ExtIcon = () => (
  <svg className="docs-ext-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 1.5H2a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V7.5" />
    <path d="M7 1.5h3.5V5" />
    <path d="M5.5 6.5 10.5 1.5" />
  </svg>
);

interface DocEntry {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  url: string;
  color: string;
  category: 'plugins' | 'workflow' | 'learning';
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  plugins: { label: 'Plugins', color: '#2d6a4f' },
  workflow: { label: 'Workflow tools', color: '#7209b7' },
  learning: { label: 'Learning', color: '#c1121f' },
};

const DOCS: DocEntry[] = [
  {
    id: 'aiida-workgraph',
    name: 'aiida-workgraph',
    tagline: 'Graph-based workflow builder',
    desc: 'Define complex computational graphs with a Python API and interactive GUI. An alternative to WorkChain for visual, node-based workflow design.',
    url: 'https://aiida-workgraph.readthedocs.io',
    color: '#7209b7',
    category: 'workflow',
  },
  {
    id: 'aiida-shell',
    name: 'aiida-shell',
    tagline: 'Run any shell command with AiiDA',
    desc: 'Wrap arbitrary shell commands and executables as AiiDA calculations — no plugin boilerplate needed. Perfect for quick prototyping and one-off jobs.',
    url: 'https://aiida-shell.readthedocs.io',
    color: '#2d6a4f',
    category: 'plugins',
  },
  {
    id: 'aiida-quantumespresso',
    name: 'aiida-quantumespresso',
    tagline: 'Quantum ESPRESSO plugin',
    desc: 'Full-featured plugin for Quantum ESPRESSO: pw.x, ph.x, cp.x, and more. Includes robust workflows with automatic error handling and restart logic.',
    url: 'https://aiida-quantumespresso.readthedocs.io',
    color: '#2d6a4f',
    category: 'plugins',
  },
  {
    id: 'aiida-pseudo',
    name: 'aiida-pseudo',
    tagline: 'Pseudopotential management',
    desc: 'Install and manage pseudopotential families for use in AiiDA calculations. Supports SSSP, PseudoDojo, and custom pseudopotential sets.',
    url: 'https://aiida-pseudo.readthedocs.io',
    color: '#2d6a4f',
    category: 'plugins',
  },
  {
    id: 'aiida-tutorials',
    name: 'Tutorials',
    tagline: 'Step-by-step guides',
    desc: 'Hands-on tutorial materials covering AiiDA fundamentals, plugin development, and workflow design. Used at official AiiDA schools and for self-study.',
    url: 'https://aiida-tutorials.readthedocs.io',
    color: '#c1121f',
    category: 'learning',
  },
  {
    id: 'aiida-howto',
    name: 'AiiDA How-To Recipes',
    tagline: 'Common tasks explained',
    desc: 'Practical how-to guides from the core documentation covering topics like setting up computers, managing data, writing plugins, and running workflows.',
    url: 'https://aiida.readthedocs.io/projects/aiida-core/en/latest/howto/index.html',
    color: '#c1121f',
    category: 'learning',
  },
];

export default function Docs(): ReactNode {
  return (
    <main className="docs-page">
      <section className="docs-hero">
        <h1>Documentation</h1>
        <p className="docs-hero-sub">
          Find the right documentation for the AiiDA package you're working with.
          All docs are hosted on Read the Docs.
        </p>
      </section>

      {/* Featured: aiida-core */}
      <section className="docs-featured">
        <a className="docs-featured-card" href="https://aiida.readthedocs.io" target="_blank" rel="noopener noreferrer">
          <div className="docs-featured-content">
            <span className="docs-featured-badge">Start here</span>
            <h2>aiida-core documentation</h2>
            <p>
              The complete reference for the AiiDA framework — installation, configuration,
              the workflow engine, provenance tracking, the plugin system, and the REST API.
            </p>
            <span className="docs-featured-link">
              Read the docs <ExtIcon />
            </span>
          </div>
          <div className="docs-featured-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        </a>
      </section>

      {/* All docs grid */}
      <section className="docs-catalog">
        <h2>Popular documentation</h2>
        <div className="docs-grid">
          {DOCS.map(doc => (
            <a
              key={doc.id}
              className="docs-card"
              style={{ '--card-color': doc.color } as React.CSSProperties}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="docs-card-cat" style={{ color: doc.color }}>
                {CATEGORIES[doc.category].label}
              </div>
              <h3 className="docs-card-name">{doc.name}</h3>
              <p className="docs-card-tagline">{doc.tagline}</p>
              <p className="docs-card-desc">{doc.desc}</p>
              <span className="docs-card-link" style={{ color: doc.color }}>
                Read the docs <ExtIcon />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Additional resources */}
      <section className="docs-extra">
        <h2>More resources</h2>
        <div className="docs-extra-grid">
          <a className="docs-extra-card" href="https://aiida.discourse.group/" target="_blank" rel="noopener noreferrer">
            <div className="docs-extra-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3>Discourse forum</h3>
              <p>Ask questions and get help from the community</p>
            </div>
          </a>
          <a className="docs-extra-card" href="https://github.com/aiidateam/aiida-core" target="_blank" rel="noopener noreferrer">
            <div className="docs-extra-icon">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </div>
            <div>
              <h3>GitHub</h3>
              <p>Source code, issues, and contributing</p>
            </div>
          </a>
          <a className="docs-extra-card" href="https://aiidateam.github.io/aiida-registry/" target="_blank" rel="noopener noreferrer">
            <div className="docs-extra-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <h3>Plugin registry</h3>
              <p>Find documentation for 100+ community plugins</p>
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}
