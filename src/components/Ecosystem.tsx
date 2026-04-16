import { type ReactNode, useState } from 'react';

const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface EcoNode {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  url: string;
  color: string;
  category: 'core' | 'platform' | 'workflow' | 'tools' | 'education';
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  core: { label: 'Core', color: '#0096de' },
  platform: { label: 'Platforms', color: '#e85d04' },
  workflow: { label: 'Workflow tools', color: '#7209b7' },
  tools: { label: 'Developer tools', color: '#d4a017' },
  education: { label: 'Learning', color: '#c1121f' },
};

const NODES: EcoNode[] = [
  {
    id: 'aiida-core',
    name: 'AiiDA Core',
    tagline: 'The engine',
    desc: 'The central Python framework. Provides the workflow engine, automatic provenance tracking, a plugin interface, and an ORM for managing computational data. Everything else builds on this.',
    url: 'https://github.com/aiidateam/aiida-core',
    color: '#0096de',
    category: 'core',
  },
  {
    id: 'plugin-registry',
    name: 'Plugin Registry',
    tagline: '100+ community plugins',
    desc: 'A curated directory of all AiiDA plugins — from simulation codes (Quantum ESPRESSO, VASP, CP2K, FLEUR, Siesta, …) to data types, schedulers, and transports. Plugins extend AiiDA via Python entry points.',
    url: 'https://aiidateam.github.io/aiida-registry/',
    color: '#0096de',
    category: 'core',
  },
  {
    id: 'materials-cloud',
    name: 'Materials Cloud',
    tagline: 'Share & explore data',
    desc: 'A web platform for open computational science. Browse curated AiiDA databases, explore provenance graphs interactively, and download reproducible datasets. Powered by AiiDA on the backend.',
    url: 'https://www.materialscloud.org/',
    color: '#e85d04',
    category: 'platform',
  },
  {
    id: 'aiidalab',
    name: 'AiiDAlab',
    tagline: 'Web apps for workflows',
    desc: 'A Jupyter-based platform that wraps AiiDA workflows into turn-key web applications. Researchers can run complex simulations through a graphical interface — no command line required.',
    url: 'https://www.aiidalab.net/',
    color: '#e85d04',
    category: 'platform',
  },
  {
    id: 'aiida-workgraph',
    name: 'aiida-workgraph',
    tagline: 'Visual workflow builder',
    desc: 'A graph-based alternative to WorkChain for defining workflows. Build complex computational graphs with a simple Python API and an interactive GUI for visualization and debugging.',
    url: 'https://github.com/aiidateam/aiida-workgraph',
    color: '#7209b7',
    category: 'workflow',
  },
  {
    id: 'aiida-project',
    name: 'aiida-project',
    tagline: 'Manage environments',
    desc: 'A CLI tool for creating and managing isolated AiiDA project environments. Keeps profiles, databases, and dependencies cleanly separated across different research projects.',
    url: 'https://github.com/aiidateam/aiida-project',
    color: '#d4a017',
    category: 'tools',
  },
  {
    id: 'plugin-cutter',
    name: 'Plugin Cutter',
    tagline: 'Bootstrap a new plugin',
    desc: 'A Cookiecutter template that scaffolds a complete AiiDA plugin package with CI, tests, docs, and proper entry-point registration. Get a new plugin started in minutes.',
    url: 'https://github.com/aiidateam/aiida-plugin-cutter',
    color: '#d4a017',
    category: 'tools',
  },
  {
    id: 'aiida-restapi',
    name: 'AiiDA REST API',
    tagline: 'Programmatic access',
    desc: 'A FastAPI-based REST interface to an AiiDA database. Query nodes, processes, and provenance graphs over HTTP — useful for building dashboards, frontends, or integrating with other services.',
    url: 'https://github.com/aiidateam/aiida-restapi',
    color: '#d4a017',
    category: 'tools',
  },
  {
    id: 'quantum-mobile',
    name: 'Quantum Mobile',
    tagline: 'Ready-to-use VM',
    desc: 'A pre-configured virtual machine with AiiDA, simulation codes, and pseudopotentials pre-installed. Download, boot, and start running calculations — ideal for workshops and teaching.',
    url: 'https://quantum-mobile.readthedocs.io',
    color: '#c1121f',
    category: 'education',
  },
  {
    id: 'aiida-tutorials',
    name: 'Tutorials',
    tagline: 'Step-by-step guides',
    desc: 'Hands-on tutorial materials covering AiiDA fundamentals, plugin development, and workflow design. Used at official AiiDA schools and available for self-study.',
    url: 'https://aiida-tutorials.readthedocs.io',
    color: '#c1121f',
    category: 'education',
  },
];

