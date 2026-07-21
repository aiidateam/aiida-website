# AiiDA Website

The official website for [AiiDA](https://www.aiida.net), built with [Astro](https://astro.build/).

## Development

```bash
npm install
npm run dev
```

The site runs at `http://localhost:4321/`.

## Build

```bash
npm run build
npm run preview
```

## Scripts

- `npm run update-cli` — Fetch the latest verdi CLI reference from aiida-core
- `npm run update-stats` — Fetch PyPI download stats

## Deployment

The site is deployed to Cloudflare Pages.

## Contributing

Thanks for your interest in helping! This site is maintained directly by the AiiDA team, and we kindly ask the community to share feedback through [**issues**](https://github.com/aiidateam/aiida-website/issues/new) rather than pull requests. Whether it's a typo, a broken link, outdated content, or a content suggestion — please open an issue and we'll take care of the implementation. To keep the workflow consistent, PRs opened from forks are gently auto-closed with a comment pointing back here.

Two reasons behind the policy: (1) the site benefits from a single editorial voice, so changes flow through the team rather than landing piecemeal; and (2) Cloudflare Pages doesn't build preview deployments for fork PRs (a security default — the build environment can hold project secrets), so a fork PR can't be reviewed visually anyway. Routing through issues keeps the loop short for everyone.

## How to cite AiiDA

If AiiDA helped your research, please cite the relevant papers below.

- **Main paper** — S.P. Huber et al., _Scientific Data_ **7**, 300 (2020). [doi:10.1038/s41597-020-00638-4](https://doi.org/10.1038/s41597-020-00638-4)
- **Engine paper** — M. Uhrin et al., _Computational Materials Science_ **187**, 110086 (2021). [doi:10.1016/j.commatsci.2020.110086](https://doi.org/10.1016/j.commatsci.2020.110086)
- **First paper (ADES model)** — G. Pizzi et al., _Computational Materials Science_ **111**, 218–230 (2016). [doi:10.1016/j.commatsci.2015.09.013](https://doi.org/10.1016/j.commatsci.2015.09.013)
