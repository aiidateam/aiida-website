import {type ReactNode, useState, useRef, useEffect, useCallback} from 'react';
import verdiCliData from '../data/verdi-cli.json';
import pypiStats from '../data/pypi-stats.json';


const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

const PROV_COLORS = ['#0096DE', '#30B808', '#FF7D17'] as const;

interface CNode {
  rx: number; ry: number; // offset from cluster center
  dx: number; dy: number; // mouse-driven displacement (springs back)
  radius: number;
  filled: boolean; // filled vs stroke-only
  ampX: number; ampY: number; freqX: number; freqY: number;
  phaseX: number; phaseY: number;
}

interface Cluster {
  cx: number; cy: number; // center position
  vx: number; vy: number; // drift velocity
  color: string;
  opacity: number;
  // cluster-level swimming
  ampX: number; ampY: number; freqX: number; freqY: number;
  phaseX: number; phaseY: number;
  nodes: CNode[];
  edges: [number, number][]; // tree edges — no cycles
}

function createClusters(count: number, w: number, h: number): Cluster[] {
  const clusters: Cluster[] = [];
  for (let c = 0; c < count; c++) {
    const color = PROV_COLORS[c % 3];
    const nodeCount = 5 + Math.floor(Math.random() * 5); // 5-9 nodes
    const nodes: CNode[] = [];
    const edges: [number, number][] = [];
    const depth: number[] = []; // track depth of each node
    const spread = 35 + Math.random() * 25;

    // Root node — largest
    nodes.push({
      rx: 0, ry: 0, dx: 0, dy: 0,
      radius: 8 + Math.random() * 6,
      filled: true,
      ampX: 1 + Math.random() * 2, ampY: 1 + Math.random() * 2,
      freqX: 0.5 + Math.random() * 0.5, freqY: 0.5 + Math.random() * 0.5,
      phaseX: Math.random() * Math.PI * 2, phaseY: Math.random() * Math.PI * 2,
    });
    depth.push(0);

    // Build tree — bias toward recent nodes to create deeper chains (depth 2-4)
    for (let i = 1; i < nodeCount; i++) {
      // 60% chance to pick the most recent node as parent → promotes depth
      const parent = Math.random() < 0.6
        ? i - 1
        : Math.floor(Math.random() * i);
      const d = depth[parent] + 1;
      depth.push(d);
      const angle = (Math.PI * 2 * i / nodeCount) + (Math.random() - 0.5) * 0.8;
      const dist = spread * (0.7 + Math.random() * 0.6);
      const px = nodes[parent].rx;
      const py = nodes[parent].ry;
      // Nodes get smaller at deeper levels
      const maxR = d === 0 ? 10 : d === 1 ? 5 : 3.5;
      nodes.push({
        rx: px + Math.cos(angle) * dist,
        ry: py + Math.sin(angle) * dist,
        dx: 0, dy: 0,
        radius: 1.5 + Math.random() * maxR,
        filled: Math.random() > 0.25, // 25% chance stroke-only
        ampX: 1 + Math.random() * 2, ampY: 1 + Math.random() * 2,
        freqX: 0.4 + Math.random() * 0.6, freqY: 0.4 + Math.random() * 0.6,
        phaseX: Math.random() * Math.PI * 2, phaseY: Math.random() * Math.PI * 2,
      });
      edges.push([parent, i]);
    }

    clusters.push({
      cx: Math.random() * w,
      cy: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      color,
      opacity: 0.35 + Math.random() * 0.25,
      ampX: 10 + Math.random() * 20,
      ampY: 10 + Math.random() * 20,
      freqX: 0.15 + Math.random() * 0.2,
      freqY: 0.15 + Math.random() * 0.2,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      nodes,
      edges,
    });
  }
  return clusters;
}

