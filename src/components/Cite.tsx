import {type ReactNode, useState} from 'react';

type Paper = {
  label: string;
  authors: string;
  venue: string;
  year: string;
  doi: string;
  bibtex: string;
};

const PAPERS: Paper[] = [
  {
    label: 'Main paper',
    authors: 'S.P. Huber et al.',
    venue: 'Scientific Data 7, 300',
    year: '2020',
    doi: '10.1038/s41597-020-00638-4',
    bibtex: `@article{huber2020aiida,
  title={AiiDA 1.0, a scalable computational infrastructure for automated reproducible workflows and data provenance},
  author={Huber, Sebastiaan P. and Zoupanos, Spyros and Uhrin, Martin and Talirz, Leopold and Kahle, Leonid and H{\\"a}user, Rico and Hofmann, Nicola and Yakutovich, Aliaksandr V. and Andersen, Casper W. and Ramirez, Francisco F. and Adorf, Carl S. and Gargiulo, Fernando and Kumbhar, Snehal and Passaro, Elsa and Johnston, Conrad and Merkys, Andrius and Cepellotti, Andrea and Mounet, Nicolas and Marzari, Nicola and Kozinsky, Boris and Pizzi, Giovanni},
  journal={Scientific Data},
  volume={7},
  pages={300},
  year={2020},
  doi={10.1038/s41597-020-00638-4}
}`,
  },
  {
    label: 'Engine paper',
    authors: 'M. Uhrin et al.',
    venue: 'Comp. Mat. Sci. 187, 110086',
    year: '2021',
    doi: '10.1016/j.commatsci.2020.110086',
    bibtex: `@article{uhrin2021workflows,
  title={Workflows in AiiDA: Engineering a high-throughput, event-based engine for robust and modular computational workflows},
  author={Uhrin, Martin and Huber, Sebastiaan P. and Yu, Jusong and Marzari, Nicola and Pizzi, Giovanni},
  journal={Computational Materials Science},
  volume={187},
  pages={110086},
  year={2021},
  doi={10.1016/j.commatsci.2020.110086}
}`,
  },
  {
    label: 'First paper (ADES model)',
    authors: 'G. Pizzi et al.',
    venue: 'Comp. Mat. Sci. 111, 218-230',
    year: '2016',
    doi: '10.1016/j.commatsci.2015.09.013',
    bibtex: `@article{pizzi2016aiida,
  title={AiiDA: automated interactive infrastructure and database for computational science},
  author={Pizzi, Giovanni and Cepellotti, Andrea and Sabatini, Riccardo and Marzari, Nicola and Kozinsky, Boris},
  journal={Computational Materials Science},
  volume={111},
  pages={218--230},
  year={2016},
  doi={10.1016/j.commatsci.2015.09.013}
}`,
  },
];

const ALL_BIBTEX = PAPERS.map(p => p.bibtex).join('\n\n');

type CopyState = 'idle' | 'copied' | 'error';

function CopyButton({text, label}: {text: string; label: string}): ReactNode {
  const [state, setState] = useState<CopyState>('idle');

  const onClick = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.pointerEvents = 'none';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setState('copied');
      window.setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      window.setTimeout(() => setState('idle'), 2000);
    }
  };

  return (
    <button
      type="button"
      className={`cite-copy-btn cite-copy-btn--${state}`}
      onClick={onClick}
      aria-label={label}
    >
      <span aria-live="polite">
        {state === 'copied' ? 'Copied!' : state === 'error' ? 'Copy failed' : label}
      </span>
    </button>
  );
}

export default function Cite({variant = 'section'}: {variant?: 'section' | 'panel'} = {}): ReactNode {
  const Wrapper = variant === 'section' ? 'section' : 'div';
  const wrapperClass = variant === 'section' ? 'cite-section' : 'cite-panel';
  const revealAttrs = variant === 'section' ? {'data-reveal': true} : {};

  return (
    <Wrapper className={wrapperClass} {...revealAttrs}>
      <div className="cite-inner">
        <header className="cite-header">
          <h2>How to cite AiiDA</h2>
          <p>If AiiDA helped your research, please cite the papers below.</p>
        </header>

        <ul className="cite-papers">
          {PAPERS.map(p => (
            <li key={p.doi} className="cite-paper">
              <div className="cite-paper-label">{p.label}</div>
              <a className="cite-paper-link" href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer">
                <span className="cite-paper-citation">
                  {p.authors}, <em>{p.venue}</em> ({p.year})
                </span>
                <span className="cite-paper-doi">doi:{p.doi}</span>
              </a>
              <CopyButton text={p.bibtex} label="Copy BibTeX" />
            </li>
          ))}
        </ul>

        <div className="cite-actions">
          <CopyButton text={ALL_BIBTEX} label="Copy all (BibTeX)" />
        </div>
      </div>
    </Wrapper>
  );
}
