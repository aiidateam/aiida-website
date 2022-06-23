# aiida-website

The primary website for AiiDA.

**IN DRAFT**: this is intended to replace the current <https://www.aiida.net/>

## How to add a post

1. Create a Markdown file in `docs/source/news/posts`, named by the date and keyword.
2. Add the [ablog topmatter](https://ablog.readthedocs.io/en/latest/manual/markdown/) to the page
3. Write in MyST Markdown
4. Create a PR

Note, you can use the [update](https://ablog.readthedocs.io/en/latest/manual/posting-and-listing/#directive-update) directive to note an update to an existing post.

## Building the documentation locally

Install and run [`tox`](https://tox.wiki/en/latest/) to install a local virtual environment and build the documentation,
or directly install `requirements.txt` and run `sphinx-build`.

## TODO

- Home in top bar
- Dropdown for "More"
- Feedback forms (contact us, Join us)
- Decide on set of post categories/tags
- Sort out `docs/more/events.md`
  - Replace `www.aiida.net` links
  - More prominent?
  - More integration with ablog?
- Upstream to ablog
  - Empty `postlist` placeholder
  - image number for topmatter
  - event date
  - fix `blog_post_pattern`?
  - config for "All Posts"
