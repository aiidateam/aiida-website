#! /usr/bin/env python3
# A CLI to create a blog post template

import argparse
from datetime import datetime
from pathlib import Path
import sys
from textwrap import dedent


CATS = {
    "news": "News",
    "event": "Events",
    "report": "Reports",
    "release": "Releases",
    "blog": "Blog",
}


def main(args=None):
    parser = argparse.ArgumentParser(description="Create a blog post")
    parser.add_argument("title", help="The title of the post")
    parser.add_argument(
        "-c",
        "--category",
        type=str,
        required=True,
        choices=list(CATS),
        help="The category of the blog post",
    )
    parser.add_argument(
        "-t",
        "--tags",
        type=str,
        default="",
        help="Comma delimited list of tags",
    )
    parser.add_argument(
        "-s",
        "--start",
        type=str,
        default="",
        help="The start date(time) for the event",
    )

    args = parser.parse_args(args)

    post_category = CATS[args.category]
    post_date = datetime.now().strftime("%Y-%m-%d")
    if args.category == "event" and not args.start:
        print(f"error: Events require a start date e.g.: -s/--start {post_date}")
        sys.exit(1)

    content = dedent(
        f"""\
        ---
        blogpost: true
        category: {post_category}
        tags: {args.tags}
        date: {post_date}
        ---

        # {args.title}

        Now you can fill in your content here.

        Write in [MyST Markdown](https://myst-parser.readthedocs.io/en/latest/syntax/syntax.html).
        """
    )

    # create file name from date and title (max 20 chars)
    post_title = args.title.lower().replace(" ", "-")
    post_title = post_title[:20]
    post_path = (
        Path(__file__).parent
        / "docs"
        / "news"
        / "posts"
        / f"{post_date}-{post_title}.md"
    )
    post_rel_path = post_path.relative_to(Path(__file__).parent / "docs")

    if post_path.exists():
        raise ValueError(f"File already exists: {post_path}")

    post_path.write_text(content, encoding="utf-8")

    print(f"Created post: {post_path}")

    if args.category == "event":
        events_path = Path(__file__).parent / "docs" / "events.yaml"
        with events_path.open("a", encoding="utf8") as handle:
            handle.write("\n")
            handle.write(
                dedent(
                    f"""\
            - name: {args.title}
              start: {args.start}
              location: unknown
              announce: /{post_rel_path}
            """
                )
            )
        print(f"Updated events file: {events_path}")


if __name__ == "__main__":
    main()
