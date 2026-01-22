---
blogpost: true
category: Blog
tags: idea
author: Giovanni Pizzi, Carlo Pignedoli, Julian Geiger
date: 2025-11-21
---

# Putting the human back in the loop: Interactive workflows with AiiDA

In this post, we'll explore how to design AiiDA WorkChains that wait for human feedback, workflows where you get to interactively guide the process.

Such interactive workflows have many practical applications in scientific computing, where it can be useful (or even necessary) to pause execution and get human feedback before continuing.
Maybe a supercomputer went down and you want to resume your calculations once it's back online, or perhaps you want to inspect the first step of a long workflow before committing to the rest.
Sometimes, you might even want to make a manual decision to choose which next step to take based on the results so far.


## Pausing workflows

The simplest way to get the human back "in the loop" is to pause a workflow, and then manually replay it once you're ready to continue.

For example, a workflow can be designed to pause if a remote node fails.
After the issue is fixed you can simply run:
```
verdi process play <PK>
```
and the workflow will resume from where it left off.
The [AiiDA documentation](https://aiida.readthedocs.io/projects/aiida-core/en/stable/topics/processes/usage.html#verdi-process-pause-play-kill) includes the commands for manipulating live processes: `verdi process pause`, `verdi process play`, `verdi process kill`.

This already gives you a way to handle real-world situations gracefully without restarting from scratch.
But sometimes you may want to go further and not just resume, but provide actual feedback to the workflow logic.


## Communicating with the workflow via `extras`

AiiDA allows WorkChains to store metadata and messages in the `extras` field on the process node.
Importantly, the `extras` always remain mutable, unlike the `attributes`.
Thus, one possible way to communicate between workflow and user is to use the `extras` to send questions from the workflow to the user, and receive answers back.

The workflow can set an extra, for example:
```python
node.base.extras.set('question', "What should I do next?")
```

You then inspect the node, set a corresponding extra (for example `'answer' = "..."`), and replay the workflow.
This pattern enables a full "human-in-the-loop" control flow, while keeping everything inside the AiiDA provenance graph.


## A simple example: Guess the number!

Let's make this concrete with a small toy example.
For simplicity, we will not even submit jobs.
We'll just implement a WorkChain that secretly picks a random number between 1 and 100, then repeatedly pauses while waiting for your guess.
You reply by setting an extra (answer), replay the workflow, and it tells you whether the target number is higher or lower—until you guess correctly or reach a maximum number of attempts.

For this, we'll create a minimal package inside `aiida-blog-snippets/human-in-the-loop` (package name `aiida-human-in-the-loop`).
In your working folder, set up the following structure:
```
aiida-blog-snippets/
└── human-in-the-loop/
    ├── pyproject.toml
    └── src/
        └── aiida_humanintheloop/
            └── __init__.py
```

Alternatively, you can also find the ready-to-use package in `aiida-blog-snippets/human-in-the-loop` for your convenience to just `pip install -e` and follow along.

### The WorkChain definition
```python
import random
from typing import Optional

from aiida.engine import WorkChain, while_
from aiida.orm import Int, Dict


class HumanLoopWorkChain(WorkChain):
    @classmethod
    def define(cls, spec):
        super().define(spec)
        spec.input('max_iters', valid_type=Int, required=False, default=lambda: Int(20))
        spec.outline(
            cls.setup,
            while_(cls.not_finished)(
                cls.ask_and_pause,
                cls.process_answer,
            ),
            cls.finish,
        )
        spec.output('result', valid_type=Dict, required=False)

    def setup(self):
        # initialize once
        if not getattr(self.ctx, 'inited', False):
            self.ctx.target = random.randint(1, 100)
            self.ctx.attempts = 0
            self.ctx.history = []
            self.ctx.last_guess = None
            self.ctx.inited = True
            self.ctx.finished = False
            self.ctx.question = "Guess a number between 1 and 100."
            self.report("initialized (target hidden)")

    def not_finished(self) -> bool:
        # loop predicate
        return not bool(getattr(self.ctx, 'finished', False)) and self.ctx.attempts < int(self.inputs.max_iters)

    def ask_and_pause(self):
        # publish a question visible as an extra
        self.node.base.extras.set('question', self.ctx.question)
        self.report(f"asked: {self.ctx.question!r}")
        #self.node.base.attributes.set('process_status', 'need user input')
        self.pause()

    def on_paused(self, msg: Optional[str] = None) -> None:
        """The process was paused."""
        super().on_paused(msg)
        if self.node.base.extras.get('question', None) is not None:
            self.node.set_process_status('Need user input via \"answer\" extra before replaying!')

    def process_answer(self):
        # read and consume answer
        #self.node.base.attributes.set('process_status', '')
        self.node.set_process_status('processing answer')
        self.report(f"Checking answer... (attempt {self.ctx.attempts})")
        raw = self.node.base.extras.get('answer', None)
        if raw is None:
            self.report(f"No answer found!")
            return
        # Clear answer to avoid re-processing
        self.report(f"Answer: {raw!r}. Clearing it...")
        self.node.base.extras.set('answer', None)

        self.report(f"Answer cleared. Parsing as an integer...")
        # parse
        try:
            guess = int(raw)
        except Exception:
            self.report(f"Invalid answer {raw!r}; please set an integer in extra 'answer'")
            return

        self.report(f"Answer parsed as integer: {guess}")

        self.ctx.attempts += 1
        self.ctx.last_guess = guess

        if guess == self.ctx.target:
            self.ctx.history.append({'guess': guess, 'feedback': 'correct'})
            self.report(f"Attempt {self.ctx.attempts}: {guess} — CORRECT")
            self.node.base.extras.set('question', f"Correct! The number was {guess}. Attempts: {self.ctx.attempts}. Finished!")
            self.ctx.finished = True
            self.out('result', Dict({"message": f"Found {guess} in {self.ctx.attempts} attempts", "history": self.ctx.history}).store())
            return

        feedback = 'higher' if guess < self.ctx.target else 'lower'
        self.ctx.history.append({'guess': guess, 'feedback': feedback})
        self.report(f"Attempt {self.ctx.attempts}: {guess} — answer is {feedback}")

        self.ctx.question = f"My number is {feedback} than {guess}. Try again."
        # Will be set as a question in the extras in the next loop iteration.

    def finish(self):
        if not getattr(self.ctx, 'finished', False):
            self.report(f"finished without finding the number in {self.ctx.attempts} attempts")
            self.node.base.extras.set('question', f"Stopped after {self.ctx.attempts} attempts. (target hidden)")
            self.out('result', Dict({"message": f"Failed after {self.ctx.attempts} attempts", "history": self.ctx.history}).store())
```

## Installing and running

In `aiida-blog-snippets/human-in-the-loop`, add this pyproject.toml:
```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "aiida-human-in-the-loop"
version = "0.1.0"
description = "Example AiiDA workflow that waits for human feedback before continuing"
authors = [{ name = "AiiDA Team" }]
dependencies = ["aiida-core>=2.5"]

[project.entry-points.'aiida.workflows']
"humanintheloop.humanloop" = "aiida_humanintheloop:HumanLoopWorkChain"
```

Then install it with `pip install -e .`.

Now submit the workflow (e.g. using this code in a python script and running with `verdi run`, or in a Jupyter notebook cell):
```python
from aiida_humanintheloop import HumanLoopWorkChain
from aiida.orm import Int
from aiida.engine import submit

pk = submit(HumanLoopWorkChain, max_iters=Int(10))
print(f"Submitted HumanLoopWorkChain with PK={pk}")
```

Now that it's submitted, let's check the workflow status:
```
verdi process list
```
You should see it paused with a message like:
```
Need user input via "answer" extra before replaying!
```

## Playing the game

Now, let's play!
Inspect the question with:
```
verdi node extras <PK>
```

To answer, open a shell with `verdi shell`, and give a guess (e.g. 50, in this example):
```
wf = load_node(<PK>)
wf.base.extras.set('answer', 50)
```

Finally, replay the workflow with `verdi process play <PK>`.

The workflow will check your answer, tell you whether the number is higher or lower, clear the `answer` extra, and pause again — waiting for your next guess!
You can now iterate the points above to provide further guesses: how quickly will you find the target?

You can also check the full WorkChain report using `verdi process report <PK>` that contains the full history of what has been going on until now.
To make this smoother, you can even automate the interaction with a helper script, as we show below.

### A small interactive script

Save the following as `auto-guess.py`:
```python
from aiida.orm import load_node
import sys
import time
from aiida.engine.processes import control

if __name__ == "__main__":
    wf = load_node(int(sys.argv[1]))

    while not wf.is_finished:
        while not wf.is_finished and not wf.paused:
            print("Workflow not paused yet, waiting...")
            time.sleep(2)
        if wf.is_finished:
            break
        question = wf.base.extras.get('question', 'No question found.')
        print("--------------------------------------------------")
        print(f"Question from workflow: '{question}'")
        answer = input("Your answer: ")
        wf.base.extras.set('answer', answer)
        control.play_processes([wf])
        print(f"Answer submitted and workflow replayed.")
        print("Waiting for next question...")

    print("==================================================")
    print("Workflow finished!")
    if 'result' in wf.outputs:
        print(f"Output message: {wf.outputs.result.value.get('message', 'No output message found.')}")
    else:
        print("No result output found.")

    print("History of attempts:")
    for attempt in wf.outputs.result.value.get('history', []):
        print(f"  {attempt}")
```

Then run with `verdi run auto-guess.py <PK>`.

## Outlook

This simple demo shows how AiiDA workflows can easily be extended to include human feedback loops.
Such patterns can be extremely useful in production cases, for instance:

- Pausing when an unexpected node failure occurs, allowing the user to replay once the cluster is stable.
- Checking intermediate outputs before launching long or expensive calculations.
- Manually deciding the next step of an adaptive workflow.


We're currently exploring ways to bring this approach into production workflows, for example, in the AiiDA-Quantum ESPRESSO plugin, where we could pause and resume jobs after cluster-side issues.

Do you think AiiDA should have native support for human feedback loops?
For example:

- a standardised way to exchange "questions" and "answers" with workflows,
- clearer visualisation of paused processes that are waiting for input,
- or even a CLI command like `verdi workchain reply-and-restart <PK>`?

You can follow the discussion on how to bring interactive re-playing for unhandled failures into the `BaseRestartWorkChain` in [this PR](https://github.com/aiidateam/aiida-core/pull/7069).

We'd love to hear your thoughts!


### A final note on provenance

If your workflow simply pauses and resumes after failures, no special provenance tracking is needed.
However, if user input influences subsequent calculations, it may be important to record what decisions were made.
In most cases, since workflows generate new inputs for calculations, these will already appear in the provenance graph.
But if you have more complex or interactive use-cases, we'd be curious to hear your ideas on how to best record such feedback loops.

As always, happy computing!
