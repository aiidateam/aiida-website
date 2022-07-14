#!/usr/bin/env python
"""Parse the contents of the MySQL database dump of the original AiiDA website into markdown files.

The contents of the MySQL database were dumped to a ``.sql`` file which was then converted to JSON. From this JSON, the
content of the ``wp_posts`` key were written to the ``data.json`` file. The content of each news entry is HTML which is
converted to markdown using the ``markdownify`` library.

The converted news entries are written as a markdown file to the ``../docs/news/posts`` folder. In addition, a file is
written to the working directory ``urls.json`` which contains a mapping of the old URL to the new one. This will allow
to configure automatic redirects in the web server.
"""
import datetime
import json
import pathlib
import re
import textwrap

import markdownify


def main():
    with open("data.json") as handle:
        data = json.load(handle)

    entries = {}
    revisions = {}
    url_mapping = {}

    for entry in data:
        if entry["post_type"] in ["news", "post"]:
            entries[entry["ID"]] = entry
        elif entry["post_type"] == "revision":
            revisions[entry["ID"]] = entry

    for revision in revisions.values():
        parent_id = revision["post_parent"]

        if parent_id not in entries:
            continue

        title = revision["post_title"]
        content = revision["post_content"]

        try:
            ctime = datetime.datetime.strptime(
                revision["post_date_gmt"], "%Y-%m-%d %H:%M:%S"
            )
        except ValueError:
            ctime = datetime.datetime.strptime(
                revision["post_modified_gmt"], "%Y-%m-%d %H:%M:%S"
            )

        entries[parent_id].setdefault("revisions", []).append((ctime, title, content))

    basepath = pathlib.Path(__file__).parent.parent / "docs" / "news" / "posts"
    basepath.mkdir(exist_ok=True, parents=True)

    for pk, entry in entries.items():

        if "revisions" in entry:
            latest_revision = sorted(entry["revisions"], key=lambda x: x[0])[-1]
            content = latest_revision[-1]
        else:
            content = entry["post_content"]

        if not content.strip():
            continue

        try:
            ctime = datetime.datetime.strptime(
                entry["post_date_gmt"], "%Y-%m-%d %H:%M:%S"
            )
        except ValueError:
            ctime = datetime.datetime.strptime(
                entry["post_modified_gmt"], "%Y-%m-%d %H:%M:%S"
            )

        name = (
            entry["post_name"]
            if entry["post_name"]
            else "-".join([e.lower() for e in entry["post_title"].split()])
        )
        short_name = "-".join(name.split("-")[:4])
        title = entry["post_title"]
        date = f"{ctime:%Y-%m-%d}"
        header = textwrap.dedent(
            f"""
            ---
            blogpost: true
            category:
            tags:
            date: {date}
            ---
            """
        ).lstrip()

        substitutions = (
            ("\\r\\n", "\n"),
            ("\\n", "\n"),
            ("\\", ""),
            ("“", '"'),
            ("”", '"'),
        )

        for pattern, replacement in substitutions:
            title = title.replace(pattern, replacement)
            content = content.replace(pattern, replacement)

        markdown = markdownify.markdownify(content)  # Convert HTML to markdown
        markdown = re.sub(r"\n\s+\n", "\n\n", markdown)  # Remove whitespace lines
        markdown = re.sub(r"\s+\n", "\n", markdown)  # Remove line trailing whitespace
        markdown = re.sub(r"\n+", "\n\n", markdown)  # Remove consecutive linebreaks
        markdown = markdown.replace(" ", " ")  # Remove literal non-breaking spaces

        filepath = basepath / f"{ctime:%Y-%m-%d}-{short_name}.md"

        with open(filepath, "w") as handle:
            handle.write(f"{header}\n")
            handle.write(f"# {title}\n\n")
            handle.write(f"{markdown.strip()}\n")

        url_old = f"news/{name}"
        url_new = f'news/posts/{filepath.name.replace(".md", ".html")}'
        url_mapping[url_old] = url_new

    with open("urls.json", "w") as handle:
        json.dump(url_mapping, handle, indent=4)
        handle.write("\n")


if __name__ == "__main__":
    main()
