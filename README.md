# aiida-website

The primary website for AiiDA.

## How to add a post

Clone this repository and create a new branch.

Then, either run `python create_post.py -h` or follow the steps manually:

1. Create a Markdown file in `docs/news/posts`, named by the date and keyword.
2. Add the [ablog topmatter](https://ablog.readthedocs.io/en/latest/manual/markdown.html) to the page
3. Write in [MyST Markdown](https://myst-parser.readthedocs.io/en/latest/syntax/syntax.html)
4. If the post announces or reports on an event, then update the [`docs/events.yaml`](docs/events.yaml) file.

Finally, create a PR to this repository.

### Tips

The top-matter `category` should be one of the following:

- `News`: To announce a general news
- `Events`: To announce an event
- `Reports`: To report on an event
- `Release`: To announce a new release
- `Blog`: A blog post

You can use the [update](https://ablog.readthedocs.io/en/latest/manual/posting-and-listing/#directive-update) directive to note an update to an existing post.

Use the [subfigure directive](https://sphinx-subfigure.readthedocs.io), to arrange multiple images in a figure.

## Building the documentation locally

Install and run [`tox`](https://tox.wiki/en/latest/) to install a local virtual environment and build the documentation,
or directly install `requirements.txt` and run: `sphinx-build -nW --keep-going -b html docs/ docs/_build/html`.

To check HTML links, run `tox -e linkcheck` or `sphinx-build -b linkcheck docs/ docs/_build/linkcheck`.

## TODO

- Feedback forms (contact us, Join us)
- Decide on set of post categories/tags
- Upstream to ablog
  - Empty `postlist` placeholder
  - image number for topmatter
  - event date
  - fix `blog_post_pattern`?
  - config for "All Posts"
