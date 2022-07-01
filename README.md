# aiida-website

The primary website for AiiDA.

**IN DRAFT**: this is intended to replace the current <https://www.aiida.net/>

## How to add a post

1. Create a Markdown file in `docs/source/news/posts`, named by the date and keyword.
2. Add the [ablog topmatter](https://ablog.readthedocs.io/en/latest/manual/markdown/) to the page
3. Write in [MyST Markdown](https://myst-parser.readthedocs.io/en/latest/syntax/syntax.html)
4. Create a PR

### Tips

Setting `category: Events` and a `date` in the future will make the post show on the front page `Upcoming Events`.

You can use the [update](https://ablog.readthedocs.io/en/latest/manual/posting-and-listing/#directive-update) directive to note an update to an existing post.

Use the [subfigure directive](https://sphinx-subfigure.readthedocs.io), to arrange multiple images in a figure.

## Building the documentation locally

Install and run [`tox`](https://tox.wiki/en/latest/) to install a local virtual environment and build the documentation,
or directly install `requirements.txt` and run: `sphinx-build -nW --keep-going -b html docs/ docs/_build/html`.

To check HTML links, run `tox -e linkcheck` or `sphinx-build -b linkcheck docs/ docs/_build/linkcheck`.

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
