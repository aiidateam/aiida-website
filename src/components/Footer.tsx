const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <a href={`${base}/events`}>Workshops</a>
        {/* <a href="https://aiida.readthedocs.io" target="_blank" rel="noopener noreferrer">Documentation</a> */}
        <a href={`${base}/blog/`}>News</a>
        <a href={`${base}/acknowledgements`}>Acknowledgements</a>
        <a href="https://github.com/aiidateam/aiida-core/blob/main/LICENSE.txt" target="_blank" rel="noopener noreferrer">License</a>
      </div>
      <p className="footer-copy">
        &copy; {new Date().getFullYear()} AiiDA Team &mdash;
        developed at <a href="https://www.psi.ch/en/lms/msd-group" target="_blank" rel="noopener noreferrer">PSI</a> and <a href="http://theossrv1.epfl.ch/" target="_blank" rel="noopener noreferrer">EPFL</a>.
        All rights reserved.
      </p>
    </footer>
  );
}