type CatFilter = string | null;

/* Materials Cloud logo — the actual MC cloud mark */
function MCLogo() {
  return (
    <svg className="eco-mc-logo" viewBox="0 0 100 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M80.5 32C80.5 18.2 69.3 7 55.5 7c-10.8 0-20 6.9-23.5 16.5C30.2 22.5 28.1 22 26 22c-8.8 0-16 7.2-16 16s7.2 16 16 16h53c7.2 0 13-5.8 13-13 0-6.5-4.8-11.9-11-12.8-.3-.1-.5-.2-.5-.2z"
        fill="#e85d04" opacity="0.12" />
      <path d="M80.5 32C80.5 18.2 69.3 7 55.5 7c-10.8 0-20 6.9-23.5 16.5C30.2 22.5 28.1 22 26 22c-8.8 0-16 7.2-16 16s7.2 16 16 16h53c7.2 0 13-5.8 13-13 0-6.5-4.8-11.9-11-12.8-.3-.1-.5-.2-.5-.2z"
        stroke="#e85d04" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export default function Ecosystem(): ReactNode {
  const [catFilter, setCatFilter] = useState<CatFilter>(null);

  const filtered = catFilter ? NODES.filter(n => n.category === catFilter) : NODES;

  return (
    <main className="eco-page">
      <section className="eco-hero">
        <h1>The AiiDA Ecosystem</h1>
        <p className="eco-hero-sub">
          AiiDA is more than a workflow engine — it's a growing ecosystem of tools, platforms,
          and community plugins that cover the full lifecycle of computational research.
        </p>
      </section>

      {/* Layered architecture diagram */}
      <section className="eco-layers">

        {/* Top row: platforms that sit on top of AiiDA */}
        <div className="eco-layer eco-layer--platforms">
          <a className="eco-layer-node eco-layer-node--mc" href="https://www.materialscloud.org/" target="_blank" rel="noopener noreferrer">
            <MCLogo />
            <span className="eco-layer-node-label">Materials Cloud</span>
            <span className="eco-layer-node-sub">Open science platform</span>
          </a>
          <a className="eco-layer-node eco-layer-node--lab" href="https://www.aiidalab.net/" target="_blank" rel="noopener noreferrer">
            <div className="eco-lab-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#e85d04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <span className="eco-layer-node-label">AiiDAlab</span>
            <span className="eco-layer-node-sub">Browser-based workflows</span>
          </a>
        </div>

        {/* Connecting lines: platforms → core */}
        <div className="eco-layer-connectors">
          <svg viewBox="0 0 600 40" preserveAspectRatio="none">
            <path d="M150,0 C150,20 300,20 300,40" stroke="#e85d04" strokeWidth="1.5" fill="none" opacity="0.3" />
            <path d="M450,0 C450,20 300,20 300,40" stroke="#e85d04" strokeWidth="1.5" fill="none" opacity="0.3" />
          </svg>
        </div>

        {/* Centre: AiiDA Core — large and prominent */}
        <div className="eco-layer eco-layer--core">
          <a className="eco-core-block" href="https://github.com/aiidateam/aiida-core" target="_blank" rel="noopener noreferrer">
            <img src={`${base}/img/aiida-logo-dark.svg`} alt="AiiDA" className="eco-core-logo eco-core-logo--dark" />
            <img src={`${base}/img/aiida-logo-light.svg`} alt="AiiDA" className="eco-core-logo eco-core-logo--light" />
            <span className="eco-core-sub">Workflow engine &middot; Provenance &middot; Plugin system &middot; ORM</span>
          </a>
        </div>

        {/* Connecting lines: core → extensions */}
        <div className="eco-layer-connectors">
          <svg viewBox="0 0 600 40" preserveAspectRatio="none">
            <path d="M300,0 C300,20 100,20 100,40" stroke="var(--color-border)" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M300,0 C300,20 300,20 300,40" stroke="var(--color-border)" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M300,0 C300,20 500,20 500,40" stroke="var(--color-border)" strokeWidth="1.5" fill="none" opacity="0.4" />
          </svg>
        </div>

        {/* Bottom row: extensions and tools */}
        <div className="eco-layer eco-layer--extensions">
          <a className="eco-ext-node" href="https://aiidateam.github.io/aiida-registry/" target="_blank" rel="noopener noreferrer"
            style={{ '--ext-color': '#0096de' } as React.CSSProperties}>
            <div className="eco-ext-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0096de" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <span className="eco-ext-label">Plugin Registry</span>
            <span className="eco-ext-sub">100+ plugins</span>
          </a>
          <a className="eco-ext-node" href="https://github.com/aiidateam/aiida-workgraph" target="_blank" rel="noopener noreferrer"
            style={{ '--ext-color': '#7209b7' } as React.CSSProperties}>
            <div className="eco-ext-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#7209b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M6 21V9a9 9 0 009 9" />
              </svg>
            </div>
            <span className="eco-ext-label">WorkGraph</span>
            <span className="eco-ext-sub">Visual workflows</span>
          </a>
          <a className="eco-ext-node" href="https://github.com/aiidateam/aiida-restapi" target="_blank" rel="noopener noreferrer"
            style={{ '--ext-color': '#d4a017' } as React.CSSProperties}>
            <div className="eco-ext-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <span className="eco-ext-label">REST API</span>
            <span className="eco-ext-sub">HTTP interface</span>
          </a>
        </div>
      </section>

      {/* Category filter tabs */}
      <section className="eco-catalog">
        <h2>Browse the ecosystem</h2>
        <div className="eco-filters">
          <button
            className={`eco-filter-btn ${catFilter === null ? 'eco-filter-btn--active' : ''}`}
            onClick={() => setCatFilter(null)}>
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              className={`eco-filter-btn ${catFilter === key ? 'eco-filter-btn--active' : ''}`}
              style={catFilter === key ? { '--filter-color': cat.color } as React.CSSProperties : {}}
              onClick={() => setCatFilter(catFilter === key ? null : key)}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="eco-grid">
          {filtered.map(node => (
            <a
              key={node.id}
              className="eco-card"
              style={{ '--card-color': node.color } as React.CSSProperties}
              href={node.url}
              target="_blank"
              rel="noopener noreferrer">
              <div className="eco-card-cat" style={{ color: node.color }}>
                {CATEGORIES[node.category].label}
              </div>
              <h3 className="eco-card-name">{node.name}</h3>
              <p className="eco-card-tagline">{node.tagline}</p>
              <p className="eco-card-desc">{node.desc}</p>
              <span className="eco-card-link" style={{ color: node.color }}>
                Visit &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* How it connects — narrative */}
      <section className="eco-narrative">
        <h2>How it all connects</h2>
        <div className="eco-narrative-grid">
          <div className="eco-narrative-card">
            <div className="eco-narrative-num" style={{ color: '#0096de' }}>1</div>
            <h3>Start with AiiDA Core</h3>
            <p>
              Install <code>aiida-core</code> to get the workflow engine, provenance tracking,
              and the <code>verdi</code> CLI. This is the foundation everything else plugs into.
            </p>
          </div>
          <div className="eco-narrative-card">
            <div className="eco-narrative-num" style={{ color: '#7209b7' }}>2</div>
            <h3>Add plugins for your codes</h3>
            <p>
              Install plugins from the registry to connect your simulation codes — Quantum ESPRESSO,
              VASP, CP2K, or any of 100+ others. Or use <code>aiida-shell</code> to wrap any executable instantly.
            </p>
          </div>
          <div className="eco-narrative-card">
            <div className="eco-narrative-num" style={{ color: '#2d6a4f' }}>3</div>
            <h3>Connect to HPC</h3>
            <p>
              AiiDA natively supports SLURM, PBS, SGE, and LSF schedulers over SSH.
              For modern HPC centers, <code>aiida-firecrest</code> provides secure REST-based access.
            </p>
          </div>
          <div className="eco-narrative-card">
            <div className="eco-narrative-num" style={{ color: '#d4a017' }}>4</div>
            <h3>Run & produce results</h3>
            <p>
              Launch calculations, orchestrate multi-step workflows, and let AiiDA handle
              job scheduling, error recovery, and checkpointing. Every input, output, and step
              is recorded in the provenance graph automatically.
            </p>
          </div>
          <div className="eco-narrative-card">
            <div className="eco-narrative-num" style={{ color: '#e85d04' }}>5</div>
            <h3>Share & explore</h3>
            <p>
              Publish your data and provenance to <strong>Materials Cloud</strong> for the community.
              Use <strong>AiiDAlab</strong> to build web apps that let collaborators run workflows without touching code.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