function ParticleNetwork(): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clustersRef = useRef<Cluster[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const frameRef = useRef(0);
  const darkRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    darkRef.current = document.documentElement.getAttribute('data-theme') === 'dark';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let prevW = 0, prevH = 0;
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = w < 768 ? 5 : 10;
      // Recreate clusters when count changes or dimensions change significantly
      if (clustersRef.current.length !== target || Math.abs(w - prevW) > 50 || Math.abs(h - prevH) > 50) {
        clustersRef.current = createClusters(target, w, h);
        prevW = w;
        prevH = h;
      }
    }
    resize();
    // Re-measure after layout settles (images load, content hydrates)
    requestAnimationFrame(() => resize());

    const themeObs = new MutationObserver(() => {
      darkRef.current = document.documentElement.getAttribute('data-theme') === 'dark';
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function onPointerDown(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    }
    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }
    function onPointerUp() { mouseRef.current.active = false; }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', resize);

    function drawFrame(timestamp: number) {
      const t = timestamp / 1000;
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const gA = 0.9;

      ctx!.clearRect(0, 0, w, h);
      const mouse = mouseRef.current;

      for (const cl of clustersRef.current) {
        // Drift
        cl.cx += cl.vx;
        cl.cy += cl.vy;

        // Wrap edges
        if (cl.cx < -120) cl.cx = w + 120;
        if (cl.cx > w + 120) cl.cx = -120;
        if (cl.cy < -120) cl.cy = h + 120;
        if (cl.cy > h + 120) cl.cy = -120;

        // Cluster swimming offset
        const sx = cl.cx + Math.sin(t * cl.freqX + cl.phaseX) * cl.ampX;
        const sy = cl.cy + Math.sin(t * cl.freqY + cl.phaseY) * cl.ampY;

        // Compute node world positions — each node reacts to mouse independently
        const positions: [number, number][] = cl.nodes.map(n => {
          const nx = sx + n.rx + Math.sin(t * n.freqX + n.phaseX) * n.ampX + n.dx;
          const ny = sy + n.ry + Math.sin(t * n.freqY + n.phaseY) * n.ampY + n.dy;

          // Per-node mouse attraction
          const mdx = mouse.x - nx;
          const mdy = mouse.y - ny;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          const aRadius = mouse.active ? 250 : 180;
          const aForce = mouse.active ? 1.2 : 0.15;
          if (md < aRadius && md > 1) {
            const f = (1 - md / aRadius) * aForce;
            n.dx += mdx / md * f;
            n.dy += mdy / md * f;
          }

          // Spring back toward rest position (damping)
          n.dx *= 0.95;
          n.dy *= 0.95;

          return [nx, ny] as [number, number];
        });

        // Draw edges (fixed tree structure)
        ctx!.strokeStyle = cl.color;
        ctx!.lineWidth = 1.5;
        ctx!.globalAlpha = cl.opacity * 0.5 * gA;
        for (const [a, b] of cl.edges) {
          ctx!.beginPath();
          ctx!.moveTo(positions[a][0], positions[a][1]);
          ctx!.lineTo(positions[b][0], positions[b][1]);
          ctx!.stroke();
        }

        // Draw nodes
        for (let i = 0; i < cl.nodes.length; i++) {
          const n = cl.nodes[i];
          const [px, py] = positions[i];
          ctx!.beginPath();
          ctx!.arc(px, py, n.radius, 0, Math.PI * 2);
          if (n.filled) {
            ctx!.fillStyle = cl.color;
            ctx!.globalAlpha = cl.opacity * gA;
            ctx!.fill();
          } else {
            ctx!.strokeStyle = cl.color;
            ctx!.lineWidth = 1.5;
            ctx!.globalAlpha = cl.opacity * 0.7 * gA;
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;
    }

    function animate(timestamp: number) {
      drawFrame(timestamp);
      frameRef.current = requestAnimationFrame(animate);
    }

    if (reducedMotion) {
      drawFrame(0);
    } else {
      frameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', resize);
      themeObs.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="network-bg" aria-hidden="true" />;
}

// Hero is now integrated into HighThroughputCombined

const componentExplanations: Record<string, string> = {
  WorkChain: 'Orchestrates multi-step workflows with checkpoints. Survives restarts — picks up exactly where it left off.',
  CalcJob: 'Wraps a single computation on a remote machine. Handles file staging, submission, and retrieval automatically.',
  Parser: 'Extracts structured data from raw calculation outputs into queryable AiiDA nodes.',
  Function: 'Lightweight Python function decorated as a workflow step. No remote submission — runs locally.',
};

const plugins = [
  {
    name: 'aiida-shell',
    code: 'Any executable',
    color: '#0096de',
    install: 'pip install aiida-shell',
    url: 'https://aiida-shell.readthedocs.io',
    desc: 'Run any command-line tool as an AiiDA process. No plugin code needed — the fastest way to get started.',
    components: [
      {type: 'Function', items: ['launch_shell_job']},
      {type: 'CalcJob', items: ['ShellJob']},
      {type: 'Parser', items: ['ShellParser']},
    ],
  },
  {
    name: 'aiida-quantumespresso',
    code: 'Quantum ESPRESSO',
    color: '#e85d04',
    install: 'pip install aiida-quantumespresso',
    url: 'https://aiida-quantumespresso.readthedocs.io',
    desc: 'Full integration for Quantum ESPRESSO — pw.x, ph.x, pp.x and more. Production-ready workflows for relaxation, bands, and phonons.',
    components: [
      {type: 'WorkChain', items: ['PwBaseWorkChain', 'PwRelaxWorkChain', 'PwBandsWorkChain']},
      {type: 'CalcJob', items: ['PwCalculation', 'PhCalculation', 'PpCalculation']},
      {type: 'Parser', items: ['PwParser', 'PhParser', 'PpParser']},
    ],
  },
  {
    name: 'aiida-vasp',
    code: 'VASP',
    color: '#7209b7',
    install: 'pip install aiida-vasp',
    url: 'https://aiida-vasp.readthedocs.io',
    desc: 'Automate VASP calculations with convergence testing, relaxation workflows, and structured output parsing.',
    components: [
      {type: 'WorkChain', items: ['RelaxWorkChain', 'ConvergeWorkChain']},
      {type: 'CalcJob', items: ['VaspCalculation']},
      {type: 'Parser', items: ['VaspParser']},
    ],
  },
  {
    name: 'aiida-cp2k',
    code: 'CP2K',
    color: '#2d6a4f',
    install: 'pip install aiida-cp2k',
    url: 'https://aiida-cp2k.readthedocs.io',
    desc: 'Interface to the CP2K atomistic simulation package for DFT, molecular dynamics, and more.',
    components: [
      {type: 'WorkChain', items: ['Cp2kBaseWorkChain']},
      {type: 'CalcJob', items: ['Cp2kCalculation']},
      {type: 'Parser', items: ['Cp2kParser', 'Cp2kAdvancedParser']},
    ],
  },
];

function PluginShowcase(): ReactNode {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const active = plugins[activeIdx];

  return (
    <section className="plugin-section" data-reveal>
      <h2>Plugin ecosystem</h2>
      <p className="plugin-subtitle">
        Extend AiiDA with community plugins for your simulation codes.
        Each plugin wraps a code with workflows, parsers, and data types &mdash; all fully tracked in the provenance graph.
      </p>
      <div className="plugin-layout">
        {/* Left: aiida-core + lines + plugin list — fixed width */}
        <div className="plugin-left">
          <div className="plugin-core">
            <div className="plugin-core-box">
              <div className="plugin-core-label">aiida-core</div>
              <div className="plugin-core-sub">pip install aiida-core</div>
            </div>
            <svg className="plugin-core-lines" viewBox="0 0 40 200" preserveAspectRatio="none">
              {plugins.map((p, i) => {
                const y = 25 + i * 50;
                return (
                  <path key={i}
                    d={`M0,100 C20,100 20,${y} 40,${y}`}
                    stroke={activeIdx === i ? p.color : 'var(--color-border)'}
                    strokeWidth={activeIdx === i ? 2.5 : 1.5}
                    fill="none"
                    opacity={activeIdx === i ? 0.9 : 0.3}
                  />
                );
              })}
            </svg>
          </div>

          <div className="plugin-list">
            {plugins.map((p, i) => (
              <div
                key={i}
                className={`plugin-item ${activeIdx === i ? 'plugin-item--active' : ''}`}
                style={activeIdx === i ? {'--plugin-color': p.color} as React.CSSProperties : {}}
                onMouseEnter={() => { setActiveIdx(i); setSelectedType(null); }}>
                <div className="plugin-item-dot" style={{background: p.color}} />
                <div className="plugin-item-content">
                  <a className="plugin-item-name" href={p.url} target="_blank" rel="noopener noreferrer">{p.name}</a>
                  <div className="plugin-item-code">{p.code}</div>
                </div>
              </div>
            ))}
            <a className="plugin-registry-link" href="https://aiidateam.github.io/aiida-registry/">
              + 100 more plugins &rarr;
            </a>
          </div>
        </div>

        {/* Right: component groups + explanation panel — expands rightward */}
        <div className="plugin-right">
          <svg className="plugin-detail-lines" viewBox="0 0 30 180" preserveAspectRatio="none">
            {active.components.map((_, i) => {
              const y = 30 + i * 65;
              return (
                <path key={i}
                  d={`M0,90 C15,90 15,${y} 30,${y}`}
                  stroke={active.color}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.5"
                />
              );
            })}
          </svg>
          <div className="plugin-components">
            {active.components.map((comp, i) => (
              <div key={i}
                className={`plugin-component-group ${selectedType === comp.type ? 'plugin-component-group--active' : ''}`}
                style={{'--comp-color': active.color} as React.CSSProperties}
                onMouseEnter={() => setSelectedType(comp.type)}>
                <div className="plugin-component-type" style={{color: active.color}}>
                  {comp.type}
                </div>
                <div className="plugin-component-items">
                  {comp.items.map((item, j) => (
                    <span key={j} className="plugin-component-item">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Explanation panel — shows plugin info by default, component info on hover */}
          <div className="plugin-explain" style={{borderColor: selectedType ? active.color : active.color + '40'}}>
            {selectedType ? (
              <>
                <div className="plugin-explain-title" style={{color: active.color}}>
                  {selectedType}
                </div>
                <div className="plugin-explain-text">
                  {componentExplanations[selectedType]}
                </div>
              </>
            ) : (
              <>
                <div className="plugin-explain-title" style={{color: active.color}}>
                  {active.name}
                </div>
                <div className="plugin-explain-install">{active.install}</div>
                <div className="plugin-explain-text">{active.desc}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface GraphNode {
  id: string;
  label: string;
  type: 'data' | 'calc' | 'workflow';
  x: number;
  y: number;
  pk: number;
}

type LinkStyle = 'solid' | 'dashed' | 'dotted';

interface GraphLink {
  from: string;
  to: string;
  label?: string;
  bow?: number;               // perpendicular offset for Q-curve
  cp1?: [number, number];     // first control point for C-curve
  cp2?: [number, number];     // second control point for C-curve
  style?: LinkStyle;          // solid (default), dashed, dotted
}

// Provenance DAG layout mirroring the AiiDA docs "delexp_example02" figure.
//   data nodes (D)   → green circles
//   workchains (W)   → orange diamonds
//   calcjobs  (C)    → tomato squares
// Solid  arrows: data provenance  (INPUT_CALC, CREATE)
// Dashed arrows: logical links    (INPUT_WORK, RETURN)
// Dotted arrows: call hierarchy   (CALL_WORK, CALL_CALC)
const provenanceNodes: GraphNode[] = [
  // Outer columns (D1, C1 on the left; D2, C2 on the right)
  {id: 'd1', label: 'D\u2081', pk: 1, type: 'data',     x: 120, y: 75},
  {id: 'd2', label: 'D\u2082', pk: 2, type: 'data',     x: 780, y: 75},
  {id: 'c1', label: 'C\u2081', pk: 6, type: 'calc',     x: 120, y: 385},
  {id: 'c2', label: 'C\u2082', pk: 7, type: 'calc',     x: 780, y: 385},
  // Inner columns (W1, D3 on the left; W2, D4 on the right)
  {id: 'w1', label: 'W\u2081', pk: 4, type: 'workflow', x: 335, y: 260},
  {id: 'w2', label: 'W\u2082', pk: 5, type: 'workflow', x: 565, y: 260},
  {id: 'd3', label: 'D\u2083', pk: 8, type: 'data',     x: 335, y: 520},
  {id: 'd4', label: 'D\u2084', pk: 9, type: 'data',     x: 565, y: 520},
  // Center column (top-level workchain)
  {id: 'w0', label: 'W\u2080', pk: 3, type: 'workflow', x: 450, y: 145},
];

const provenanceLinks: GraphLink[] = [
  // --- Solid: data provenance (INPUT_CALC, CREATE) ---
  {from: 'd1', to: 'c1', label: 'INPUT_CALC', bow: -70},
  {from: 'd2', to: 'c2', label: 'INPUT_CALC', bow: 70},
  {from: 'c1', to: 'd3', label: 'CREATE',     bow: -25},
  {from: 'c2', to: 'd4', label: 'CREATE',     bow: 25},
  // --- Dashed: logical workchain links (INPUT_WORK, RETURN) ---
  {from: 'd1', to: 'w0', label: 'INPUT_WORK', bow: -45, style: 'dashed'},
  {from: 'd2', to: 'w0', label: 'INPUT_WORK', bow: 45,  style: 'dashed'},
  {from: 'd1', to: 'w1', label: 'INPUT_WORK', bow: -30, style: 'dashed'},
  {from: 'd2', to: 'w2', label: 'INPUT_WORK', bow: 30,  style: 'dashed'},
  {from: 'w1', to: 'd3', label: 'RETURN',     bow: -40, style: 'dashed'},
  {from: 'w2', to: 'd4', label: 'RETURN',     bow: 40,  style: 'dashed'},
  // Long arcs from W0 sweeping around the inner workchain columns down to
  // the output data nodes (passes left of W1, right of W2).
  {from: 'w0', to: 'd3', label: 'RETURN', style: 'dashed', cp1: [280, 180], cp2: [180, 420]},
  {from: 'w0', to: 'd4', label: 'RETURN', style: 'dashed', cp1: [620, 180], cp2: [720, 420]},
  // --- Dotted: call hierarchy (CALL_WORK, CALL_CALC) ---
  {from: 'w0', to: 'w1', label: 'CALL_WORK', style: 'dotted'},
  {from: 'w0', to: 'w2', label: 'CALL_WORK', style: 'dotted'},
  {from: 'w1', to: 'c1', label: 'CALL_CALC', style: 'dotted'},
  {from: 'w2', to: 'c2', label: 'CALL_CALC', style: 'dotted'},
];

function getDescendants(nodeId: string): Set<string> {
  const desc = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    desc.add(current);
    for (const link of provenanceLinks) {
      if (link.from === current && !desc.has(link.to)) {
        queue.push(link.to);
      }
    }
  }
  return desc;
}

// Half-extent of each shape (used both for trimming arrow endpoints and for
// rendering the shapes themselves). Diamond is described by half-diagonal,
// square by half-side, circle by radius.
const NODE_HALF = {data: 28, workflow: 38, calc: 28} as const;

// Distance from a node's center to its boundary along the unit direction
// (ux, uy). Lets arrow endpoints land on the shape edge instead of inside.
function shapeBoundary(type: GraphNode['type'], ux: number, uy: number): number {
  const h = NODE_HALF[type];
  if (type === 'data') return h;                              // circle
  if (type === 'workflow') return h / (Math.abs(ux) + Math.abs(uy)); // diamond (rhombus)
  return h / Math.max(Math.abs(ux), Math.abs(uy));            // square
}

// Trim a path endpoint by the shape's boundary along the given direction.
function trimEndpoint(
  node: GraphNode,
  dirX: number,
  dirY: number,
  inward: boolean, // true = trim toward node (use for the FROM end)
): [number, number] {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const r = shapeBoundary(node.type, ux, uy);
  const sign = inward ? 1 : -1;
  return [node.x + sign * ux * r, node.y + sign * uy * r];
}

function ProvenanceGraph(): ReactNode {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const nodeById = Object.fromEntries(provenanceNodes.map(n => [n.id, n]));
  const activeNodes = hoveredNode ? getDescendants(hoveredNode) : null;

  const isActive = (id: string) => !activeNodes || activeNodes.has(id);
  const isLinkActive = (from: string, to: string) =>
    !activeNodes || (activeNodes.has(from) && activeNodes.has(to));

  // Build a path string for a link, trimming endpoints to the shape boundary
  // so arrowheads sit on the edge of each node rather than buried inside it.
  const linkPath = (from: GraphNode, to: GraphNode, link: GraphLink): string => {
    if (link.cp1 && link.cp2) {
      const [c1x, c1y] = link.cp1;
      const [c2x, c2y] = link.cp2;
      const [sx, sy] = trimEndpoint(from, c1x - from.x, c1y - from.y, true);
      const [ex, ey] = trimEndpoint(to, to.x - c2x, to.y - c2y, false);
      return `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`;
    }
    if (link.bow !== undefined) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      // Right-hand perpendicular of from→to direction
      const px = dy / len;
      const py = -dx / len;
      const mx = (from.x + to.x) / 2 + px * link.bow;
      const my = (from.y + to.y) / 2 + py * link.bow;
      const [sx, sy] = trimEndpoint(from, mx - from.x, my - from.y, true);
      const [ex, ey] = trimEndpoint(to, to.x - mx, to.y - my, false);
      return `M${sx},${sy} Q${mx},${my} ${ex},${ey}`;
    }
    // Straight line
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const [sx, sy] = trimEndpoint(from, dx, dy, true);
    const [ex, ey] = trimEndpoint(to, dx, dy, false);
    return `M${sx},${sy} L${ex},${ey}`;
  };

  const diamondPoints = (cx: number, cy: number, half: number) =>
    `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;

  const colorMap: Record<string, string> = {
    data: '#30b808',     // green
    workflow: '#ff7d17', // orange
    calc: '#ff6347',     // tomato
  };

  const styleAttrs = (style: LinkStyle | undefined) => {
    if (style === 'dashed') return {strokeDasharray: '7 5', strokeLinecap: 'butt' as const};
    if (style === 'dotted') return {strokeDasharray: '0 6', strokeLinecap: 'round' as const};
    return {strokeLinecap: 'butt' as const};
  };

  const getInfoMessage = () => {
    if (!hoveredNode) return null;
    const node = nodeById[hoveredNode];
    const descendants = getDescendants(hoveredNode);
    descendants.delete(hoveredNode);
    const count = descendants.size;
    return {
      command: `verdi node show ${node.pk}`,
      text: count > 0
        ? `${node.label} (pk=${node.pk}) — ${count} node${count !== 1 ? 's' : ''} downstream`
        : `${node.label} (pk=${node.pk}) — leaf node, no downstream dependencies`,
    };
  };

  const info = getInfoMessage();

  return (
    <section className="provenance-section" data-reveal>
      <h2>Full provenance. Full control.</h2>
      <p className="provenance-subtitle">
        Every input, calculation, and output is tracked automatically.
        Hover a node to see what depends on it &mdash; then clean up mistakes or reuse successful results.
      </p>
      <div className="provenance-graph-wrapper">
        <svg viewBox="0 0 900 620" className="provenance-graph">
          <defs>
            <marker id="arrow" viewBox="0 0 10 7" refX="9" refY="3.5"
              markerWidth="6" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,3.5 L0,7 Z" fill="#666" opacity="0.75" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 7" refX="9" refY="3.5"
              markerWidth="6" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,3.5 L0,7 Z" fill="#0096de" />
            </marker>
          </defs>

          {/* Links */}
          {provenanceLinks.map((link, i) => {
            const from = nodeById[link.from];
            const to = nodeById[link.to];
            const active = isLinkActive(link.from, link.to);
            const linkColor = active && activeNodes ? '#0096de' : '#666';
            const dim = link.style === 'dotted' ? 0.55 : link.style === 'dashed' ? 0.55 : 0.75;
            return (
              <path key={i}
                d={linkPath(from, to, link)}
                stroke={linkColor}
                strokeWidth={active && activeNodes ? 2.4 : 1.5}
                fill="none"
                opacity={active ? (activeNodes ? 0.9 : dim) : 0.08}
                markerEnd={active && activeNodes ? 'url(#arrow-active)' : 'url(#arrow)'}
                className="provenance-link"
                {...styleAttrs(link.style)}
              />
            );
          })}

          {/* Nodes */}
          {provenanceNodes.map((node) => {
            const active = isActive(node.id);
            const hovered = hoveredNode === node.id;
            const grow = hovered ? 3 : 0;
            return (
              <g key={node.id}
                className={`provenance-node provenance-node--${node.type}`}
                opacity={active ? 1 : 0.2}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{cursor: 'pointer'}}>
                {node.type === 'data' && (
                  <circle cx={node.x} cy={node.y} r={NODE_HALF.data + grow}
                    className="provenance-node-shape provenance-node-data" />
                )}
                {node.type === 'workflow' && (
                  <polygon points={diamondPoints(node.x, node.y, NODE_HALF.workflow + grow)}
                    className="provenance-node-shape provenance-node-workflow" />
                )}
                {node.type === 'calc' && (
                  <rect
                    x={node.x - (NODE_HALF.calc + grow)}
                    y={node.y - (NODE_HALF.calc + grow)}
                    width={(NODE_HALF.calc + grow) * 2}
                    height={(NODE_HALF.calc + grow) * 2}
                    rx={3}
                    className="provenance-node-shape provenance-node-calc" />
                )}
                <text x={node.x} y={node.y + 8}
                  className="provenance-node-label" textAnchor="middle">
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Info bar — shows contextual verdi command */}
        <div className="provenance-info-bar">
          {info ? (
            <>
              <code className="provenance-info-command">{info.command}</code>
              <span className="provenance-info-text">{info.text}</span>
            </>
          ) : (
            <span className="provenance-info-text provenance-info-default">
              Hover any node to see what depends on it
            </span>
          )}
        </div>

        <div className="provenance-legend">
          <span className="provenance-legend-item">
            <span className="provenance-legend-shape provenance-legend-data" /> Data
          </span>
          <span className="provenance-legend-item">
            <span className="provenance-legend-shape provenance-legend-workflow" /> WorkChain
          </span>
          <span className="provenance-legend-item">
            <span className="provenance-legend-shape provenance-legend-calc" /> CalcJob
          </span>
          <span className="provenance-legend-divider" />
          <span className="provenance-legend-item">
            <span className="provenance-legend-edge provenance-legend-edge-solid" /> data
          </span>
          <span className="provenance-legend-item">
            <span className="provenance-legend-edge provenance-legend-edge-dashed" /> logical
          </span>
          <span className="provenance-legend-item">
            <span className="provenance-legend-edge provenance-legend-edge-dotted" /> call
          </span>
        </div>

        <a className="provenance-docs-link"
          href="https://aiida.readthedocs.io/projects/aiida-core/en/stable/topics/provenance/index.html"
          target="_blank" rel="noopener noreferrer">
          Learn more about AiiDA provenance &rarr;
        </a>
      </div>
    </section>
  );
}

const hpcNodes = [
  {name: 'HPC #1', scheduler: 'Slurm', y: 68},
  {name: 'HPC #2', scheduler: 'Slurm', y: 180},
  {name: 'HPC #3', scheduler: 'LSF', y: 293},
  {name: 'HPC #4', scheduler: 'PBS Pro', y: 405},
  {name: 'HPC #N', scheduler: '...', y: 518},
];

// A cute daemon worker sketch as SVG — little horned creature with a wrench (2x size)
function DaemonSketch({cx, cy, id}: {cx: number; cy: number; id: string}) {
  return (
    <g>
      {/* Body — round little guy */}
      <ellipse cx={cx} cy={cy + 12} rx="44" ry="36" fill="#0096de" opacity="0.12" />
      {/* Head */}
      <circle cx={cx} cy={cy - 12} r="28" fill="var(--color-bg-surface)" stroke="#0096de" strokeWidth="2" />
      {/* Horns — cute pointy ones */}
      <path d={`M${cx - 18},${cy - 34} L${cx - 26},${cy - 56} L${cx - 10},${cy - 38}`} fill="#e85d04" opacity="0.7" />
      <path d={`M${cx + 18},${cy - 34} L${cx + 26},${cy - 56} L${cx + 10},${cy - 38}`} fill="#e85d04" opacity="0.7" />
      {/* Eyes — beady and focused */}
      <circle cx={cx - 10} cy={cy - 16} r="5" fill="#1e1e2e" />
      <circle cx={cx + 10} cy={cy - 16} r="5" fill="#1e1e2e" />
      <circle cx={cx - 8.4} cy={cy - 18} r="1.6" fill="white" />
      <circle cx={cx + 11.6} cy={cy - 18} r="1.6" fill="white" />
      {/* Mouth — determined smile */}
      <path d={`M${cx - 8},${cy - 2} Q${cx},${cy + 6} ${cx + 8},${cy - 2}`} fill="none" stroke="#1e1e2e" strokeWidth="1.5" strokeLinecap="round" />
      {/* Wrench in hand */}
      <line x1={cx + 28} y1={cy + 4} x2={cx + 52} y2={cy - 20} stroke="#888" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx + 54} cy={cy - 24} r="8" fill="none" stroke="#888" strokeWidth="2.5" />
      {/* Tiny tail */}
      <path d={`M${cx - 16},${cy + 36} Q${cx - 40},${cy + 44} ${cx - 32},${cy + 24}`} fill="none" stroke="#e85d04" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      {/* Label */}
      <text x={cx} y={cy + 62} textAnchor="middle" className="daemon-sublabel">{id}</text>
    </g>
  );
}

function HighThroughput(): ReactNode {
  // Layout: AiiDA(120, centered) → Queue → Workers(460) → HPCs(880)
  const daemon1 = {x: 460, y: 175};
  const daemon2 = {x: 460, y: 410};
  const aiidaX = 120;
  const aiidaY = (daemon1.y + daemon2.y) / 2; // centered between workers = 292.5
  const hpcX = 880;
  const daemons = [daemon1, daemon2];

  // Both workers connect to all HPCs
  const hpcStreams: {d: string; variant: number}[] = [];
  daemons.forEach((daemon) => {
    hpcNodes.forEach((node) => {
      [-8, 0, 8].forEach((off, vi) => {
        const cy1 = daemon.y + (node.y - daemon.y) * 0.3 + off * 2;
        const cy2 = daemon.y + (node.y - daemon.y) * 0.7 + off;
        hpcStreams.push({
          d: `M${daemon.x + 60},${daemon.y + off * 0.5} C${daemon.x + 170},${cy1} ${hpcX - 150},${cy2} ${hpcX - 45},${node.y + off * 0.5}`,
          variant: vi,
        });
      });
    });
  });

  // Synced with daemon orbit dots (3s period, 12→3→6→9 o'clock clockwise).
  // B1 (blue orbit) hits 3 o'clock at 25% = 0.75s → burst of blue dots emit to all HPCs.
  // G1 (green orbit) hits 3 o'clock at 25% of its offset cycle → green dots from all HPCs converge.
  // Center stream (variant=1) indices per daemon:
  const centerStreams: {streamIdx: number; daemonIdx: number}[] = [];
  hpcStreams.forEach((s, si) => {
    if (s.variant !== 1) return;
    const pairIdx = Math.floor(si / 3);
    centerStreams.push({
      streamIdx: si,
      daemonIdx: Math.floor(pairIdx / hpcNodes.length),
    });
  });

  return (
    <section className="throughput-section" data-reveal>
      <h2>Max efficiency — when concurrency meets parallelism</h2>
      <p className="throughput-subtitle">
        AiiDA's event-driven daemon workers submit, monitor, and retrieve across
        multiple machines simultaneously. Scale up by adding more workers — fully checkpointed.
      </p>

      <div className="throughput-wrapper">
        <svg viewBox="0 0 1060 585" className="throughput-visual">
          <defs>
            <radialGradient id="daemon-glow-1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0096de" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0096de" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="daemon-glow-2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0096de" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0096de" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* === AiiDA BOX (tall, spans both queue lanes) === */}
          <rect x={aiidaX - 50} y={daemon1.y - 40} width="100" height={daemon2.y - daemon1.y + 80} rx="12"
            fill="var(--color-bg-surface)" stroke="#0096de" strokeWidth="2" />
          <image href={`${base}/img/favicon.png`} x={aiidaX - 22} y={aiidaY - 24} width="44" height="44" />
          <text x={aiidaX} y={aiidaY + 36} textAnchor="middle" className="wc-label">AiiDA</text>

          {/* === DAEMON GLOWS === */}
          <circle cx={daemon1.x} cy={daemon1.y} r="80" fill="url(#daemon-glow-1)" className="daemon-glow-ring" />
          <circle cx={daemon2.x} cy={daemon2.y} r="80" fill="url(#daemon-glow-2)" className="daemon-glow-ring" style={{animationDelay: '1.5s'}} />

          {/* === WORKER → HPC STREAMS === */}
          {hpcStreams.map((s, i) => (
            <g key={`hs-${i}`}>
              <path id={`hp-${i}`} d={s.d} fill="none" stroke="none" />
              <path d={s.d} fill="none" stroke="#0096de" strokeWidth={s.variant === 1 ? 1 : 0.5} opacity={s.variant === 1 ? 0.12 : 0.06} className="throughput-stream-line" />
            </g>
          ))}
          {/* All dots share SAME begin & dur as B1 — guarantees sync.
               B1 at 3 o'clock = 25%. G1 at 3 o'clock = 75% (B1 + 50%).
               Blue: emit 25%, arrive HPC 90% (~2s travel).
               Green: depart HPC ~8%, arrive daemon 75% (~2s travel, synced with G1). */}
          {centerStreams.map((cs, i) => {
            const di = cs.daemonIdx;
            const b = `${di * 1.5}s`; // same begin as B1
            return (
              <g key={`sd-${i}`}>
                {/* Blue submit: hold→emit at 25%→arrive HPC at 90%→hold */}
                <circle r="2.5" fill="#0096de" opacity="0">
                  <animateMotion dur="3s" repeatCount="indefinite" begin={b}
                    keyPoints="0;0;1;1" keyTimes="0;0.25;0.90;1" calcMode="linear">
                    <mpath href={`#hp-${cs.streamIdx}`} />
                  </animateMotion>
                  <animate attributeName="opacity" dur="3s" repeatCount="indefinite" begin={b}
                    values="0;0;0.8;0.8;0;0" keyTimes="0;0.24;0.26;0.89;0.91;1" calcMode="linear" />
                </circle>
                {/* Green retrieve: hold at HPC→depart ~8%→arrive daemon at 75%→hold */}
                <circle r="2.5" fill="#30b808" opacity="0">
                  <animateMotion dur="3s" repeatCount="indefinite" begin={b}
                    keyPoints="1;1;0;0" keyTimes="0;0.08;0.75;1" calcMode="linear">
                    <mpath href={`#hp-${cs.streamIdx}`} />
                  </animateMotion>
                  <animate attributeName="opacity" dur="3s" repeatCount="indefinite" begin={b}
                    values="0;0;0.8;0.8;0;0" keyTimes="0;0.07;0.09;0.74;0.76;1" calcMode="linear" />
                </circle>
              </g>
            );
          })}

          {/* === DAEMON WORKERS === */}
          <DaemonSketch cx={daemon1.x} cy={daemon1.y} id="AiiDA daemon worker #1" />
          <DaemonSketch cx={daemon2.x} cy={daemon2.y} id="AiiDA daemon worker #2" />

          {/* Orbiting concurrency rings */}
          {daemons.map((d, di) => (
            <g key={`orb-${di}`}>
              <circle cx={d.x} cy={d.y} r="68" fill="none" stroke="#0096de" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 8" />
              <circle r="4" fill="#0096de" opacity="0.6">
                <animateMotion dur="3s" repeatCount="indefinite" begin={`${di * 1.5}s`}
                  path={`M${d.x},${d.y - 68} a68,68 0 1,1 0,136 a68,68 0 1,1 0,-136`} />
              </circle>
              <circle r="3.5" fill="#30b808" opacity="0.6">
                <animateMotion dur="3s" repeatCount="indefinite" begin={`${di * 1.5 + 1.5}s`}
                  path={`M${d.x},${d.y - 68} a68,68 0 1,1 0,136 a68,68 0 1,1 0,-136`} />
              </circle>
            </g>
          ))}

          {/* === HPC MACHINES === */}
          {hpcNodes.map((node, i) => (
            <g key={`hpc-${i}`}>
              <rect x={hpcX - 40} y={node.y - 24} width="145" height="48" rx="6" fill="var(--color-bg-surface)" stroke="var(--device-border)" strokeWidth="1.5" />
              <circle cx={hpcX - 28} cy={node.y - 8} r="3" fill="#30b808" opacity="0.9" className="hpc-led-blink" style={{animationDelay: `${i * 0.3}s`}} />
              <circle cx={hpcX - 18} cy={node.y - 8} r="3" fill="#0096de" opacity="0.9" className="hpc-led-blink" style={{animationDelay: `${i * 0.3 + 0.7}s`}} />
              <text x={hpcX - 28} y={node.y + 8} className="hpc-name">{node.name}</text>
              <text x={hpcX - 28} y={node.y + 20} className="hpc-scheduler">{node.scheduler}</text>
              {[0, 1, 2, 3, 4].map(j => (
                <rect key={j} x={hpcX + 52 + j * 11} y={node.y - 16} width="8" height={12 + (i + j) % 3 * 6} rx="1.5"
                  fill={j < 3 ? '#30b808' : j === 3 ? '#0096de' : '#ccc'} opacity={j < 3 ? 0.5 : j === 3 ? 0.7 : 0.3}
                  className={j === 3 ? 'hpc-bar-pulse' : ''} />
              ))}
              {/* Rectangular orbit track around HPC box */}
              <rect x={hpcX - 44} y={node.y - 28} width="153" height="56" rx="4"
                fill="none" stroke="#e85d04" strokeWidth="0.7" opacity="0.15" strokeDasharray="4 6" />
              {/* O1: at 9 o'clock when blue arrives. dur=1.5s syncs with both daemons (1.5s apart). */}
              <circle r="4" fill="#e85d04" opacity="0.7">
                <animateMotion dur="1.5s" repeatCount="indefinite" begin="-0.30s"
                  path={`M${hpcX - 44},${node.y} L${hpcX - 44},${node.y - 28} L${hpcX + 109},${node.y - 28} L${hpcX + 109},${node.y + 28} L${hpcX - 44},${node.y + 28} L${hpcX - 44},${node.y}`} />
              </circle>
              {/* O2: at 9 o'clock when green departs. dur=1.5s syncs with both daemons. */}
              <circle r="3" fill="#e85d04" opacity="0.5">
                <animateMotion dur="1.5s" repeatCount="indefinite" begin="-1.25s"
                  path={`M${hpcX - 44},${node.y} L${hpcX - 44},${node.y - 28} L${hpcX + 109},${node.y - 28} L${hpcX + 109},${node.y + 28} L${hpcX - 44},${node.y + 28} L${hpcX - 44},${node.y}`} />
              </circle>
            </g>
          ))}
        </svg>

        <div className="throughput-footer">
          <div className="throughput-stats-row">
            <span className="throughput-stat-pill">
              <span className="throughput-stat-dot-sm" style={{background: '#0096de'}} /> Submitting
            </span>
            <span className="throughput-stat-pill">
              <span className="throughput-stat-dot-sm" style={{background: '#e85d04'}} /> Running on HPC
            </span>
            <span className="throughput-stat-pill">
              <span className="throughput-stat-dot-sm" style={{background: '#30b808'}} /> Retrieving
            </span>
          </div>
          <span className="throughput-rate">~10,000 processes/hour</span>
          <span className="throughput-checkpoint">Full checkpointing — restart from any point</span>
        </div>
      </div>
    </section>
  );
}

function GanttPrototype(): ReactNode {
  // --- Data: HPC lanes ---
  const lanes = [
    { name: 'Slurm cluster', scheduler: 'SLURM' },
    { name: 'PBS cluster', scheduler: 'PBS Pro' },
    { name: 'LSF cluster', scheduler: 'LSF' },
  ];

  // --- Layout constants ---
  const svgW = 900;
  const svgH = 300;
  const labelW = 140;       // left gutter for lane labels
  const laneH = 68;         // height of each lane
  const laneGap = 12;       // vertical gap between lanes
  const lanesTop = 40;      // top margin above first lane
  const barH = 22;          // bar height
  const barR = 4;           // bar corner radius

  // Colors
  const blue = '#0096de';
  const orange = '#e85d04';
  const green = '#30b808';

  // --- Job definitions ---
  // Each job: { lane, row (0 or 1 within lane), x, phases: [{width, color}] }
  // Phases animate sequentially: submit (blue) -> run (orange) -> complete (green)
  // Stagger with animDelay so jobs appear at different stages.
  interface Phase {
    width: number;
    color: string;
    label: string;
  }

  interface Job {
    lane: number;
    row: number;
    x: number;
    phases: Phase[];
    animDelay: number;  // seconds
    totalDur: number;   // seconds for full cycle
  }

  const jobs: Job[] = [
    // Lane 0 — Slurm cluster
    { lane: 0, row: 0, x: 0,   phases: [
      { width: 55,  color: blue,   label: 'submit' },
      { width: 120, color: orange, label: 'running' },
      { width: 40,  color: green,  label: 'retrieve' },
    ], animDelay: 0, totalDur: 8 },
    { lane: 0, row: 1, x: 30,  phases: [
      { width: 45,  color: blue,   label: 'submit' },
      { width: 150, color: orange, label: 'running' },
      { width: 35,  color: green,  label: 'retrieve' },
    ], animDelay: 1.2, totalDur: 8 },
    { lane: 0, row: 0, x: 230, phases: [
      { width: 50,  color: blue,   label: 'submit' },
      { width: 100, color: orange, label: 'running' },
      { width: 45,  color: green,  label: 'retrieve' },
    ], animDelay: 2.5, totalDur: 8 },
    { lane: 0, row: 1, x: 250, phases: [
      { width: 40,  color: blue,   label: 'submit' },
      { width: 130, color: orange, label: 'running' },
      { width: 50,  color: green,  label: 'retrieve' },
    ], animDelay: 3.0, totalDur: 8 },
    { lane: 0, row: 0, x: 440, phases: [
      { width: 60,  color: blue,   label: 'submit' },
      { width: 90,  color: orange, label: 'running' },
      { width: 35,  color: green,  label: 'retrieve' },
    ], animDelay: 0.8, totalDur: 8 },
    { lane: 0, row: 1, x: 475, phases: [
      { width: 50,  color: blue,   label: 'submit' },
      { width: 110, color: orange, label: 'running' },
      { width: 40,  color: green,  label: 'retrieve' },
    ], animDelay: 4.5, totalDur: 8 },

    // Lane 1 — PBS cluster
    { lane: 1, row: 0, x: 10,  phases: [
      { width: 50,  color: blue,   label: 'submit' },
      { width: 140, color: orange, label: 'running' },
      { width: 45,  color: green,  label: 'retrieve' },
    ], animDelay: 0.5, totalDur: 8 },
    { lane: 1, row: 1, x: 50,  phases: [
      { width: 55,  color: blue,   label: 'submit' },
      { width: 100, color: orange, label: 'running' },
      { width: 40,  color: green,  label: 'retrieve' },
    ], animDelay: 2.0, totalDur: 8 },
    { lane: 1, row: 0, x: 260, phases: [
      { width: 45,  color: blue,   label: 'submit' },
      { width: 160, color: orange, label: 'running' },
      { width: 35,  color: green,  label: 'retrieve' },
    ], animDelay: 1.5, totalDur: 8 },
    { lane: 1, row: 1, x: 220, phases: [
      { width: 60,  color: blue,   label: 'submit' },
      { width: 80,  color: orange, label: 'running' },
      { width: 50,  color: green,  label: 'retrieve' },
    ], animDelay: 3.8, totalDur: 8 },
    { lane: 1, row: 0, x: 500, phases: [
      { width: 50,  color: blue,   label: 'submit' },
      { width: 120, color: orange, label: 'running' },
      { width: 40,  color: green,  label: 'retrieve' },
    ], animDelay: 4.0, totalDur: 8 },

    // Lane 2 — LSF cluster
    { lane: 2, row: 0, x: 20,  phases: [
      { width: 60,  color: blue,   label: 'submit' },
      { width: 110, color: orange, label: 'running' },
      { width: 50,  color: green,  label: 'retrieve' },
    ], animDelay: 0.3, totalDur: 8 },
    { lane: 2, row: 1, x: 0,   phases: [
      { width: 45,  color: blue,   label: 'submit' },
      { width: 130, color: orange, label: 'running' },
      { width: 35,  color: green,  label: 'retrieve' },
    ], animDelay: 1.8, totalDur: 8 },
    { lane: 2, row: 0, x: 240, phases: [
      { width: 55,  color: blue,   label: 'submit' },
      { width: 95,  color: orange, label: 'running' },
      { width: 45,  color: green,  label: 'retrieve' },
    ], animDelay: 3.5, totalDur: 8 },
    { lane: 2, row: 1, x: 200, phases: [
      { width: 50,  color: blue,   label: 'submit' },
      { width: 140, color: orange, label: 'running' },
      { width: 40,  color: green,  label: 'retrieve' },
    ], animDelay: 2.8, totalDur: 8 },
    { lane: 2, row: 0, x: 450, phases: [
      { width: 45,  color: blue,   label: 'submit' },
      { width: 115, color: orange, label: 'running' },
      { width: 50,  color: green,  label: 'retrieve' },
    ], animDelay: 5.0, totalDur: 8 },
    { lane: 2, row: 1, x: 430, phases: [
      { width: 55,  color: blue,   label: 'submit' },
      { width: 90,  color: orange, label: 'running' },
      { width: 45,  color: green,  label: 'retrieve' },
    ], animDelay: 0.6, totalDur: 8 },
  ];

  // --- Hover state ---
  const [hoveredJob, setHoveredJob] = useState<number | null>(null);

  // --- Compute lane Y positions ---
  const laneY = (laneIdx: number) => lanesTop + laneIdx * (laneH + laneGap);

  // Timeline area
  const timelineX = labelW;
  const timelineW = svgW - labelW - 20;

  return (
    <section className="throughput-section" data-reveal>
      <h2>Massively parallel job orchestration</h2>
      <p className="throughput-subtitle">
        AiiDA's daemon continuously submits, monitors, and retrieves calculations across
        multiple HPC machines simultaneously — all fully checkpointed and restartable.
      </p>

      <div className="throughput-wrapper">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="gantt-chart"
          role="img"
          aria-label="Gantt chart showing parallel CalcJobs running across multiple HPC clusters"
        >
          <defs>
            {/* Clip region so bars don't overflow the timeline area */}
            <clipPath id="gantt-timeline-clip">
              <rect x={timelineX} y={0} width={timelineW} height={svgH} />
            </clipPath>
          </defs>

          {/* --- Lane backgrounds and labels --- */}
          {lanes.map((lane, i) => {
            const y = laneY(i);
            return (
              <g key={`lane-${i}`}>
                {/* Lane background stripe */}
                <rect
                  x={timelineX}
                  y={y}
                  width={timelineW}
                  height={laneH}
                  rx="6"
                  className="gantt-lane-bg"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />

                {/* Lane label */}
                <text
                  x={labelW - 12}
                  y={y + laneH / 2 - 6}
                  textAnchor="end"
                  className="gantt-lane-name"
                >
                  {lane.name}
                </text>
                <text
                  x={labelW - 12}
                  y={y + laneH / 2 + 10}
                  textAnchor="end"
                  className="gantt-lane-scheduler"
                >
                  {lane.scheduler}
                </text>

                {/* Status LED */}
                <circle
                  cx={labelW - 70}
                  cy={y + laneH / 2}
                  r="4"
                  fill={green}
                  className="gantt-led"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
              </g>
            );
          })}

          {/* --- Grid lines (subtle time markers) --- */}
          {[0.25, 0.5, 0.75].map((frac, i) => (
            <line
              key={`grid-${i}`}
              x1={timelineX + timelineW * frac}
              y1={lanesTop - 4}
              x2={timelineX + timelineW * frac}
              y2={lanesTop + lanes.length * (laneH + laneGap) - laneGap + 4}
              className="gantt-grid-line"
            />
          ))}

          {/* --- CalcJob bars --- */}
          <g clipPath="url(#gantt-timeline-clip)">
            {jobs.map((job, jobIdx) => {
              const y = laneY(job.lane);
              const barY = y + 6 + job.row * (barH + 6);
              // Accumulate x positions for each phase
              let phaseX = timelineX + job.x;
              const isHovered = hoveredJob === jobIdx;

              // Compute total phase widths for the animation
              const totalWidth = job.phases.reduce((sum, p) => sum + p.width, 0);

              return (
                <g
                  key={`job-${jobIdx}`}
                  className={`gantt-job-group ${isHovered ? 'gantt-job-group--hovered' : ''}`}
                  onMouseEnter={() => setHoveredJob(jobIdx)}
                  onMouseLeave={() => setHoveredJob(null)}
                  style={{
                    '--gantt-anim-delay': `${job.animDelay}s`,
                    '--gantt-total-dur': `${job.totalDur}s`,
                  } as Record<string, string>}
                >
                  {job.phases.map((phase, pi) => {
                    const px = phaseX;
                    phaseX += phase.width;

                    // Phase fraction within total for staggered reveal
                    const phaseFrac = job.phases.slice(0, pi).reduce((s, p) => s + p.width, 0) / totalWidth;

                    return (
                      <rect
                        key={`phase-${pi}`}
                        x={px}
                        y={barY}
                        width={phase.width}
                        height={barH}
                        rx={pi === 0 ? barR : 0}
                        ry={pi === 0 ? barR : 0}
                        fill={phase.color}
                        className={`gantt-bar gantt-bar--${phase.label}`}
                        style={{
                          '--gantt-bar-delay': `${job.animDelay + phaseFrac * 2.5}s`,
                          // Round right corners on last phase
                          ...(pi === job.phases.length - 1
                            ? { rx: barR, ry: barR }
                            : {}),
                        } as Record<string, string>}
                      />
                    );
                  })}

                  {/* Thin progress sweep highlight */}
                  <rect
                    x={timelineX + job.x}
                    y={barY}
                    width={totalWidth}
                    height={barH}
                    rx={barR}
                    className="gantt-bar-sweep"
                    style={{
                      '--gantt-sweep-delay': `${job.animDelay}s`,
                      '--gantt-sweep-dur': `${job.totalDur}s`,
                    } as Record<string, string>}
                  />

                  {/* Checkpoint marker (small diamond) at phase transitions */}
                  {job.phases.slice(0, -1).reduce<{ el: ReactNode[]; acc: number }>(
                    (state, phase, pi) => {
                      const cx = timelineX + job.x + state.acc + phase.width;
                      state.el.push(
                        <g key={`ckpt-${pi}`} className="gantt-checkpoint">
                          <rect
                            x={cx - 3}
                            y={barY + barH / 2 - 3}
                            width={6}
                            height={6}
                            transform={`rotate(45 ${cx} ${barY + barH / 2})`}
                            fill="white"
                            opacity="0.9"
                            className="gantt-checkpoint-diamond"
                            style={{
                              '--gantt-ckpt-delay': `${job.animDelay + ((state.acc + phase.width) / totalWidth) * 2.5}s`,
                            } as Record<string, string>}
                          />
                        </g>
                      );
                      state.acc += phase.width;
                      return state;
                    },
                    { el: [], acc: 0 }
                  ).el}
                </g>
              );
            })}
          </g>

          {/* --- "Now" cursor line sweeping across --- */}
          <line
            x1={timelineX}
            y1={lanesTop - 8}
            x2={timelineX}
            y2={lanesTop + lanes.length * (laneH + laneGap) - laneGap + 8}
            className="gantt-now-line"
          />

          {/* --- Time axis label --- */}
          <text
            x={timelineX + timelineW / 2}
            y={svgH - 8}
            textAnchor="middle"
            className="gantt-time-label"
          >
            time →
          </text>
        </svg>

        {/* --- Footer with legend and stats --- */}
        <div className="throughput-footer">
          <div className="throughput-stats-row">
            <span className="throughput-stat-pill">
              <span className="throughput-stat-dot-sm" style={{ background: blue }} /> Queued / Submitting
            </span>
            <span className="throughput-stat-pill">
              <span className="throughput-stat-dot-sm" style={{ background: orange }} /> Running on HPC
            </span>
            <span className="throughput-stat-pill">
              <span className="throughput-stat-dot-sm" style={{ background: green }} /> Completed / Retrieved
            </span>
          </div>
          <span className="throughput-rate">~10,000 processes/hour</span>
          <span className="throughput-checkpoint">Full checkpointing — restart from any point</span>
        </div>
      </div>
    </section>
  );
}


function TerminalPrototype(): ReactNode {
  const processes = [
    { pk: 142, created: '2m ago',  process: 'PwCalculation',  state: 'running'  as const, computer: 'Daint (Slurm)' },
    { pk: 143, created: '2m ago',  process: 'PwCalculation',  state: 'running'  as const, computer: 'Piz Daint (Slurm)' },
    { pk: 138, created: '5m ago',  process: 'PwCalculation',  state: 'finished' as const, computer: 'Euler (LSF)' },
    { pk: 139, created: '5m ago',  process: 'CpCalculation',  state: 'finished' as const, computer: 'Euler (LSF)' },
    { pk: 145, created: '30s ago', process: 'PwCalculation',  state: 'waiting'  as const, computer: 'Fritz (PBS)' },
    { pk: 146, created: '10s ago', process: 'WorkChain',      state: 'waiting'  as const, computer: '\u2014' },
  ];

  const stateIcon = (s: 'running' | 'finished' | 'waiting') => {
    switch (s) {
      case 'running':  return '\u23f5';
      case 'finished': return '\u2713';
      case 'waiting':  return '\u23f3';
    }
  };

  const stateLabel = (s: 'running' | 'finished' | 'waiting') => {
    switch (s) {
      case 'running':  return 'Running';
      case 'finished': return 'Finished';
      case 'waiting':  return 'Waiting';
    }
  };

  return (
    <section className="throughput-section" data-reveal>
      <h2>High-throughput engine</h2>
      <p className="throughput-subtitle">
        AiiDA's daemon workers submit, monitor, and retrieve calculations across
        multiple HPC machines simultaneously — fully checkpointed, fully automated.
      </p>

      <div className="terminal-proto-wrapper">
        <div className="terminal-proto-window">
          {/* --- Title bar --- */}
          <div className="terminal-proto-titlebar">
            <span className="terminal-proto-dot terminal-proto-dot--red" />
            <span className="terminal-proto-dot terminal-proto-dot--yellow" />
            <span className="terminal-proto-dot terminal-proto-dot--green" />
            <span className="terminal-proto-titlebar-text">verdi &mdash; AiiDA CLI</span>
          </div>

          {/* --- Two-panel body --- */}
          <div className="terminal-proto-panels">
            {/* Panel 1: daemon status */}
            <div className="terminal-proto-panel terminal-proto-panel--left">
              <span className="terminal-proto-prompt">$ verdi daemon status</span>
              <div className="terminal-proto-daemon-block">
                <span className="terminal-proto-daemon-line">
                  <span className="terminal-proto-label">Profile: </span>
                  <span className="terminal-proto-value">default</span>
                </span>
                <span className="terminal-proto-daemon-line">
                  <span className="terminal-proto-label">Daemon is </span>
                  <span className="terminal-proto-value--highlight">running</span>
                  <span className="terminal-proto-label"> with PID </span>
                  <span className="terminal-proto-pid">42387</span>
                </span>
                <span className="terminal-proto-daemon-line">
                  <span className="terminal-proto-since">since 2026-03-19 08:12:33</span>
                </span>
                <span className="terminal-proto-daemon-line">
                  <span className="terminal-proto-label">Active workers: </span>
                  <span className="terminal-proto-worker-dot" />
                  <span className="terminal-proto-worker-dot" />
                  <span className="terminal-proto-worker-dot" />
                  <span className="terminal-proto-worker-dot" />
                  <span className="terminal-proto-value--highlight"> 4</span>
                </span>
              </div>
              <div style={{ marginTop: '20px' }}>
                <span className="terminal-proto-prompt">$ </span>
                <span className="terminal-proto-cursor" />
              </div>
            </div>

            {/* Panel 2: process list */}
            <div className="terminal-proto-panel terminal-proto-panel--right">
              <span className="terminal-proto-prompt">$ verdi process list -a -p1</span>

              {/* Table header */}
              <div className="terminal-proto-table-header">
                <span className="terminal-proto-col-pk">PK</span>
                <span className="terminal-proto-col-created">Created</span>
                <span className="terminal-proto-col-process">Process</span>
                <span className="terminal-proto-col-state">State</span>
                <span className="terminal-proto-col-computer">Computer</span>
              </div>
              <span className="terminal-proto-table-divider">{'----  ---------  ----------------  -----------  ----------------'}</span>

              {/* Table rows */}
              <div>
                {processes.map((p, i) => {
                  const hasTransition = i === 4 || i === 5;
                  return (
                    <div key={p.pk} className="terminal-proto-row">
                      <span className="terminal-proto-col-pk">{p.pk}</span>
                      <span className="terminal-proto-col-created">{p.created}</span>
                      <span className="terminal-proto-col-process">{p.process}</span>
                      <span className="terminal-proto-col-state" style={{ position: 'relative' }}>
                        {hasTransition ? (
                          <>
                            <span className={`terminal-proto-state terminal-proto-state--${p.state} terminal-proto-state-phase-1`}>
                              {stateIcon(p.state)} {stateLabel(p.state)}
                            </span>
                            <span className="terminal-proto-state terminal-proto-state--running terminal-proto-state-phase-2">
                              {stateIcon('running')} {stateLabel('running')}
                            </span>
                          </>
                        ) : (
                          <span className={`terminal-proto-state terminal-proto-state--${p.state}`}>
                            {stateIcon(p.state)} {stateLabel(p.state)}
                          </span>
                        )}
                      </span>
                      <span className="terminal-proto-col-computer">{p.computer}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '12px' }}>
                <span className="terminal-proto-output">
                  <span className="terminal-proto-label">Total results: </span>
                  <span className="terminal-proto-value">6</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Footer stats --- */}
        <div className="terminal-proto-footer">
          <div className="terminal-proto-stats-row">
            <span className="terminal-proto-stat-pill">
              <span className="terminal-proto-stat-dot" style={{ background: '#0096de' }} /> Submitting
            </span>
            <span className="terminal-proto-stat-pill">
              <span className="terminal-proto-stat-dot" style={{ background: '#e85d04' }} /> Running on HPC
            </span>
            <span className="terminal-proto-stat-pill">
              <span className="terminal-proto-stat-dot" style={{ background: '#30b808' }} /> Retrieved
            </span>
          </div>
          <span className="terminal-proto-rate">~10,000 processes/hour</span>
          <span className="terminal-proto-checkpoint">Fully checkpointed — restart from any point</span>
        </div>
      </div>
    </section>
  );
}


function FlowPrototype(): ReactNode {
  // ─── Layout constants ───
  // AiiDA box (left)
  const aiidaX = 100;
  const aiidaY = 200;
  const aiidaW = 110;
  const aiidaH = 130;

  // Workers (middle column)
  const workers = [
    { id: 1, x: 340, y: 130, label: 'Worker #1' },
    { id: 2, x: 340, y: 200, label: 'Worker #2' },
    { id: 3, x: 340, y: 270, label: 'Worker #3' },
  ];
  const workerW = 100;
  const workerH = 36;

  // HPC machines (right column)
  const hpcs = [
    { id: 1, x: 650, y: 60,  name: 'HPC #1', scheduler: 'Slurm' },
    { id: 2, x: 650, y: 140, name: 'HPC #2', scheduler: 'Slurm' },
    { id: 3, x: 650, y: 220, name: 'HPC #3', scheduler: 'LSF' },
    { id: 4, x: 650, y: 300, name: 'HPC #4', scheduler: 'PBS Pro' },
    { id: 5, x: 650, y: 380, name: 'HPC #5', scheduler: 'SGE' },
  ];
  const hpcW = 150;
  const hpcH = 48;

  // ─── Bezier curves: AiiDA → Workers ───
  const aiidaToWorkerCurves = workers.map((w) => {
    const x0 = aiidaX + aiidaW / 2; // right edge of AiiDA box
    const y0 = aiidaY;
    const x1 = w.x - workerW / 2; // left edge of worker
    const y1 = w.y;
    const dx = x1 - x0;
    const cpx0 = x0 + dx * 0.5;
    const cpx1 = x0 + dx * 0.5;
    return {
      id: `aiida-w${w.id}`,
      d: `M${x0},${y0} C${cpx0},${y0} ${cpx1},${y1} ${x1},${y1}`,
    };
  });

  // ─── Bezier curves: Workers → HPCs ───
  // Each worker connects to specific HPCs to avoid visual clutter
  const workerHpcMap: [number, number][] = [
    // [workerIndex, hpcIndex]
    [0, 0], [0, 1],
    [1, 1], [1, 2], [1, 3],
    [2, 3], [2, 4],
  ];

  const workerToHpcCurves = workerHpcMap.map(([wi, hi]) => {
    const w = workers[wi];
    const h = hpcs[hi];
    const x0 = w.x + workerW / 2; // right edge of worker
    const y0 = w.y;
    const x1 = h.x - hpcW / 2; // left edge of HPC
    const y1 = h.y;
    const dx = x1 - x0;
    const cpx0 = x0 + dx * 0.45;
    const cpx1 = x0 + dx * 0.55;
    return {
      id: `w${wi}-h${hi}`,
      d: `M${x0},${y0} C${cpx0},${y0} ${cpx1},${y1} ${x1},${y1}`,
      workerIdx: wi,
      hpcIdx: hi,
    };
  });

  // Animation timing: stagger dots so they don't all move in sync
  const dotDur = 3; // seconds per cycle

  return (
    <section className="throughput-section flow-proto-section" data-reveal>
      <h2>High-throughput engine</h2>
      <p className="flow-proto-subtitle">
        AiiDA's daemon distributes calculations across multiple HPC machines
        simultaneously — submitting jobs, monitoring progress, and retrieving
        results, all fully checkpointed.
      </p>

      <div className="flow-proto-wrapper">
        <svg viewBox="0 0 900 450" className="flow-proto-svg">
          <defs>
            {/* Glow gradients for workers */}
            {workers.map((w) => (
              <radialGradient key={`glow-${w.id}`} id={`flow-glow-${w.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0096de" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0096de" stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* ═══ AiiDA Box ═══ */}
          <rect
            x={aiidaX - aiidaW / 2} y={aiidaY - aiidaH / 2}
            width={aiidaW} height={aiidaH}
            rx="10"
            className="flow-proto-node-rect"
            stroke="#0096de"
          />
          <text x={aiidaX} y={aiidaY - 12} textAnchor="middle" className="flow-proto-aiida-label">
            AiiDA
          </text>
          <text x={aiidaX} y={aiidaY + 6} textAnchor="middle" className="flow-proto-aiida-sublabel">
            engine
          </text>
          {/* Small icon hint: three stacked lines representing the daemon */}
          <g opacity="0.4">
            {[0, 1, 2].map((i) => (
              <rect key={i} x={aiidaX - 16} y={aiidaY + 18 + i * 10} width={32} height={5} rx={2}
                fill="#0096de" opacity={0.3 + i * 0.2} />
            ))}
          </g>

          {/* ═══ AiiDA → Worker curves ═══ */}
          {aiidaToWorkerCurves.map((c) => (
            <g key={c.id}>
              <path id={c.id} d={c.d} fill="none" stroke="none" />
              <path d={c.d} className="flow-proto-curve" stroke="#0096de" />
            </g>
          ))}

          {/* ═══ Worker → HPC curves ═══ */}
          {workerToHpcCurves.map((c) => (
            <g key={c.id}>
              <path id={c.id} d={c.d} fill="none" stroke="none" />
              <path d={c.d} className="flow-proto-curve" stroke="#0096de" />
            </g>
          ))}

          {/* ═══ Animated dots on Worker → HPC curves ═══ */}
          {workerToHpcCurves.map((c, i) => {
            const stagger = (i * 0.4) % dotDur;
            const beginStr = `${stagger}s`;
            return (
              <g key={`dots-${c.id}`}>
                {/* Blue dot: submit (left → right) */}
                <circle r="3" fill="#0096de" opacity="0">
                  <animateMotion
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={beginStr}
                    keyPoints="0;0;1;1"
                    keyTimes="0;0.15;0.75;1"
                    calcMode="linear"
                  >
                    <mpath href={`#${c.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={beginStr}
                    values="0;0;0.85;0.85;0;0"
                    keyTimes="0;0.14;0.16;0.74;0.76;1"
                    calcMode="linear"
                  />
                </circle>
                {/* Green dot: retrieve (right → left) */}
                <circle r="3" fill="#30b808" opacity="0">
                  <animateMotion
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={`${(stagger + dotDur * 0.5) % dotDur}s`}
                    keyPoints="1;1;0;0"
                    keyTimes="0;0.15;0.75;1"
                    calcMode="linear"
                  >
                    <mpath href={`#${c.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={`${(stagger + dotDur * 0.5) % dotDur}s`}
                    values="0;0;0.85;0.85;0;0"
                    keyTimes="0;0.14;0.16;0.74;0.76;1"
                    calcMode="linear"
                  />
                </circle>
              </g>
            );
          })}

          {/* ═══ Animated dots on AiiDA → Worker curves ═══ */}
          {aiidaToWorkerCurves.map((c, i) => {
            const stagger = i * 0.6;
            const beginStr = `${stagger}s`;
            return (
              <g key={`dots-aw-${c.id}`}>
                <circle r="2.5" fill="#0096de" opacity="0">
                  <animateMotion
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={beginStr}
                    keyPoints="0;0;1;1"
                    keyTimes="0;0.05;0.55;1"
                    calcMode="linear"
                  >
                    <mpath href={`#${c.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={beginStr}
                    values="0;0;0.7;0.7;0;0"
                    keyTimes="0;0.04;0.06;0.54;0.56;1"
                    calcMode="linear"
                  />
                </circle>
                <circle r="2.5" fill="#30b808" opacity="0">
                  <animateMotion
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={`${stagger + 1.5}s`}
                    keyPoints="1;1;0;0"
                    keyTimes="0;0.05;0.55;1"
                    calcMode="linear"
                  >
                    <mpath href={`#${c.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    dur={`${dotDur}s`}
                    repeatCount="indefinite"
                    begin={`${stagger + 1.5}s`}
                    values="0;0;0.7;0.7;0;0"
                    keyTimes="0;0.04;0.06;0.54;0.56;1"
                    calcMode="linear"
                  />
                </circle>
              </g>
            );
          })}

          {/* ═══ Worker nodes ═══ */}
          {workers.map((w) => (
            <g key={`worker-${w.id}`}>
              {/* Subtle glow */}
              <circle
                cx={w.x} cy={w.y} r="50"
                fill={`url(#flow-glow-${w.id})`}
                className="flow-proto-glow"
                style={{ animationDelay: `${(w.id - 1) * 1}s` }}
              />
              {/* Node rectangle */}
              <rect
                x={w.x - workerW / 2} y={w.y - workerH / 2}
                width={workerW} height={workerH}
                rx="6"
                className="flow-proto-node-rect"
                stroke="#0096de"
              />
              <text x={w.x} y={w.y + 4} textAnchor="middle" className="flow-proto-label">
                {w.label}
              </text>
            </g>
          ))}

          {/* ═══ HPC machine nodes ═══ */}
          {hpcs.map((h, i) => (
            <g key={`hpc-${h.id}`}>
              {/* Main box */}
              <rect
                x={h.x - hpcW / 2} y={h.y - hpcH / 2}
                width={hpcW} height={hpcH}
                rx="6"
                className="flow-proto-node-rect"
                stroke="var(--color-border)"
                strokeWidth="1.5"
              />
              {/* Status LEDs */}
              <circle
                cx={h.x - hpcW / 2 + 14} cy={h.y - 10}
                r="3" fill="#30b808" opacity="0.8"
                className="flow-proto-led-blink"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              <circle
                cx={h.x - hpcW / 2 + 24} cy={h.y - 10}
                r="3" fill="#0096de" opacity="0.8"
                className="flow-proto-led-blink"
                style={{ animationDelay: `${i * 0.3 + 0.6}s` }}
              />
              {/* Name label */}
              <text
                x={h.x - hpcW / 2 + 14} y={h.y + 7}
                className="flow-proto-label"
                style={{ fontSize: '10px' }}
              >
                {h.name}
              </text>
              {/* Scheduler badge */}
              <text
                x={h.x - hpcW / 2 + 14} y={h.y + 19}
                className="flow-proto-scheduler"
              >
                {h.scheduler}
              </text>
              {/* Mini utilization bars */}
              {[0, 1, 2, 3].map((j) => {
                const barH = 10 + ((i + j) % 3) * 5;
                return (
                  <rect
                    key={j}
                    x={h.x + hpcW / 2 - 42 + j * 10}
                    y={h.y + 10 - barH}
                    width={7} height={barH}
                    rx="1.5"
                    fill={j < 2 ? '#30b808' : j === 2 ? '#e85d04' : '#0096de'}
                    opacity={0.35 + ((i + j) % 3) * 0.15}
                  />
                );
              })}
              {/* Orange processing orbit */}
              <rect
                x={h.x - hpcW / 2 - 3} y={h.y - hpcH / 2 - 3}
                width={hpcW + 6} height={hpcH + 6}
                rx="8"
                fill="none" stroke="#e85d04" strokeWidth="0.6" opacity="0.12"
                strokeDasharray="4 6"
              />
              <circle r="3" fill="#e85d04" opacity="0.55">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${i * 0.35}s`}
                  path={`M${h.x - hpcW / 2 - 3},${h.y} L${h.x - hpcW / 2 - 3},${h.y - hpcH / 2 - 3} L${h.x + hpcW / 2 + 3},${h.y - hpcH / 2 - 3} L${h.x + hpcW / 2 + 3},${h.y + hpcH / 2 + 3} L${h.x - hpcW / 2 - 3},${h.y + hpcH / 2 + 3} Z`}
                />
              </circle>
            </g>
          ))}

          {/* ═══ Column labels ═══ */}
          <text x={aiidaX} y={aiidaY + aiidaH / 2 + 24} textAnchor="middle" className="flow-proto-sublabel"
            style={{ fontSize: '10px', fontWeight: 600 }}>
            Orchestrator
          </text>
          <text x={340} y={310} textAnchor="middle" className="flow-proto-sublabel"
            style={{ fontSize: '10px', fontWeight: 600 }}>
            Daemon Workers
          </text>
          <text x={650} y={420} textAnchor="middle" className="flow-proto-sublabel"
            style={{ fontSize: '10px', fontWeight: 600 }}>
            HPC Resources
          </text>
        </svg>

        {/* Footer with stats */}
        <div className="flow-proto-footer">
          <div className="flow-proto-legend">
            <span className="flow-proto-legend-item">
              <span className="flow-proto-legend-dot" style={{ background: '#0096de' }} /> Submit
            </span>
            <span className="flow-proto-legend-item">
              <span className="flow-proto-legend-dot" style={{ background: '#e85d04' }} /> Running
            </span>
            <span className="flow-proto-legend-item">
              <span className="flow-proto-legend-dot" style={{ background: '#30b808' }} /> Retrieve
            </span>
          </div>
          <span className="flow-proto-rate">~10,000 processes/hour</span>
          <span className="flow-proto-checkpoint">
            Fully checkpointed — restart from any point
          </span>
        </div>
      </div>
    </section>
  );
}

function HighThroughputCombined(): ReactNode {
  // ─── Try-it-out mode ───
  const [tryMode, setTryMode] = useState(false);
  const [syncPhase, setSyncPhase] = useState(-1);
  const [syncRunning, setSyncRunning] = useState(false);

  const handlePhaseChange = useCallback((phase: number, running: boolean) => {
    setSyncPhase(phase);
    setSyncRunning(running);
  }, []);

  // ─── Dynamic terminal state (auto mode) ───
  const TICK_MS = 2000;
  const MAX_VISIBLE = 7;
  const hpcPool = ['HPC #1 (Slurm)', 'HPC #2 (Slurm)', 'HPC #3 (LSF)', 'HPC #4 (PBS)', 'HPC #5 (SGE)'];

  interface TProc {
    pk: number;
    process: string;
    computer: string;
    birthTick: number;
    waitAfter: number;
    runAfter: number;
    finishAfter: number;
    uid: number;
  }

  const nextPk = useRef(142);
  const nextUid = useRef(0);
  const tickRef = useRef(0);

  const makeProc = (tick: number): TProc => {
    const isWC = Math.random() > 0.85;
    const hpc = hpcPool[Math.floor(Math.random() * hpcPool.length)];
    const w = 1;
    const r = w + 1 + Math.floor(Math.random() * 2);
    const f = r + 2 + Math.floor(Math.random() * 3);
    return {
      pk: nextPk.current++,
      process: isWC ? 'WorkChain' : 'CalcJob',
      computer: isWC ? '\u2014' : hpc,
      birthTick: tick,
      waitAfter: w,
      runAfter: r,
      finishAfter: f,
      uid: nextUid.current++,
    };
  };

  const procState = (p: TProc, tick: number) => {
    const age = tick - p.birthTick;
    if (age >= p.finishAfter) return 'finished';
    if (age >= p.runAfter) return 'running';
    if (age >= p.waitAfter) return 'waiting';
    return 'created';
  };

  const [processes, setProcesses] = useState<TProc[]>(() => {
    const init: TProc[] = [];
    for (let i = 0; i < 6; i++) {
      init.push(makeProc(-(10 - i * 2)));
    }
    return init;
  });

  useEffect(() => {
    if (tryMode) return;
    const timer = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      setProcesses(prev => {
        let next = [...prev];
        const justFinished = next.some(p =>
          procState(p, tick - 1) !== 'finished' && procState(p, tick) === 'finished'
        );
        if (justFinished || tick % 3 === 0) {
          next.push(makeProc(tick));
        }
        if (next.length > MAX_VISIBLE) {
          next = next.slice(-MAX_VISIBLE);
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [tryMode]);

  const currentTick = tickRef.current;
  const totalCount = nextPk.current - 142;

  const stateIcon = (s: string) =>
    s === 'running' ? '\u23f5' : s === 'finished' ? '\u2713' : s === 'waiting' ? '\u23f3' : '\u2295';
  const stateLabel = (s: string) =>
    s === 'running' ? 'Running' : s === 'finished' ? 'Finished' : s === 'waiting' ? 'Waiting' : 'Created';
  const formatAge = (birthTick: number) => {
    const secs = Math.max(0, currentTick - birthTick) * (TICK_MS / 1000);
    if (secs < 60) return `${Math.round(secs)}s ago`;
    return `${Math.round(secs / 60)}m ago`;
  };

  // ─── HPC server data ───
  const [hoveredHpc, setHoveredHpc] = useState<number | null>(null);
  const schedulers = [
    {label: 'Slurm', scheduler: 'slurm'},
    {label: 'PBS Pro', scheduler: 'pbspro'},
    {label: 'Torque', scheduler: 'torque'},
    {label: 'SGE', scheduler: 'sge'},
    {label: 'LSF', scheduler: 'lsf'},
    {label: 'Direct', scheduler: 'direct'},
  ];

  // ─── Flowing lines data ───
  const streams = [
    { d: 'M0,100 C80,100 60,50 150,48 S260,70 300,35 S380,10 460,30', delay: 0, opacity: 0.5 },
    { d: 'M0,115 C70,115 80,80 150,75 S240,60 300,65 S370,55 460,50', delay: 0.8, opacity: 0.4 },
    { d: 'M0,105 C90,105 70,65 150,62 S250,85 300,50 S390,30 460,70', delay: 1.6, opacity: 0.3 },
    { d: 'M0,140 C80,140 100,130 150,130 S250,140 300,130 S380,120 460,125', delay: 0.4, opacity: 0.55 },
    { d: 'M0,165 C70,165 80,195 150,200 S260,210 300,220 S370,240 460,230', delay: 1.2, opacity: 0.4 },
    { d: 'M0,180 C90,180 70,215 150,220 S240,240 300,250 S380,265 460,258', delay: 0.3, opacity: 0.5 },
    { d: 'M0,175 C80,175 90,230 150,235 S250,250 300,265 S390,278 460,280', delay: 1.0, opacity: 0.3 },
  ];

  // ─── Auto-mode screen content (single terminal panel inside laptop) ───
  const autoScreenContent = (
      <div className="tp-screen-panel">
        <div className="tp-panel-titlebar">
          <span className="terminal-proto-dot terminal-proto-dot--red" />
          <span className="terminal-proto-dot terminal-proto-dot--yellow" />
          <span className="terminal-proto-dot terminal-proto-dot--green" />
          <span className="tp-panel-title">verdi process list</span>
        </div>
        <div className="tp-panel-content">
          <span className="terminal-proto-prompt">$ watch verdi process list -a</span>
          <div className="terminal-proto-watch-header">
            Every 1.0s: verdi process list -a
          </div>
          <div className="terminal-proto-table-header">
            <span className="terminal-proto-col-pk">PK</span>
            <span className="terminal-proto-col-created">Created</span>
            <span className="terminal-proto-col-process">Process</span>
            <span className="terminal-proto-col-state">State</span>
            <span className="terminal-proto-col-computer">Computer</span>
          </div>
          <span className="terminal-proto-table-divider">{'----  ---------  ----------------  -----------  ----------------'}</span>
          <div className="terminal-proto-process-list">
            {processes.map((p) => {
              const state = procState(p, currentTick);
              const isNew = currentTick - p.birthTick <= 1;
              return (
                <div key={p.uid} className={`terminal-proto-row${isNew ? ' terminal-proto-row--new' : ''}`}>
                  <span className="terminal-proto-col-pk">{p.pk}</span>
                  <span className="terminal-proto-col-created">{formatAge(p.birthTick)}</span>
                  <span className="terminal-proto-col-process">{p.process}</span>
                  <span className="terminal-proto-col-state">
                    <span className={`terminal-proto-state terminal-proto-state--${state}`}>
                      {stateIcon(state)} {stateLabel(state)}
                    </span>
                  </span>
                  <span className="terminal-proto-col-computer">{p.computer}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '12px' }}>
            <span className="terminal-proto-output">
              <span className="terminal-proto-label">Total results: </span>
              <span className="terminal-proto-value">{totalCount}</span>
            </span>
          </div>
        </div>
      </div>
  );

  // ─── Laptop frame builder (same silhouette as LaptopSvg) ───
  const laptopFrame = (screenContent: ReactNode) => (
    <div className="tp-laptop">
      <div className="tp-laptop-lid">
        <div className="tp-laptop-camera" />
        <div className="tp-laptop-screen">
          {screenContent}
        </div>
      </div>
      <svg className="tp-laptop-base" viewBox="0 0 680 50" preserveAspectRatio="none">
        <path d="M82,0 L598,0 L680,38 L0,38 Z"
          fill="var(--device-bg)" stroke="var(--device-border)" strokeWidth="2" />
        <rect x="280" y="8" width="120" height="24" rx="6"
          fill="none" stroke="var(--device-border)" strokeWidth="1" opacity="0.15" />
        <rect x="0" y="38" width="680" height="12" rx="5"
          fill="var(--device-border)" opacity="0.25" />
      </svg>
    </div>
  );

  // ─── Flow bridge with animated lines ───
  const flowBridge = (
    <div className="tp-flow-bridge">
      <svg className="flow-svg" viewBox="0 0 460 290" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tp-flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0096de" stopOpacity="0" />
            <stop offset="20%" stopColor="#0096de" stopOpacity="1" />
            <stop offset="80%" stopColor="#0096de" stopOpacity="1" />
            <stop offset="100%" stopColor="#0096de" stopOpacity="0" />
          </linearGradient>
        </defs>
        {streams.map((s, i) => (
          <path key={i} d={s.d} stroke="url(#tp-flow-grad)" strokeWidth="2"
            fill="none" opacity={s.opacity} className="flow-line" style={{ animationDelay: `${s.delay}s` }} />
        ))}
        {streams.map((s, i) => (
          <path key={`ref-${i}`} id={`tp-flow-path-${i}`} d={s.d} fill="none" stroke="none" />
        ))}
        {/* Blue dots: laptop → HPC */}
        {[0, 2, 3, 5].map((si, i) => (
          <circle key={`dot-fwd-${i}`} r="2.5" fill="#0096de" opacity="0.7">
            <animateMotion dur={`${3 + i * 0.6}s`} repeatCount="indefinite"
              begin={`${streams[si].delay}s`} keyPoints="0;1" keyTimes="0;1">
              <mpath href={`#tp-flow-path-${si}`} />
            </animateMotion>
          </circle>
        ))}
        {/* Green dots: HPC → laptop */}
        {[1, 4, 6].map((si, i) => (
          <circle key={`dot-rev-${i}`} r="2.5" fill="#22aa66" opacity="0.7">
            <animateMotion dur={`${3.5 + i * 0.5}s`} repeatCount="indefinite"
              begin={`${streams[si].delay + 0.5}s`} keyPoints="1;0" keyTimes="0;1">
              <mpath href={`#tp-flow-path-${si}`} />
            </animateMotion>
          </circle>
        ))}
      </svg>
      <div className="transport-gate">
        <div className="transport-gate-inner">
          <div className="gate-card">
            <span className="gate-led gate-led--green" />
            <span className="gate-led gate-led--blue" />
            <span className="gate-card-label">SSH</span>
            <div className="gate-tooltip">verdi computer setup --transport core.ssh_async</div>
          </div>
          <div className="gate-card">
            <span className="gate-led gate-led--green" />
            <span className="gate-led gate-led--blue" />
            <span className="gate-card-label">FirecREST</span>
            <div className="gate-tooltip">pip install aiida-firecrest<br/>verdi computer setup --transport core.ssh_async</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── HPC server column ───
  const serverCol = (
    <div className="tp-server-col">
      <div className="server-stack">
        <svg viewBox="0 0 200 260" className="device-svg device-server" aria-label="HPC server rack">
          <defs>
            <filter id="tp-server-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
            </filter>
          </defs>
          <g filter="url(#tp-server-shadow)">
            <rect x="20" y="8" width="160" height="244" rx="8"
              fill="var(--device-bg)" stroke="var(--device-border)" strokeWidth="3" />
            {schedulers.map((s, i) => {
              const y = 18 + i * 38;
              return (
                <g key={i} className="server-unit"
                  onMouseEnter={() => setHoveredHpc(i)}
                  onMouseLeave={() => setHoveredHpc(null)}>
                  <rect x="30" y={y} width="140" height="32" rx="4"
                    fill="var(--device-screen-bg)" stroke="var(--device-border)" strokeWidth="1" />
                  <circle cx="44" cy={y + 16} r="3" fill="#30b808" opacity="0.9" />
                  <circle cx="56" cy={y + 16} r="3" fill="#0096de" opacity="0.9" />
                  <text x="70" y={y + 20} className="server-label">{s.label}</text>
                  <rect x="138" y={y + 6} width="6" height="20" rx="1" fill="var(--device-border)" opacity="0.2" />
                  <rect x="148" y={y + 6} width="6" height="20" rx="1" fill="var(--device-border)" opacity="0.2" />
                  <rect x="158" y={y + 6} width="6" height="20" rx="1" fill="var(--device-border)" opacity="0.2" />
                </g>
              );
            })}
          </g>
        </svg>
        {hoveredHpc !== null && (
          <div className="tp-server-hover-tooltip">
            verdi computer setup --scheduler {schedulers[hoveredHpc].scheduler}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="hero-section flow-proto-section">
      <ParticleNetwork />
      <div className="hero-header">
        <div className="hero-brand">
          <img src={`${base}/img/aiida-logo-dark.svg`} alt="AiiDA" className="hero-brand-logo hero-brand-logo--dark" />
          <img src={`${base}/img/aiida-logo-light.svg`} alt="AiiDA" className="hero-brand-logo hero-brand-logo--light" />
        </div>
        <p className="hero-subtitle">
          <span className="hero-accent hero-accent--blue">A</span>utomated{' '}
          <span className="hero-accent hero-accent--green">I</span>nteractive{' '}
          <span className="hero-accent hero-accent--green">I</span>nfrastructure and{' '}
          <span className="hero-accent hero-accent--orange">D</span><span className="hero-accent hero-accent--blue">A</span>tabase
          <br />
          for Computational Science
        </p>
      </div>

      {!tryMode ? (
        <>
          <div className="tp-row">
            {laptopFrame(autoScreenContent)}
            <div className="tp-right-group">
              {flowBridge}
              {serverCol}
            </div>
          </div>

          {/* ═══ Footer ═══ */}
          <div className="flow-proto-footer" style={{ maxWidth: '1400px', margin: '1.25rem auto 0' }}>
            <span className="flow-proto-rate">~10,000 processes/hour</span>
            <span className="flow-proto-checkpoint">Fully checkpointed &mdash; restart from any point</span>
          </div>
        </>
      ) : (
        <InteractiveTutorial
          onPhaseChange={handlePhaseChange}
          renderLayout={({ editor, terminal, instructions, expanded, editorExpanded }) => (
            <>
              <div className="tp-row">
                {laptopFrame(
                  <>
                    {!expanded && <div className="tp-screen-panel tp-screen-panel--try">{editor}</div>}
                    {!editorExpanded && <div className="tp-screen-panel tp-screen-panel--try">{terminal}</div>}
                  </>
                )}
                <div className="tp-right-group">
                  {flowBridge}
                  {serverCol}
                </div>
              </div>
              <div className="tp-try-instructions-bar">
                {instructions}
              </div>
            </>
          )}
        />
      )}

      {/* ═══ Try it out toggle ═══ */}
      <div className="throughput-try-toggle">
        {!tryMode ? (
          <button className="button button--primary throughput-try-btn" onClick={() => setTryMode(true)}>
            Try it out yourself {'\u2192'}
          </button>
        ) : (
          <button className="tut-btn tut-btn-back throughput-try-btn" onClick={() => { setTryMode(false); setSyncPhase(-1); setSyncRunning(false); }}>
            {'\u2190'} Back to overview
          </button>
        )}
      </div>
    </section>
  );
}

function MetroPrototype(): ReactNode {
  const lines = [
    { name: 'Slurm', color: '#0096de', id: 'slurm' },
    { name: 'PBS', color: '#30b808', id: 'pbs' },
    { name: 'LSF', color: '#e85d04', id: 'lsf' },
    { name: 'SGE', color: '#9333ea', id: 'sge' },
    { name: 'SSH', color: '#ec4899', id: 'ssh' },
  ];

  // Metro map geometry constants
  const startX = 120;         // AiiDA station x
  const endX = 790;           // HPC station x
  const trunkEndX = 240;      // where lines leave the shared trunk
  const mergeStartX = 650;    // where lines begin converging toward endpoints
  const yCenter = 175;        // vertical center
  const lineSpacing = 60;     // vertical space between lines at their widest
  const stationR = 8;         // station circle radius
  const transferX = 440;      // transfer station x position

  // Y positions for each line at mid-section (fully diverged)
  const lineYs = lines.map((_, i) => yCenter + (i - 2) * lineSpacing);

  // Build metro-style paths with 45-degree bends
  const buildPath = (index: number): string => {
    const midY = lineYs[index];
    // Trunk: all lines start horizontal from AiiDA station
    // Then 45-degree diagonal to their lane
    // Then horizontal across the middle
    // Then 45-degree diagonal converging toward their endpoint
    // Then horizontal to the HPC station

    const diagLen = Math.abs(midY - yCenter); // vertical offset determines diagonal length

    // Going out from trunk
    const forkX = trunkEndX;
    const forkEndX = forkX + diagLen; // 45-degree: dx = dy

    // Converging toward endpoint
    // Each line ends at its own Y at the HPC station side
    const endY = midY;
    const mergeX = mergeStartX;

    if (diagLen === 0) {
      // Center line — straight through
      return `M ${startX} ${yCenter} L ${endX} ${yCenter}`;
    }

    return [
      `M ${startX} ${yCenter}`,
      `L ${forkX} ${yCenter}`,
      `L ${forkEndX} ${midY}`,
      `L ${mergeX} ${midY}`,
      `L ${endX} ${endY}`,
    ].join(' ');
  };

  // Transfer station: where lines cross at a shared point
  const transferYs = lineYs;

  // Dot animation durations staggered per line
  const durations = [4.2, 5.0, 4.6, 5.4, 3.8];
  const dotOffsets = [0, 0.8, 1.6, 0.4, 1.2];

  return (
    <section className="throughput-section" data-reveal>
      <h2>Parallel execution across machines</h2>
      <p className="throughput-subtitle">
        AiiDA dispatches calculations to multiple HPC schedulers in parallel —
        each job routed, monitored, and retrieved automatically.
      </p>

      <div className="metro-wrapper">
        <svg
          viewBox="0 0 900 350"
          className="metro-map"
          role="img"
          aria-label="Metro map showing AiiDA dispatching calculations to multiple HPC schedulers"
        >
          <defs>
            {/* Glow filters for station markers */}
            {lines.map((line) => (
              <filter key={`glow-${line.id}`} id={`metro-glow-${line.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* Grid background — subtle, like a real transit map */}
          <g opacity="0.04">
            {Array.from({ length: 19 }, (_, i) => (
              <line key={`vg-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="350" stroke="var(--color-text)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`hg-${i}`} x1="0" y1={i * 50} x2="900" y2={i * 50} stroke="var(--color-text)" strokeWidth="0.5" />
            ))}
          </g>

          {/* Route lines — background (thicker, muted) */}
          {lines.map((line, i) => (
            <path
              key={`bg-${line.id}`}
              id={`metro-route-${line.id}`}
              d={buildPath(i)}
              fill="none"
              stroke={line.color}
              strokeWidth="4"
              opacity="0.15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Route lines — foreground (thinner, solid) */}
          {lines.map((line, i) => (
            <path
              key={`fg-${line.id}`}
              d={buildPath(i)}
              fill="none"
              stroke={line.color}
              strokeWidth="2.5"
              opacity="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Transfer station markers — where lines intersect at the transfer column */}
          <g>
            {/* Vertical connector line through all transfer stations */}
            <line
              x1={transferX} y1={transferYs[0] - 12}
              x2={transferX} y2={transferYs[transferYs.length - 1] + 12}
              stroke="var(--color-border)"
              strokeWidth="1.5"
              opacity="0.4"
            />
            {lines.map((line, i) => (
              <g key={`transfer-${line.id}`}>
                <circle
                  cx={transferX}
                  cy={transferYs[i]}
                  r="5"
                  fill="var(--color-bg-surface)"
                  stroke={line.color}
                  strokeWidth="2"
                />
                <circle
                  cx={transferX}
                  cy={transferYs[i]}
                  r="2"
                  fill={line.color}
                />
              </g>
            ))}
          </g>

          {/* AiiDA origin station — large hub */}
          <g>
            {/* Outer ring */}
            <circle
              cx={startX} cy={yCenter} r={stationR + 10}
              fill="none"
              stroke="#0096de"
              strokeWidth="1.5"
              opacity="0.2"
            />
            {/* Station circle */}
            <circle
              cx={startX} cy={yCenter} r={stationR + 4}
              fill="var(--color-bg-surface)"
              stroke="#0096de"
              strokeWidth="2.5"
            />
            <circle
              cx={startX} cy={yCenter} r={stationR - 2}
              fill="#0096de"
              opacity="0.9"
            />
            {/* Pulsing glow */}
            <circle
              cx={startX} cy={yCenter} r={stationR + 10}
              fill="none"
              stroke="#0096de"
              strokeWidth="1"
              opacity="0.4"
              className="metro-pulse"
            />
            {/* Label */}
            <text
              x={startX} y={yCenter + stationR + 26}
              textAnchor="middle"
              className="metro-station-label metro-station-label--origin"
            >
              AiiDA
            </text>
            <text
              x={startX} y={yCenter + stationR + 40}
              textAnchor="middle"
              className="metro-station-sublabel"
            >
              daemon
            </text>
          </g>

          {/* HPC destination stations */}
          {lines.map((line, i) => {
            const y = lineYs[i];
            return (
              <g key={`station-${line.id}`}>
                {/* Station marker */}
                <circle
                  cx={endX} cy={y} r={stationR}
                  fill="var(--color-bg-surface)"
                  stroke={line.color}
                  strokeWidth="2.5"
                />
                <circle
                  cx={endX} cy={y} r={stationR - 4}
                  fill={line.color}
                  opacity="0.85"
                />
                {/* Station name */}
                <text
                  x={endX + stationR + 10}
                  y={y + 1}
                  dominantBaseline="middle"
                  className="metro-station-label"
                >
                  {line.name}
                </text>
                {/* Line indicator bar */}
                <rect
                  x={endX + stationR + 8}
                  y={y + 8}
                  width="32"
                  height="3"
                  rx="1.5"
                  fill={line.color}
                  opacity="0.3"
                />
              </g>
            );
          })}

          {/* Animated dots traveling along each route */}
          {lines.map((line, i) => {
            const dur = durations[i];
            const offset = dotOffsets[i];
            return (
              <g key={`dots-${line.id}`}>
                {/* Forward dot — submit (toward HPC) */}
                <circle r="3.5" fill={line.color} opacity="0" className="metro-dot">
                  <animateMotion
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    begin={`${offset}s`}
                    keyPoints="0;0;1;1"
                    keyTimes="0;0.05;0.48;1"
                    calcMode="linear"
                  >
                    <mpath href={`#metro-route-${line.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    begin={`${offset}s`}
                    values="0;0;0.9;0.9;0;0"
                    keyTimes="0;0.04;0.06;0.47;0.49;1"
                    calcMode="linear"
                  />
                </circle>
                {/* Return dot — retrieve (toward AiiDA) */}
                <circle r="3" fill={line.color} opacity="0" className="metro-dot metro-dot--return">
                  <animateMotion
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    begin={`${offset + dur * 0.5}s`}
                    keyPoints="1;1;0;0"
                    keyTimes="0;0.05;0.48;1"
                    calcMode="linear"
                  >
                    <mpath href={`#metro-route-${line.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    begin={`${offset + dur * 0.5}s`}
                    values="0;0;0.7;0.7;0;0"
                    keyTimes="0;0.04;0.06;0.47;0.49;1"
                    calcMode="linear"
                  />
                </circle>
                {/* Second forward dot — staggered */}
                <circle r="2.5" fill={line.color} opacity="0" className="metro-dot">
                  <animateMotion
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    begin={`${offset + dur * 0.25}s`}
                    keyPoints="0;0;1;1"
                    keyTimes="0;0.05;0.48;1"
                    calcMode="linear"
                  >
                    <mpath href={`#metro-route-${line.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    begin={`${offset + dur * 0.25}s`}
                    values="0;0;0.6;0.6;0;0"
                    keyTimes="0;0.04;0.06;0.47;0.49;1"
                    calcMode="linear"
                  />
                </circle>
              </g>
            );
          })}

          {/* Legend key — line colors */}
          <g transform="translate(30, 330)">
            {lines.map((line, i) => (
              <g key={`legend-${line.id}`} transform={`translate(${i * 110}, 0)`}>
                <rect x="0" y="-5" width="16" height="3" rx="1.5" fill={line.color} opacity="0.8" />
                <text x="20" y="0" className="metro-legend-text">{line.name}</text>
              </g>
            ))}
          </g>
        </svg>

        {/* Footer stats */}
        <div className="metro-footer">
          <div className="metro-stats">
            <span className="metro-stat">
              <span className="metro-stat-dot" style={{ background: '#0096de' }} />
              Submitting
            </span>
            <span className="metro-stat">
              <span className="metro-stat-dot" style={{ background: '#e85d04' }} />
              Running
            </span>
            <span className="metro-stat">
              <span className="metro-stat-dot" style={{ background: '#30b808' }} />
              Retrieving
            </span>
          </div>
          <span className="metro-rate">~10,000 processes/hour</span>
          <span className="metro-checkpoint">Fully checkpointed — restart from any point</span>
        </div>
      </div>
    </section>
  );
}


function Numbers(): ReactNode {
  return (
    <section className="numbers-section">
      <div className="numbers-grid" data-reveal="stagger">
        <a className="number-item number-item--link" href="https://scholar.google.com/scholar?cites=14531473867479919759" target="_blank" rel="noopener noreferrer">
          <span className="number-value">500+</span>
          <span className="number-label">Publications</span>
        </a>
        <div className="number-item">
          <span className="number-value">100+</span>
          <span className="number-label">Plugins</span>
        </div>
        <a className="number-item number-item--link" href="https://github.com/aiidateam/aiida-core/graphs/contributors" target="_blank" rel="noopener noreferrer">
          <span className="number-value">50+</span>
          <span className="number-label">Contributors</span>
        </a>
        <a className="number-item number-item--link" href="https://pypistats.org/packages/aiida-core" target="_blank" rel="noopener noreferrer">
          <span className="number-value">{pypiStats.monthly_display}</span>
          <span className="number-label">Downloads / month</span>
        </a>
        <div className="number-item">
          <span className="number-value">MIT</span>
          <span className="number-label">Licensed</span>
        </div>
      </div>
    </section>
  );
}

const supporterLogos = [
  { name: 'NCCR MARVEL', img: `${base}/img/sponsors/marvel-logo-300x150.png`, url: 'https://nccr-marvel.ch/' },
  { name: 'MaX CoE', img: `${base}/img/sponsors/max-logo-300x150.png`, url: 'http://www.max-centre.eu/' },
  { name: 'MarketPlace', img: `${base}/img/sponsors/marketplace-logo-300x150.png`, url: 'https://www.the-marketplace-project.eu/' },
  { name: 'INTERSECT', img: `${base}/img/sponsors/intersect-logo-300x150.png` },
  { name: 'PASC', img: `${base}/img/sponsors/pasc-logo-300x150.png`, url: 'https://www.pasc-ch.org/' },
  { name: 'swissuniversities', img: `${base}/img/sponsors/swissuniversities-logo-300x150.png`, url: 'https://www.materialscloud.org/swissuniversities' },
  { name: 'NFFA', img: `${base}/img/sponsors/nffa-logo-300x150.png`, url: 'https://www.nffa.eu/' },
  { name: 'BIG-MAP', img: `${base}/img/sponsors/big-map-logo.png`, url: 'https://www.big-map.eu/' },
  { name: 'PSI', img: `${base}/img/sponsors/psi_300*150.png`, url: 'https://www.psi.ch/en/' },
  { name: 'EPFL', img: `${base}/img/sponsors/epfl-logo-300x150.png`, url: 'https://www.epfl.ch/en/' },
  { name: 'Harvard', img: `${base}/img/sponsors/harvard-logo-300x150.png`, url: 'https://www.harvard.edu/' },
  { name: 'Bosch', img: `${base}/img/sponsors/bosch-logo-300x150.png`, url: 'https://www.bosch.com/research/' },
  { name: 'ORD-PREMISE', img: `${base}/img/sponsors/premise-logo-300x150.png`, url: 'https://www.ord-premise.org/' },
  { name: 'SwissTwins', img: `${base}/img/sponsors/swisstwins_300*150.png`, url: 'https://www.cscs.ch/about/collaborations/swisstwins' },
];

function Supporters(): ReactNode {
  return (
    <section className="supporters-section" data-reveal>
      <h2>Supported by</h2>
      <div className="supporters-marquee">
        <div className="supporters-track">
          {supporterLogos.map((s, i) => (
            <a className="supporter-item" key={`a-${i}`} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name}>
              <img src={s.img} alt={s.name} loading="lazy" />
            </a>
          ))}
          {supporterLogos.map((s, i) => (
            <a className="supporter-item" key={`b-${i}`} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name}>
              <img src={s.img} alt={s.name} loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      'AiiDA and the AiiDA lab have considerably reduced the human time spent on routine computational workflows in our lab, resulting in two subsequent annual bonuses for high productivity. Experimental PhDs and Postdocs now submit workflows based on Quantum ESPRESSO through the AiiDA lab to compute the electronic properties of graphene nanoribbons, and monitor/visualize the results of more advanced workflows (e.g. NEB with CP2K, geometry optimizations, STM, STS and AFM simulations of molecules adsorbed on surfaces) submitted by their computational colleagues.',
    name: 'Dr. Carlo A. Pignedoli',
    role: 'Deputy Group Leader Atomistic Simulations, nanotech@surfaces Laboratory, Empa, Switzerland',
  },
  {
    quote:
      "Today's computational materials science (in our case, force constant calculations at finite temperature, deformation twinning, etc.) usually involves workflows that combine multiple different simulation codes. AiiDA is a robust environment to write and execute such workflows (supporting high algorithmic complexity, if needed) and to inspect their results consistently. Once a workflow is written, it is straightforward to perform systematic materials simulations over the parameters of interest, which is extremely important to generate data that are durable in posterior analysis. This is fairly difficult to achieve without using AiiDA.",
    name: 'Dr. Atsushi Togo',
    role: 'Lead developer of phonopy & spglib, Senior Researcher, National Institute for Materials Science (NIMS), Japan',
  },
  {
    quote:
      'We at Schott are using the AiiDA environment for standardizing our workflows and thereby assure a high quality of our simulations. Due to the open plugin-driven platform approach, our internal codes and post-processing tools can be easily embedded into AiiDA workchains. Without AiiDA, making the transition from hand-driven simulation to automated calculation would have been much more difficult in the special area of glass simulations.',
    name: 'Dr. Benedikt Ziebarth',
    role: 'Principal Scientist Materials Informatics, Schott AG, Germany',
  },
  {
    quote:
      'I have been using AiiDA for a long time to manage my high-throughput calculations of optical and superconducting properties of two-dimensional materials (using Quantum ESPRESSO and VASP) and it has accelerated my academic research a lot. My fingers are liberated from tedious command line operations on remote servers and all results can easily be retrieved from the database for subsequent analysis and statistical tasks, using an integrated software solution rather than writing non-reusable scripts. Since all the steps of computation are stored in the provenance graph, I am more confident about the parameters and operational logic I used and I can easily retrieve and reproduce the calculations I performed a long time ago.',
    name: 'Jason Yu',
    role: 'Ph.D. student, Department of Physics, South China University of Technology, China',
  },
  {
    quote:
      'How did I run this set of calculations and parse their result a year ago? This is a question I am asking myself quite frequently when I use AiiDA to launch a complex chain of simulations (e.g. involving CP2K, RASPA, Zeo++, and PorousMaterial), query results, or inspect failed calculations to fix the issue and re-run them. AiiDA brought this comfort and efficiency to our projects by providing a suitable framework for connecting codes through plugins in reproducible and robust workflows. These features, combined with efficient design in data/file storage, help us to not only keep the information provenance but also, to share, explore, and reproduce them anytime, anywhere. When I see intermediate calculations in a multi-stage workflow being handled in the middle of night during the weekend, I realize the efficiency bonus that AiiDA has brought to our projects.',
    name: 'Dr. Pezhman Zarabadi-Poor',
    role: 'Marie Skłodowska-Curie Fellow, CEITEC – MU, Czechia',
  },
  {
    quote:
      'When I first looked at AiiDA, I wondered: why should I put in extra effort in order to code my daily work into a framework that someone else designed? Why not keep using my bash and python scripts rather than having to learn a new tool? When I started using AiiDA, I soon realised that its 3 main advantages alone – automation, reproducibility, re-use of others\' code – are well worth the effort. Aiming for a final work chain that connects the calculations of your current project, from day one, puts you in the perspective of sharing with the scientific community not only new information, but the machine to obtain this information from scratch, allowing your successor to start from where you left.',
    name: 'Dr. Daniele Ongari',
    role: 'Laboratory for Molecular Simulation, EPFL Valais, Switzerland',
  },
  {
    quote:
      'We have followed the evolution of AiiDA from 2015, using it together with FLEUR and other JuDFT simulation programs at the Forschungszentrum Jülich and beyond. Without AiiDA\'s provenance tracking it would have been much harder to ensure that data is reproducible and to create a larger database for the evaluation of XPS spectra during my PhD. While profiting from the rich, growing open source material informatics ecosystem and enjoying the very nice, ever helpful community around AiiDA, I do believe that together we can now bring full-scale virtual materials design to life and make a difference.',
    name: 'Jens Bröder',
    role: 'Ph.D. student, Institute for Advanced Simulation (IAS), Forschungszentrum Jülich, Germany',
  },
];

function TestimonialCard({t}: {t: typeof testimonials[number]}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`testimonial-card ${expanded ? 'testimonial-card--expanded' : ''}`}>
      <blockquote>
        <span className="testimonial-text">{t.quote}</span>
      </blockquote>
      <button className="testimonial-toggle" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Show less' : 'Read more'}>
        {expanded ? 'Show less' : 'Read more'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={expanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
        </svg>
      </button>
      <div className="testimonial-footer">
        <div className="testimonial-attribution">{t.name}</div>
        <div className="testimonial-role">{t.role}</div>
      </div>
    </div>
  );
}

function Testimonials(): ReactNode {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const t = setTimeout(updateArrows, 100);
    el.addEventListener('scroll', updateArrows, {passive: true});
    window.addEventListener('resize', updateArrows);
    return () => { clearTimeout(t); el.removeEventListener('scroll', updateArrows); window.removeEventListener('resize', updateArrows); };
  }, [updateArrows]);

  const scroll = useCallback((dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({left: dir * 360, behavior: 'smooth'});
  }, []);

  return (
    <section className="testimonials-section" data-reveal>
      <div className="testimonials-header-row">
        <h2>What researchers say</h2>
        <div className="testimonials-nav">
          <button
            className={`news-nav-btn${canScrollLeft ? '' : ' news-nav-btn--disabled'}`}
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 4 7 10 13 16" /></svg>
          </button>
          <button
            className={`news-nav-btn${canScrollRight ? '' : ' news-nav-btn--disabled'}`}
            onClick={() => scroll(1)}
            aria-label="Scroll right"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 4 13 10 7 16" /></svg>
          </button>
        </div>
      </div>
      <div className="testimonials-track" ref={trackRef}>
        {testimonials.map((t, i) => (
          <TestimonialCard t={t} key={i} />
        ))}
        <a className="testimonial-card testimonial-card--more" href={`${base}/testimonials/`}>
          <span className="news-more-label">All testimonials</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="news-more-arrow"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </a>
      </div>
      <div className={`news-fade news-fade--left${canScrollLeft ? ' news-fade--visible' : ''}`} />
      <div className={`news-fade news-fade--right${canScrollRight ? ' news-fade--visible' : ''}`} />
    </section>
  );
}

interface NewsItem {
  title: string;
  date: string;
  category: string | null;
  slug: string;
}

const newsCatColors: Record<string, string> = {
  Blog: '#0096de',
  Releases: '#30b808',
  News: '#e85d04',
  Events: '#8b5cf6',
  Reports: '#ec4899',
};

function LatestNews({items}: {items: NewsItem[]}): ReactNode {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const t = setTimeout(updateArrows, 100);
    el.addEventListener('scroll', updateArrows, {passive: true});
    window.addEventListener('resize', updateArrows);
    return () => { clearTimeout(t); el.removeEventListener('scroll', updateArrows); window.removeEventListener('resize', updateArrows); };
  }, [updateArrows]);

  const scroll = useCallback((dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({left: dir * 320, behavior: 'smooth'});
  }, []);

  if (!items.length) return null;
  return (
    <section className="news-section" data-reveal>
      <div className="news-header-row">
        <h2>Latest News</h2>
        <div className="news-nav">
          <button
            className={`news-nav-btn${canScrollLeft ? '' : ' news-nav-btn--disabled'}`}
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 4 7 10 13 16" /></svg>
          </button>
          <button
            className={`news-nav-btn${canScrollRight ? '' : ' news-nav-btn--disabled'}`}
            onClick={() => scroll(1)}
            aria-label="Scroll right"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 4 13 10 7 16" /></svg>
          </button>
        </div>
      </div>
      <div className="news-track" ref={trackRef}>
        {items.map((item, i) => {
          const d = new Date(item.date);
          const month = d.toLocaleDateString('en-US', {month: 'short'});
          const day = d.getDate();
          const year = d.getFullYear();
          const catColor = newsCatColors[item.category ?? ''] ?? '#888';
          return (
            <a
              className="news-card"
              href={`${base}/blog/${item.slug}/`}
              key={i}

              style={{'--cat-color': catColor} as React.CSSProperties}
            >
              <div className="news-card-accent" />
              <div className="news-card-body">
                <div className="news-card-meta">
                  <time className="news-card-date" dateTime={item.date}>
                    {month} {day}, {year}
                  </time>
                  {item.category && (
                    <span className="news-card-tag">{item.category}</span>
                  )}
                </div>
                <span className="news-card-title">{item.title}</span>
              </div>
              <svg className="news-card-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="10" x2="16" y2="10" />
                <polyline points="11 5 16 10 11 15" />
              </svg>
            </a>
          );
        })}
        <a className="news-card news-card--more" href={`${base}/blog/`}>
          <span className="news-more-label">All news</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="news-more-arrow"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </a>
      </div>
      {/* Fade edges hint there's more to scroll */}
      <div className={`news-fade news-fade--left${canScrollLeft ? ' news-fade--visible' : ''}`} />
      <div className={`news-fade news-fade--right${canScrollRight ? ' news-fade--visible' : ''}`} />
    </section>
  );
}

function CTA(): ReactNode {
  return (
    <section className="cta-section" data-reveal="scale-up">
      <h2>Ready to automate your research?</h2>
      <p>Get started with AiiDA in minutes. Install, run the tutorial, and submit your first workflow.</p>
      <div className="cta-buttons">
        <a className="button button--primary button--lg" href="https://aiida.readthedocs.io/projects/aiida-core/en/stable/intro/get_started.html">
          Read the Docs
        </a>
        <a className="button button--outline button--lg" href="https://github.com/aiidateam/aiida-core">
          View on GitHub
        </a>
      </div>
    </section>
  );
}

// Full verdi CLI data loaded from pre-generated JSON (run: python scripts/fetch-verdi-cli.py)
const VERDI_COMMANDS: string[] = verdiCliData.commands;
const SUBCOMMANDS: Record<string, string[]> = verdiCliData.subcommands;
const VERDI_HELP: Record<string, string> = verdiCliData.help;

// Top-level verdi subcommands (computed once from the JSON)
const VERDI_TOP_SUBS = [...new Set(
  VERDI_COMMANDS.filter(c => c.startsWith('verdi ')).map(c => c.split(' ')[1])
)].sort();

function getCompletions(input: string): string[] {
  if (!input) return [];

  // Special case: completing "verdi " — show top-level subcommands
  if (input === 'verdi ' || (input.startsWith('verdi ') && !input.slice(6).includes(' '))) {
    const partial = input.slice(6);
    return VERDI_TOP_SUBS.filter(s => s.startsWith(partial)).map(s => `verdi ${s}`);
  }

  // Find the deepest matching parent group and complete its subcommands
  let bestParent = '';
  for (const parent of Object.keys(SUBCOMMANDS)) {
    if (input.startsWith(parent + ' ') && parent.length > bestParent.length) {
      bestParent = parent;
    }
  }
  if (bestParent) {
    const partial = input.slice(bestParent.length + 1);
    return SUBCOMMANDS[bestParent]
      .filter(s => s.startsWith(partial))
      .map(s => `${bestParent} ${s}`);
  }

  // Fallback: match from full command list
  return VERDI_COMMANDS.filter(c => c.startsWith(input));
}

// --- Mock terminal response registry ---
// Static responses: exact command → output (no context needed)
const MOCK_STATIC: Record<string, string> = {
  'verdi status': [
    ' \u2713 version:     AiiDA v2.x',
    ' \u2713 config:      /home/user/.aiida',
    ' \u2713 profile:     default',
    ' \u2713 storage:     SqliteDosStorage[/home/user/.aiida/repository]: open,',
    ' \u2713 broker:      RabbitMQ v3.13.1 @ amqp://127.0.0.1?heartbeat=600',
    ' \u2713 daemon:      Daemon is running with PID 42567 (2 workers)',
  ].join('\n'),
  'verdi presto': [
    "Report: RabbitMQ server detected: configuring the profile with a broker.",
    "Success: Created new profile `presto`.",
    "Success: Configured the localhost as a computer.",
  ].join('\n'),
  'verdi daemon status': [
    'Profile: default',
    'Daemon is running with PID 42567 since 2026-03-18 12:00:00',
    'Active workers [2]:',
    '  Worker 0 (PID 42568): Waiting for tasks [last task 5s ago]',
    '  Worker 1 (PID 42569): Waiting for tasks [last task 12s ago]',
    '',
    'Use `verdi daemon [incr | decr] [NUM]` to adjust workers.',
  ].join('\n'),
  'verdi daemon start': 'Starting the daemon... OK.\nDaemon started with PID 42567 (2 workers).',
  'verdi daemon stop': 'Stopping the daemon... OK.\nDaemon stopped.',
  'verdi daemon restart': 'Restarting the daemon... OK.\nDaemon restarted with PID 42570 (2 workers).',
  'verdi group list': [
    '  PK  Label                    Type string    Count',
    '----  -----------------------  -------------  -------',
    '  (no groups)',
  ].join('\n'),
  'verdi plugin list': [
    'Package                Version   Entry points',
    '-------------------    --------  ---------------------',
    'aiida-core             2.x     76 entry points',
    '',
    'Use `verdi plugin list aiida.calculations` for specific groups.',
  ].join('\n'),
  'verdi config list': [
    '  Name                                Value',
    '  ----------------------------------  -------------------------',
    '  autofill.user.email                 user@example.com',
    '  autofill.user.first_name            Ada',
    '  autofill.user.last_name             Lovelace',
    '  caching.default_enabled             False',
    '  daemon.default_workers              2',
    '  daemon.timeout                      20',
    '  logging.aiida_loglevel              REPORT',
  ].join('\n'),
  'verdi computer test localhost': [
    "Testing computer 'localhost'...",
    ' \u2713 Checking transport... OK',
    ' \u2713 Checking scheduler... OK',
    ' \u2713 Checking work directory... OK',
    ' \u2713 Checking file permissions... OK',
    'All 4 tests passed.',
  ].join('\n'),
  'verdi shell': 'Info: Interactive shell not available in browser.\nHint: pip install aiida-core',
  'pip install aiida-core': 'Successfully installed aiida-core-2.x',
};

// Dynamic responses: pattern match → handler (needs context)
const VALID_TRANSPORTS = ['core.local', 'core.ssh', 'core.ssh_async'];
const VALID_SCHEDULERS = ['core.direct', 'core.lsf', 'core.pbspro', 'core.sge', 'core.slurm', 'core.torque'];

type ComputerInfo = {label: string; hostname: string; description: string; transport: string; scheduler: string; workDir: string; mpirun: string};
type MockContext = {created: Set<string>; nextPk: number; computers: ComputerInfo[]; submittedJobs: number[]};
type DynHandler = (cmd: string, parts: string[], ctx: MockContext) => string | null;

const MOCK_DYNAMIC: {test: (cmd: string, parts: string[]) => boolean; handler: DynHandler}[] = [
  {
    test: (cmd) => cmd === 'verdi process list' || cmd === 'verdi process list -a',
    handler: (_cmd, _parts, ctx) => {
      const lines = [
        '  PK  Created    Process label         Process State    Process status',
        '----  ---------  --------------------  ---------------  ----------------',
      ];
      const jobs = ctx.submittedJobs;
      for (let i = 0; i < jobs.length; i++) {
        lines.push(`${String(jobs[i]).padStart(4)}  ${(jobs.length - i) * 2}m ago    ArithmeticAddCalc     \u23f9 Finished [0]`);
      }
      lines.push('', `Total results: ${jobs.length}`);
      if (jobs.length === 0) lines.push('Info: use `verdi process list -a` to see all processes.');
      return lines.join('\n');
    },
  },
  {
    test: (cmd) => cmd === 'verdi computer list',
    handler: (_cmd, _parts, ctx) => {
      const lines = [
        '  ID  Label              Hostname                Transport    Scheduler',
        '----  -----------------  ----------------------  -----------  -----------',
      ];
      if (ctx.created.has('profile:presto'))
        lines.push('   1  localhost          localhost                core.local   core.direct');
      for (let i = 0; i < ctx.computers.length; i++) {
        const c = ctx.computers[i];
        lines.push(`   ${i + 2}  ${c.label.padEnd(17)}${c.hostname.padEnd(24)}${c.transport.padEnd(13)}${c.scheduler}`);
      }
      if (lines.length === 2) lines.push('  (no computers configured)');
      return lines.join('\n');
    },
  },
  {
    test: (_cmd, parts) => parts[0] === 'verdi' && parts[1] === 'computer' && parts[2] === 'show',
    handler: (_cmd, parts, ctx) => {
      const label = parts[3] || 'localhost';
      if (label === 'localhost' && ctx.created.has('profile:presto')) {
        return [
          'Computer name:     localhost', 'Hostname:          localhost',
          'Description:       Local machine', 'Transport type:    core.local',
          'Scheduler type:    core.direct', 'Work directory:    /home/user/.aiida/scratch/',
          'Shebang:           #!/bin/bash', 'Mpirun command:    mpirun -np {tot_num_mpiprocs}',
          'Prepend text:      (empty)', 'Append text:       (empty)',
        ].join('\n');
      }
      const comp = ctx.computers.find(c => c.label === label);
      if (comp) {
        return [
          `Computer name:     ${comp.label}`, `Hostname:          ${comp.hostname}`,
          `Description:       ${comp.description}`, `Transport type:    ${comp.transport}`,
          `Scheduler type:    ${comp.scheduler}`, `Work directory:    ${comp.workDir}`,
          `Shebang:           #!/bin/bash`, `Mpirun command:    ${comp.mpirun}`,
          'Prepend text:      (empty)', 'Append text:       (empty)',
        ].join('\n');
      }
      return `Error: Computer '${label}' not found.`;
    },
  },
  {
    test: (cmd) => cmd === 'verdi code list',
    handler: (_cmd, _parts, ctx) => {
      const lines = [
        '  ID  Label                    Computer',
        '----  -----------------------  -----------------',
      ];
      for (const key of ctx.created) {
        if (key.startsWith('code:')) {
          const codeLabel = key.slice(5);
          const comp = codeLabel.split('@')[1] || '';
          lines.push(`   1  ${codeLabel.padEnd(23)}  ${comp}`);
        }
      }
      if (lines.length === 2) lines.push('  (no codes configured)');
      return lines.join('\n');
    },
  },
  {
    test: (cmd) => cmd === 'verdi profile list',
    handler: (_cmd, _parts, ctx) =>
      ctx.created.has('profile:presto')
        ? 'Info: configuration folder: /home/user/.aiida\n* presto'
        : 'Info: configuration folder: /home/user/.aiida\n  (no profiles configured)',
  },
  {
    test: (cmd) => cmd === 'verdi storage info',
    handler: (_cmd, _parts, ctx) => {
      const nodes = ctx.submittedJobs.length * 5;
      const compCount = (ctx.created.has('profile:presto') ? 1 : 0) + ctx.computers.length;
      return [
        'Profile: presto', 'Repository:',
        '  Path:        /home/user/.aiida/repository',
        `  Disk usage:  ${nodes > 0 ? '4.2 KB' : '0 B'}`,
        'Database:', `  Nodes:       ${nodes}`,
        `  Links:       ${nodes > 0 ? nodes * 3 : 0}`, '  Groups:      0',
        `  Computers:   ${compCount}`,
        '  Logs:        0',
      ].join('\n');
    },
  },
  {
    test: (_cmd, parts) => parts[0] === 'verdi' && parts[1] === 'node' && parts[2] === 'show',
    handler: (_cmd, parts, ctx) => {
      const pk = parts[3] || '5';
      const pkNum = parseInt(pk, 10);
      if (pkNum >= ctx.nextPk || pkNum < 1) return `Error: Node with PK ${pk} not found.`;
      return [
        'Property     Value',
        '-----------  ------------------------------------------',
        'type         CalcJobNode', `pk           ${pk}`,
        'uuid         4b2c1a3e-8f7d-4e5b-9c6a-2d1f0e8b7a3c',
        'label        ArithmeticAddCalculation', 'description  ',
        `computer     [2] ${ctx.computers[0]?.label || 'localhost'}`, '',
        'Inputs       PK    Type', '-----------  ----  ----------------',
        'code         2     InstalledCode',
        `x            ${pkNum + 1}     Int`, `y            ${pkNum + 2}     Int`, '',
        'Outputs      PK    Type', '-----------  ----  ----------------',
        `sum          ${pkNum + 3}     Int`, `remote_foldr ${pkNum + 4}     RemoteData`,
      ].join('\n');
    },
  },
  {
    test: (_cmd, parts) => parts[0] === 'verdi' && parts[1] === 'calcjob' && parts[2] === 'res',
    handler: (_cmd, parts, ctx) => {
      const pk = parts[3];
      if (pk) {
        const pkNum = parseInt(pk, 10);
        if (pkNum >= ctx.nextPk || pkNum < 1) return `Error: Node with PK ${pk} not found.`;
      }
      return '{\n  "sum": 9\n}';
    },
  },
];

function getMockedResponse(cmd: string, ctx?: Partial<MockContext>): string {
  const parts = cmd.trim().split(/\s+/);
  const fullCtx: MockContext = {created: ctx?.created ?? new Set(), nextPk: ctx?.nextPk ?? 5, computers: ctx?.computers ?? [], submittedJobs: ctx?.submittedJobs ?? []};

  // Help commands — build from CLI data
  if (parts[0] === 'help' || cmd === 'verdi --help' || cmd === 'verdi -h' || cmd === 'verdi help') {
    const topSubs = SUBCOMMANDS['verdi'] ||
      [...new Set(VERDI_COMMANDS.filter(c => c.split(' ').length === 2).map(c => c.split(' ')[1]))];
    const lines = [
      'Usage: verdi [OPTIONS] COMMAND [ARGS]...', '',
      '  The command line interface of AiiDA.', '',
      'Options:', '  -p, --profile PROFILE  Execute the command for this profile.',
      '  -h, --help             Show this message and exit.', '', 'Commands:',
    ];
    for (const sub of topSubs) lines.push(`  ${sub.padEnd(14)}${VERDI_HELP[`verdi ${sub}`] || ''}`);
    return lines.join('\n');
  }

  // Exact static match
  if (MOCK_STATIC[cmd]) return MOCK_STATIC[cmd];

  // Dynamic handlers
  for (const {test, handler} of MOCK_DYNAMIC) {
    if (test(cmd, parts)) {
      const result = handler(cmd, parts, fullCtx);
      if (result !== null) return result;
    }
  }

  // Generic verdi subcommand help — auto-generated from CLI data
  if (parts[0] === 'verdi' && parts.length >= 2) {
    const isHelp = parts[parts.length - 1] === '--help' || parts[parts.length - 1] === '-h';
    const cmdParts = isHelp ? parts.slice(0, -1) : parts;
    const fullCmd = cmdParts.join(' ');

    let matchKey = '';
    for (const key of Object.keys(VERDI_HELP)) {
      if (fullCmd.startsWith(key) && key.length > matchKey.length) matchKey = key;
    }
    if (fullCmd in SUBCOMMANDS) matchKey = fullCmd;

    if (matchKey) {
      const helpText = VERDI_HELP[matchKey] || '';
      const subs = SUBCOMMANDS[matchKey];
      const lines = [`Usage: ${matchKey} [OPTIONS]${subs ? ' COMMAND [ARGS]...' : ''}`];
      if (helpText) lines.push('', `  ${helpText}`);
      if (subs && subs.length > 0) {
        lines.push('', 'Commands:');
        for (const s of subs) lines.push(`  ${s.padEnd(24)}${VERDI_HELP[`${matchKey} ${s}`] || ''}`);
      }
      if (!isHelp) lines.push('', '\u26a0\ufe0f  This is just a CLI preview — the full functionality is not available.');
      return lines.join('\n');
    }
    return `Error: No such command '${parts.slice(1).join(' ')}'.\nTry \`verdi --help\` for available commands.`;
  }

  // Basic shell commands
  if (parts[0] === 'pip' && parts[1] === 'install') {
    const pkg = parts.slice(2).join(' ');
    if (pkg === 'aiida-core' || pkg === 'aiida') {
      return `Collecting aiida-core\n  Downloading aiida_core-py3-none-any.whl\nInstalling collected packages: aiida-core\nSuccessfully installed aiida-core`;
    }
    return `ERROR: No matching distribution found for ${pkg}`;
  }
  if (parts[0] === 'ls') return 'submit.py';
  if (parts[0] === 'pwd') return '/home/user/project';
  if (parts[0] === 'whoami') return 'user';
  if (parts[0] === 'clear') return '';

  return `bash: ${parts[0]}: command not found\nHint: try \`verdi --help\``;
}

const SUBMIT_PY = `from aiida.engine import submit
from aiida.orm import Int, load_code

# Load the 'add' code configured on My_HPC
code = load_code('add@My_HPC')

# Build the calculation inputs
builder = code.get_builder()
builder.x = Int(4)
builder.y = Int(5)
builder.metadata.options.resources = {
    'num_machines': 1,
    'num_mpiprocs_per_machine': 1,
}

# Submit to the AiiDA daemon
node = submit(builder)
print(f'Submitted CalcJob <{node.pk}>')`;

const SLURM_SCRIPT = `#!/bin/bash
#SBATCH --job-name="aiida-5"
#SBATCH --output=_scheduler-stdout.txt
#SBATCH --error=_scheduler-stderr.txt
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --time=00:30:00
#SBATCH --partition=normal
#SBATCH --account=myproject

# AiiDA auto-generated submission script
module load arithmetic/1.0

'mpirun' '-np' '1' '/usr/bin/add' > 'aiida.out' 2>&1`;

type PromptDef = {label: string; hint: string; key: string; validate?: (v: string) => string | null};

const COMPUTER_PROMPTS: PromptDef[] = [
  {label: 'Computer label', hint: 'My_HPC', key: 'label'},
  {label: 'Hostname', hint: 'myhpc.university.edu', key: 'hostname'},
  {label: 'Description []', hint: '', key: 'description'},
  {label: 'Transport plugin', hint: 'core.ssh_async', key: 'transport', validate: (v) => {
    if (!v) return null; // empty = use default
    if (!VALID_TRANSPORTS.includes(v)) return `Error: entry point '${v}' is not valid for any of the allowed entry point groups: aiida.transports\nValid options: ${VALID_TRANSPORTS.join(', ')}`;
    return null;
  }},
  {label: 'Scheduler plugin', hint: 'core.slurm', key: 'scheduler', validate: (v) => {
    if (!v) return null;
    if (!VALID_SCHEDULERS.includes(v)) return `Error: entry point '${v}' is not valid for any of the allowed entry point groups: aiida.schedulers\nValid options: ${VALID_SCHEDULERS.join(', ')}`;
    return null;
  }},
  {label: 'Shebang [#!/bin/bash]', hint: '', key: 'shebang'},
  {label: 'Work directory [/scratch/{username}/aiida/]', hint: '', key: 'workDir'},
  {label: 'Mpirun command [mpirun -np {tot_num_mpiprocs}]', hint: '', key: 'mpirun'},
];

const SSH_CONFIGURE_PROMPTS: PromptDef[] = [
  {label: "Host as in 'ssh <HOST>' (needs to be a password-less setup in your ssh config) [myhpc.university.edu]", hint: '', key: 'host'},
  {label: 'Maximum number of concurrent I/O operations [8]', hint: '', key: 'maxIo'},
  {label: 'Local script to run before opening connection (path) [None]', hint: '', key: 'localScript'},
  {label: 'Type of async backend to use, `asyncssh` or `openssh` [asyncssh]', hint: '', key: 'backend'},
  {label: 'Use login shell when executing command [Y/n]', hint: '', key: 'loginShell'},
  {label: 'Connection cooldown time (s) [15.0]', hint: '', key: 'cooldown'},
];


const TUTORIAL_STEPS = [
  {
    title: '1. Set up AiiDA',
    desc: 'Create a profile with a single command. This sets up the database, repository, and a localhost computer.',
    file: null as string | null,
    code: null as string | null,
    hint: 'verdi presto',
  },
  {
    title: '2. Set up a computer',
    desc: 'Register your HPC cluster. AiiDA needs to know the hostname, scheduler type, and transport details.',
    file: null as string | null,
    code: null as string | null,
    hint: 'verdi computer setup',
  },
  {
    title: '3. Configure SSH',
    desc: 'Configure how AiiDA connects to the computer via SSH \u2014 authentication, keys, and proxy settings.',
    file: null as string | null,
    code: null as string | null,
    hint: 'verdi computer configure core.ssh_async My_HPC',
  },
  {
    title: '4. Register a code',
    desc: 'Tell AiiDA where the executable lives on the remote machine so it can build the submission script.',
    file: null as string | null,
    code: null as string | null,
    hint: 'verdi code create core.code.installed --label add --computer=My_HPC --default-calc-job-plugin core.arithmetic.add --filepath-executable=/usr/bin/add -n',
  },
  {
    title: '5. Review & submit',
    desc: "This script loads the 'add' code on My_HPC, sets x=4 and y=5, and submits the CalcJob to the daemon.",
    file: 'submit.py',
    code: SUBMIT_PY,
    hint: 'verdi run submit.py',
  },
  {
    title: '6. Watch AiiDA work',
    desc: "AiiDA automatically:\n\u2022 Generates a Slurm script\n\u2022 Uploads files via SSH\n\u2022 Submits the job\n\u2022 Monitors the scheduler\n\u2022 Retrieves results when done",
    file: '_aiiida_submit_script.sh',
    code: SLURM_SCRIPT,
    hint: 'watch verdi process list',
  },
  {
    title: '7. Inspect results',
    desc: 'Done! Exit code 0. All inputs, outputs, and provenance are permanently recorded in AiiDA.',
    file: null,
    code: `{
  "sum": 9
}`,
    hint: 'verdi calcjob res 5',
  },
];

const PHASE_STATES = [
  {time: '0s ago ', state: '\u23f5 Created'},
  {time: '2s ago ', state: '\u23f5 Waiting    Uploading files via SSH'},
  {time: '10s ago', state: '\u23f5 Waiting    Submitted to HPC'},
  {time: '12s ago', state: '\u23f5 Waiting    Queued on scheduler'},
  {time: '14s ago', state: '\u23f5 Running    Running on 1 node'},
  {time: '22s ago', state: '\u23f5 Waiting    Retrieving results'},
  {time: '30s ago', state: '\u23f9 Finished [0]'},
];

function phaseText(pk: number, idx: number): string {
  const p = PHASE_STATES[idx];
  return `${String(pk).padStart(4)}  ${p.time}    ArithmeticAddCalc     ${p.state}`;
}

function highlightCode(code: string, filename: string): ReactNode[] {
  if (!code) return [''];
  const lang = filename.endsWith('.py') || filename === 'overview'
    ? 'python'
    : filename.endsWith('.sh')
      ? 'bash'
      : filename.endsWith('.json') || filename === 'aiida.out'
        ? 'json'
        : 'text';
  const result: ReactNode[] = [];
  const lines = code.split('\n');
  let k = 0;
  for (let li = 0; li < lines.length; li++) {
    if (li > 0) result.push('\n');
    const line = lines[li];
    let pos = 0;
    let regex: RegExp | null = null;
    if (lang === 'python') {
      regex = /(#.*$)|(f?"(?:[^"\\]|\\.)*"|f?'(?:[^'\\]|\\.)*')|\b(from|import|def|class|if|elif|else|return|for|in|as|with|try|except|finally|raise|pass|break|continue|while|yield|assert|and|or|not|is|lambda|True|False|None)\b|\b(\d+(?:\.\d+)?)\b/g;
    } else if (lang === 'bash') {
      regex = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(if|then|else|fi|for|do|done|while|case|esac|function|return|exit|echo|export|module|load)\b/g;
    } else if (lang === 'json') {
      regex = /("(?:[^"\\]|\\.)*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;
    }
    if (regex) {
      let m;
      while ((m = regex.exec(line)) !== null) {
        if (m.index > pos) result.push(<span key={k++}>{line.slice(pos, m.index)}</span>);
        if (lang === 'json') {
          if (m[1]) {
            const rest = line.slice(m.index + m[0].length).trimStart();
            const isKey = rest.startsWith(':');
            result.push(<span key={k++} style={{color: isKey ? '#89b4fa' : '#a6e3a1'}}>{m[0]}</span>);
          } else {
            result.push(<span key={k++} style={{color: '#fab387'}}>{m[0]}</span>);
          }
        } else {
          if (m[1]) result.push(<span key={k++} style={{color: '#6c7086'}}>{m[0]}</span>);
          else if (m[2]) result.push(<span key={k++} style={{color: '#a6e3a1'}}>{m[0]}</span>);
          else if (m[3]) result.push(<span key={k++} style={{color: '#cba6f7'}}>{m[0]}</span>);
          else if (m[4]) result.push(<span key={k++} style={{color: '#fab387'}}>{m[0]}</span>);
        }
        pos = m.index + m[0].length;
      }
    }
    if (pos < line.length) result.push(<span key={k++}>{line.slice(pos)}</span>);
  }
  return result;
}

function InteractiveTutorial({ embedded, onPhaseChange, renderLayout }: { embedded?: boolean; onPhaseChange?: (phase: number, running: boolean) => void; renderLayout?: (parts: { editor: ReactNode; terminal: ReactNode; instructions: ReactNode; expanded: boolean; editorExpanded: boolean }) => ReactNode }): ReactNode {
  const [step, setStep] = useState(0);
  const [hist, setHist] = useState<{type: 'cmd' | 'out'; text: string}[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState(-1);
  const [phaseRunning, setPhaseRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);
  const termContainerRef = useRef<HTMLDivElement>(null);

  // Command history for up/down arrow navigation
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  // PK counter and resource tracking
  const [nextPk, setNextPk] = useState(5);
  const [submittedJobs, setSubmittedJobs] = useState<number[]>([]);
  const watchingPkRef = useRef<number>(5);
  const [created, setCreated] = useState(new Set<string>());
  const [computers, setComputers] = useState<ComputerInfo[]>([]);
  const computersRef = useRef(computers);
  computersRef.current = computers;
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});

  // Expand states
  const [expanded, setExpanded] = useState(false);       // terminal
  const [editorExpanded, setEditorExpanded] = useState(false); // editor

  // Tab-based editor state
  const [openTabs, setOpenTabs] = useState<{name: string; code: string}[]>([
    {name: 'overview', code: '# Welcome to AiiDA!\n# Follow the instructions on the right\n# to submit your first calculation.\n\n# The code editor will show relevant\n# files at each step.'},
  ]);
  const [activeTab, setActiveTab] = useState(0);

  // Interactive prompt mode (for verdi computer setup, configure, code create)
  const [promptMode, setPromptMode] = useState<{
    prompts: PromptDef[];
    current: number;
    successMsg: string;
  } | null>(null);
  const promptModeRef = useRef(promptMode);
  promptModeRef.current = promptMode;
  const [autoFill, setAutoFill] = useState(false);

  // Track whether input should be disabled (during auto-play / auto-fill)
  const inputDisabled = phaseRunning || autoFill || busy;

  // Keep focus trapped in terminal area
  useEffect(() => {
    if (inputDisabled) {
      termContainerRef.current?.focus();
    } else {
      inRef.current?.focus();
    }
  }, [inputDisabled]);

  // Accumulate tabs + reset prompt on step change
  useEffect(() => {
    setPromptMode(null);
    setAutoFill(false);
    setBusy(false);
    const s = TUTORIAL_STEPS[step];
    const tabName = s.file || (s.code ? 'aiida.out' : null);
    const tabCode = s.code || '';
    if (!tabName) {
      setActiveTab(0);
      return;
    }
    setOpenTabs(prev => {
      const existing = prev.findIndex(t => t.name === tabName);
      if (existing >= 0) {
        setActiveTab(existing);
        return prev;
      }
      const newTabs = [...prev, {name: tabName, code: tabCode}];
      setActiveTab(newTabs.length - 1);
      return newTabs;
    });
  }, [step]);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [hist]);

  // Auto-fill interactive prompts when button is clicked
  const promptIdx = promptMode?.current ?? -1;
  useEffect(() => {
    const pm = promptModeRef.current;
    if (!autoFill || !pm) return;
    const p = pm.prompts[pm.current];
    const timer = setTimeout(() => {
      const value = p.hint || '(default)';
      setPromptAnswers(prev => ({...prev, [p.key]: p.hint || ''}));
      setHist(prev => [...prev, {type: 'cmd' as const, text: `${p.label}: ${value}`}]);
      if (pm.current >= pm.prompts.length - 1) {
        setAutoFill(false);
        // Use setTimeout to ensure promptAnswers state is settled
        setTimeout(() => finishPrompts(), 50);
      } else {
        setPromptMode(prev => prev ? {...prev, current: prev.current + 1} : null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [autoFill, promptIdx]);

  // Auto-play process state transitions (watch verdi process list)
  useEffect(() => {
    if (!phaseRunning || phase >= PHASE_STATES.length - 1) {
      if (phase >= PHASE_STATES.length - 1 && phaseRunning) {
        setPhaseRunning(false);
        setTimeout(() => setStep(6), 1500);
      }
      return;
    }
    // Durations synced with dot animations:
    // 0=Created(2s), 1=Uploading(8s blue dot), 2=Submitted(2s), 3=Queued(2s),
    // 4=Running(6s orange 2 orbits), 5=Finished(2s), 6=Retrieving(8s green dot), 7=Retrieved
    const PHASE_DURATIONS = [2000, 8000, 2000, 2000, 6000, 2000, 8000, 2000];
    const timer = setTimeout(() => {
      const next = phase + 1;
      setPhase(next);
      setHist(prev => [...prev.slice(0, -1), {type: 'out', text: phaseText(watchingPkRef.current, next)}]);
    }, PHASE_DURATIONS[phase] ?? 2000);
    return () => clearTimeout(timer);
  }, [phase, phaseRunning]);

  // Report phase changes to parent (for embedded mode dot sync)
  useEffect(() => {
    onPhaseChange?.(phase, phaseRunning);
  }, [phase, phaseRunning, onPhaseChange]);

  // Memoize mock context to avoid recreating on every render
  const mockCtx = useCallback(
    () => ({created, nextPk, computers, submittedJobs}),
    [created, nextPk, computers, submittedJobs],
  );

  function exec(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    if (inputDisabled) return;
    setCmdHistory(prev => [...prev, trimmed]);
    setHistIdx(-1);

    // Handle 'clear' command
    if (trimmed === 'clear') {
      setHist([]);
      setInput('');
      return;
    }

    const newHist = [...hist, {type: 'cmd' as const, text: `$ ${trimmed}`}];
    const ctx = mockCtx();

    // --- Commands with tutorial side-effects ---
    // These need special handling beyond just generating output.
    if (trimmed === 'verdi presto') {
      if (created.has('profile:presto')) {
        newHist.push({type: 'out', text: "Error: Profile 'presto' already exists.\nUse `verdi profile delete presto` first."});
      } else {
        newHist.push({type: 'out', text: getMockedResponse('verdi presto')});
        setCreated(prev => new Set(prev).add('profile:presto'));
        if (step === 0) { setBusy(true); setTimeout(() => { setStep(1); setBusy(false); }, 800); }
      }
      setHist(newHist);
    } else if (trimmed === 'verdi computer setup') {
      newHist.push({type: 'out', text: 'Report: enter ? for help.\nReport: enter ! to ignore the default and set no value.'});
      setHist(newHist);
      setPromptAnswers({});
      setPromptMode({prompts: COMPUTER_PROMPTS, current: 0, successMsg: '__COMPUTER_SETUP__'});
    } else if (trimmed.startsWith('verdi computer configure ')) {
      const parts = trimmed.split(/\s+/);
      const transport = parts[3];
      const compLabel = parts[4];
      if (!transport || !compLabel) {
        newHist.push({type: 'out', text: 'Usage: verdi computer configure TRANSPORT COMPUTER_LABEL'});
        setHist(newHist);
      } else if (!VALID_TRANSPORTS.includes(transport)) {
        newHist.push({type: 'out', text: `Error: entry point '${transport}' is not valid for any of the allowed entry point groups: aiida.transports\nValid options: ${VALID_TRANSPORTS.join(', ')}`});
        setHist(newHist);
      } else if (!computersRef.current.find(c => c.label === compLabel) && compLabel !== 'localhost') {
        newHist.push({type: 'out', text: `Error: Computer '${compLabel}' not found.`});
        setHist(newHist);
      } else {
        newHist.push({type: 'out', text: 'Report: enter ? for help.\nReport: enter ! to ignore the default and set no value.'});
        setHist(newHist);
        setPromptAnswers({});
        setPromptMode({prompts: SSH_CONFIGURE_PROMPTS, current: 0, successMsg: `__SSH_CONFIGURE__:${compLabel}`});
      }
    } else if (trimmed.startsWith('verdi code create core.code.installed')) {
      const labelMatch = trimmed.match(/--label[= ](\S+)/);
      const computerMatch = trimmed.match(/--computer[= ](\S+)/);
      const codeLabel = labelMatch?.[1] || 'add';
      const compLabel = computerMatch?.[1] || computersRef.current[0]?.label || 'localhost';
      const fullLabel = `${codeLabel}@${compLabel}`;
      if (created.has(`code:${fullLabel}`)) {
        newHist.push({type: 'out', text: `Error: Code '${fullLabel}' already exists.`});
      } else if (!computersRef.current.find(c => c.label === compLabel) && compLabel !== 'localhost') {
        newHist.push({type: 'out', text: `Error: Computer '${compLabel}' not found.`});
      } else {
        newHist.push({type: 'out', text: `Success: Code<${computersRef.current.length + 2}> ${fullLabel} created`});
        setCreated(prev => new Set(prev).add(`code:${fullLabel}`));
        if (step === 3) { setBusy(true); setTimeout(() => { setStep(4); setBusy(false); }, 600); }
      }
      setHist(newHist);
    } else if (trimmed === 'verdi run submit.py') {
      const pk = nextPk;
      setNextPk(prev => prev + 1);
      setSubmittedJobs(prev => [...prev, pk]);
      newHist.push({type: 'out', text: `Submitted CalcJob <${pk}>`});
      setHist(newHist);
      if (step === 4) { setBusy(true); setTimeout(() => { setStep(5); setBusy(false); }, 800); }
    } else if (trimmed === 'watch verdi process list' && submittedJobs.length > 0) {
      const lastPk = submittedJobs[submittedJobs.length - 1] ?? nextPk - 1;
      watchingPkRef.current = lastPk;
      const finishedLines = submittedJobs.slice(0, -1).map((pk, i) =>
        `${String(pk).padStart(4)}  ${(submittedJobs.length - i) * 2}m ago    ArithmeticAddCalc     \u23f9 Finished [0]`
      ).join('\n');
      const header = 'Every 2.0s: verdi process list\n\n  PK  Created    Process label         Process State\n----  ---------  --------------------  ----------------------------';
      const prefix = finishedLines ? `${header}\n${finishedLines}` : header;
      setHist([...newHist,
        {type: 'out', text: prefix},
        {type: 'out', text: phaseText(lastPk, 0)},
      ]);
      setPhase(0);
      setPhaseRunning(true);
    } else if (trimmed === 'watch verdi process list') {
      newHist.push({type: 'out', text: 'No processes to watch. Submit a calculation first with `verdi run submit.py`.'});
      setHist(newHist);
    } else {
      // All other commands — delegate to the mock response registry
      newHist.push({type: 'out', text: getMockedResponse(trimmed, ctx)});
      setHist(newHist);
    }
    setInput('');
  }

  function finishPrompts() {
    if (!promptMode) return;
    if (promptMode.successMsg === '__COMPUTER_SETUP__') {
      const label = promptAnswers['label'] || 'My_HPC';
      const existing = computersRef.current.find(c => c.label === label);
      if (existing) {
        setHist(prev => [...prev, {type: 'out', text: `\nError: Computer '${label}' already exists.\nUse \`verdi computer delete ${label}\` to remove it first.`}]);
      } else {
        const comp: ComputerInfo = {
          label,
          hostname: promptAnswers['hostname'] || 'myhpc.university.edu',
          description: promptAnswers['description'] || '',
          transport: promptAnswers['transport'] || 'core.ssh_async',
          scheduler: promptAnswers['scheduler'] || 'core.slurm',
          workDir: promptAnswers['workDir'] || '/scratch/{username}/aiida/',
          mpirun: promptAnswers['mpirun'] || 'mpirun -np {tot_num_mpiprocs}',
        };
        setComputers(prev => [...prev, comp]);
        setCreated(prev => { const s = new Set(prev); s.add(`computer:${label}`); return s; });
        setHist(prev => [...prev, {type: 'out', text: `\nSuccess: Computer<${computersRef.current.length + 2}> ${label} created\nReport: 7 fields configured\nInfo: Use \`verdi computer configure ${comp.transport} ${label}\` to configure transport.\nInfo: Use \`verdi computer test ${label}\` to verify.`}]);
        if (step === 1) setTimeout(() => setStep(2), 600);
      }
    } else if (promptMode.successMsg.startsWith('__SSH_CONFIGURE__:')) {
      const compLabel = promptMode.successMsg.split(':')[1];
      setCreated(prev => { const s = new Set(prev); s.add(`configured:${compLabel}`); return s; });
      setHist(prev => [...prev, {type: 'out', text: `\nReport: Configuring computer ${compLabel} for user aiida@localhost.\nSuccess: ${compLabel} successfully configured for aiida@localhost`}]);
      if (step === 2) setTimeout(() => setStep(3), 600);
    } else {
      setHist(prev => [...prev, {type: 'out', text: `\n${promptMode.successMsg}`}]);
    }
    setPromptMode(null);
    setPromptAnswers({});
  }

  function handleInput() {
    if (inputDisabled) return;
    if (promptMode) {
      const p = promptMode.prompts[promptMode.current];
      const value = input || p.hint || '';
      // Validate if validator exists
      if (p.validate) {
        const error = p.validate(value);
        if (error) {
          setHist(prev => [...prev, {type: 'out' as const, text: error}]);
          setInput('');
          return; // Stay on the same prompt
        }
      }
      setPromptAnswers(prev => ({...prev, [p.key]: value}));
      setHist(prev => [...prev, {type: 'cmd' as const, text: `${p.label}: ${value || '(default)'}`}]);
      if (promptMode.current >= promptMode.prompts.length - 1) {
        finishPrompts();
      } else {
        setPromptMode(prev => prev ? {...prev, current: prev.current + 1} : null);
      }
      setInput('');
    } else {
      exec(input);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Let Ctrl+Shift+C (copy) and Ctrl+V / Ctrl+Shift+V (paste) pass through to browser
    if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) return;
    if (e.key === 'c' && e.ctrlKey && e.shiftKey) return;

    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      // Ctrl+C: show ^C, cancel current input / prompt, new prompt line
      if (promptMode) {
        setHist(prev => [...prev, {type: 'cmd' as const, text: '^C'}]);
        setPromptMode(null);
        setAutoFill(false);
      } else if (input) {
        setHist(prev => [...prev, {type: 'cmd' as const, text: `$ ${input}^C`}]);
      } else {
        setHist(prev => [...prev, {type: 'cmd' as const, text: '$ ^C'}]);
      }
      setInput('');
      if (phaseRunning) {
        setPhaseRunning(false);
      }
      return;
    }
    if (e.key === 'Enter') {
      handleInput();
    } else if (e.key === 'ArrowUp' && !promptMode) {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const newIdx = histIdx < 0 ? cmdHistory.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(newIdx);
      setInput(cmdHistory[newIdx]);
    } else if (e.key === 'ArrowDown' && !promptMode) {
      e.preventDefault();
      if (histIdx < 0) return;
      const newIdx = histIdx + 1;
      if (newIdx >= cmdHistory.length) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (promptMode) {
        // In prompt mode: autocomplete the default/hint value
        const p = promptMode.prompts[promptMode.current];
        if (p.hint && !input) {
          setInput(p.hint);
        }
        return;
      }
      // If input is empty and there's a hint, fill the hint command
      if (!input && currentHint) {
        setInput(currentHint);
        return;
      }
      const completions = getCompletions(input);
      if (completions.length === 1) {
        setInput(completions[0] + ' ');
      } else if (completions.length > 1) {
        setHist(prev => [...prev, {type: 'out', text: completions.map(c => c.split(' ').pop()).join('  ')}]);
      }
    }
  }

  function runHint() {
    if (inputDisabled) return;
    const compLabel = computers[0]?.label || 'My_HPC';
    const lastPk = submittedJobs.length > 0 ? submittedJobs[submittedJobs.length - 1] : nextPk - 1;
    let hint = step === TUTORIAL_STEPS.length - 1 ? `verdi calcjob res ${lastPk}` : TUTORIAL_STEPS[step].hint;
    if (hint && computers.length > 0) {
      hint = hint.replace(/My_HPC/g, compLabel);
    }
    if (promptMode) {
      setAutoFill(true);
      return;
    }
    if (hint) {
      const isInteractive = hint === 'verdi computer setup'
        || hint?.startsWith('verdi computer configure ');
      exec(hint);
      if (isInteractive) setAutoFill(true);
    } else {
      setStep(step + 1);
    }
  }

  const s = TUTORIAL_STEPS[step];
  const compLabel = computers[0]?.label || 'My_HPC';
  const lastSubmittedPk = submittedJobs.length > 0 ? submittedJobs[submittedJobs.length - 1] : nextPk - 1;
  let currentHint = step === TUTORIAL_STEPS.length - 1 ? `verdi calcjob res ${lastSubmittedPk}` : s.hint;
  if (currentHint && computers.length > 0) {
    currentHint = currentHint.replace(/My_HPC/g, compLabel);
  }

  // ─── Shared sub-elements ───
  const editorEl = (
    <div className={`tut-editor ${editorExpanded ? 'tut-editor-expanded' : ''}`} style={editorExpanded ? {order: 0} : expanded ? {order: 1} : undefined}>
      <div className="tut-editor-tab">
        <span className="tut-editor-dots">
          <span className="terminal-proto-dot terminal-proto-dot--red" />
          <span className="terminal-proto-dot terminal-proto-dot--yellow" />
          <span
            className="terminal-proto-dot terminal-proto-dot--green tut-terminal-fullscreen-dot"
            onClick={e => { e.stopPropagation(); setEditorExpanded(!editorExpanded); }}
            title={editorExpanded ? 'Exit full screen' : 'Enter full screen'}
          >
            <svg viewBox="0 0 12 12" className="tut-dot-icon">
              {editorExpanded ? (
                <>
                  <polyline points="4 2 4 4 2 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <polyline points="8 10 8 8 10 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </>
              ) : (
                <>
                  <polyline points="2 4 2 2 4 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <polyline points="10 8 10 10 8 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </>
              )}
            </svg>
          </span>
        </span>
        {openTabs.map((tab, i) => (
          <span
            key={tab.name}
            className={`tut-editor-filename ${i === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
            title={tab.name}
          >
            {tab.name}
          </span>
        ))}
      </div>
      <pre className="tut-editor-code">
        {highlightCode(openTabs[activeTab]?.code || '', openTabs[activeTab]?.name || '')}
      </pre>
    </div>
  );

  const terminalEl = (
    <div ref={termContainerRef} className={`tut-terminal ${expanded ? 'tut-terminal-expanded' : ''}`} tabIndex={-1} style={expanded ? {order: 0} : undefined} onClick={() => { if (!window.getSelection()?.toString()) inRef.current?.focus(); }} onKeyDown={e => { if (e.key === 'Tab') e.preventDefault(); }}>
      <div className="verdi-console-titlebar">
        <span className="terminal-proto-dot terminal-proto-dot--red" />
        <span className="terminal-proto-dot terminal-proto-dot--yellow" />
        <span
          className="terminal-proto-dot terminal-proto-dot--green tut-terminal-fullscreen-dot"
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
          title={expanded ? 'Exit full screen' : 'Enter full screen'}
        >
          <svg viewBox="0 0 12 12" className="tut-dot-icon">
            {expanded ? (
              <>
                <polyline points="4 2 4 4 2 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="8 10 8 8 10 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </>
            ) : (
              <>
                <polyline points="2 4 2 2 4 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="10 8 10 10 8 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </>
            )}
          </svg>
        </span>
        <span className="verdi-console-titlebar-text">terminal</span>
      </div>
      <div className="tut-terminal-scroll" ref={outRef}>
        {hist.map((entry, i) => (
          <div key={i} className={entry.type === 'cmd' ? 'verdi-line-cmd' : 'verdi-line-out'}>
            {entry.text.split('\n').map((line, j) => (
              <div key={j}>{line || '\u00A0'}</div>
            ))}
          </div>
        ))}
        <div className="verdi-console-input-row" style={inputDisabled ? {display: 'none'} : undefined}>
          <span className="verdi-console-prompt" style={promptMode ? {color: '#f9e2af'} : undefined}>
            {promptMode ? `${promptMode.prompts[promptMode.current].label}: ` : '$ '}
          </span>
          <input
            ref={inRef}
            type="text"
            value={input}
            onChange={e => !inputDisabled && setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="verdi-console-input"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            disabled={inputDisabled}
            placeholder={promptMode
              ? (promptMode.prompts[promptMode.current].hint || '(press Enter for default)')
              : (currentHint ? `try: ${currentHint}` : '')}
            aria-label="Tutorial terminal input"
          />
        </div>
      </div>
    </div>
  );

  const instructionsEl = (
    <div className="tut-instructions" style={expanded ? {order: 2} : undefined}>
      <div className="tut-step-indicator">
        {TUTORIAL_STEPS.map((_, i) => (
          <span key={i} className={`tut-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
        ))}
      </div>
      {step >= 4 && (
        <p className="tut-step-desc" style={{color: '#30b808', fontWeight: 600, margin: '0 0 4px'}}>
          {'\u2713'} One-time setup complete!
        </p>
      )}
      <h3 className="tut-step-title">{s.title}</h3>
      <p className="tut-step-desc">{s.desc}</p>
      {currentHint && (
        <div className="tut-hint">
          <code>{currentHint}</code>
        </div>
      )}
      <div className="tut-nav">
        {step > 0 && (
          <button className="tut-btn tut-btn-back" onClick={() => setStep(step - 1)}>
            {'\u2190'} Back
          </button>
        )}
        {(currentHint || step < TUTORIAL_STEPS.length - 1) && (
          <button
            className="tut-btn tut-btn-run"
            onClick={runHint}
            disabled={inputDisabled}
            style={inputDisabled ? {opacity: 0.4, cursor: 'not-allowed'} : undefined}
          >
            {currentHint ? 'Run' : `Next ${'\u2192'}`}
          </button>
        )}
      </div>
    </div>
  );

  // ─── Render-layout mode: parent controls where each piece goes ───
  if (renderLayout) {
    return renderLayout({ editor: editorEl, terminal: terminalEl, instructions: instructionsEl, expanded, editorExpanded });
  }

  // ─── Embedded mode: return separate pieces for parent CSS Grid ───
  if (embedded) {
    return (
      <>
        <div className="throughput-try-instructions">{instructionsEl}</div>
        <div className="throughput-try-terminals">
          {!expanded && editorEl}
          {!editorExpanded && terminalEl}
        </div>
      </>
    );
  }

  return null;
}

export default function LandingPage({news = []}: {news?: NewsItem[]}): ReactNode {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    // One-time observer for stagger-children reveals
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        }
      },
      {threshold: 0.08, rootMargin: '0px 0px -40px 0px'},
    );
    el.querySelectorAll('[data-reveal]').forEach(node => revealObserver.observe(node));

    // Continuous scroll-based cross-fade between sections
    const sections = Array.from(el.querySelectorAll<HTMLElement>(':scope > section'));
    sections.forEach(s => { s.style.willChange = 'opacity, transform'; });

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const vh = window.innerHeight;
        const fadeZone = vh * 0.35;

        sections.forEach((section, i) => {
          const rect = section.getBoundingClientRect();

          // First section: no fade-in, only fades out at the top
          const fadeIn = i === 0 ? 1 : Math.max(0, Math.min(1, (vh - rect.top) / fadeZone));
          const fadeOut = Math.max(0, Math.min(1, rect.bottom / fadeZone));
          const opacity = Math.min(fadeIn, fadeOut);

          section.style.opacity = String(opacity);
          // Subtle upward drift as section fades out
          if (i > 0) {
            const drift = (1 - fadeIn) * 24;
            section.style.transform = drift > 0.5 ? `translateY(${drift}px)` : '';
          }
        });
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    handleScroll(); // set initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealObserver.disconnect();
    };
  }, []);

  return (
    <main ref={mainRef}>
      <HighThroughputCombined />
      <ProvenanceGraph />
      <PluginShowcase />
      <Numbers />
      <Supporters />
      <LatestNews items={news} />
      <Testimonials />
    </main>
  );
}
