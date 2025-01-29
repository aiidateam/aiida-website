---
blogpost: true
category: Blog
tags: asynchronous engine design
author: Jusong Yu
date: 2025-01-31
---

# Debugging Asynchronous Programming in AiiDA

Asynchronous programming allows a program to scale better by switching tasks running on the CPU while waiting on I/O, network operations, or other tasks that don't require constant processing.
However, debugging async code can be tricky especially in the context of **AiiDA**, where the event loop may be configured in uncommon ways.

In this blog post, we will:

1. Introduce asynchronous programming in AiiDA.
1. Explore why debugging async code is difficult.
1. Discuss standard ways to debug Python async code and show how these approaches fit (or sometimes do not fit) in AiiDA's setup.
1. Walk through a specific case study of using `aiomonitor` to find a slow coroutine stuck in the event loop.
1. Look at possible avenues for improving async programming within AiiDA.

---

## Async Programming in AiiDA

As part of its architecture, AiiDA employs [**Plumpy** (a Python workflow library maintained by the AiiDA team)](https://github.com/aiidateam/plumpy) under the hood to schedule AiiDA processes into an event loop.
Plumpy relies on asynchronous principles and mechanisms (Futures, event loops, coroutines) for handling complex workflows with potentially long-lived tasks.

Most Python libraries that deal with concurrency use the `asyncio` module of the standard library.
The typical way of using `asyncio` is by having an interpreter managing a single event loop.

When handling I/O-bound tasks, one can use `await` to run coroutines sequentially – one after another.
When a coroutine encounters `await`, it pauses execution and allows the event loop to run other coroutines while waiting for I/O.
This way, control is efficiently handed back to the event loop instead of blocking execution.

One can schedule a coroutine as a task using, for instance, `asyncio.create_task(...)`, which allows it to run concurrently with other tasks.
This means the event loop interleaves execution, switching between tasks whenever they reach an `await` or an I/O operation.
From a practical perspective, tasks appear to run simultaneously, but in reality, the event loop is rapidly switching between them.

In AiiDA, processes are launched and scheduled on an event loop, which can be nested or re-entered (using `nest-asyncio`; see below).
Each event loop running AiiDA processes is managed by an AiiDA `Runner` (also referred to as a `Worker`; these terms are used interchangeably in the AiiDA context).
The AiiDA `Daemon` controls these workers, allowing for their dynamic start/stop and scaling by increasing or decreasing the number of workers as needed.
For more detailed information on the AiiDA engine, refer to our [AiiDA engine paper (Comp. Mat. Sci. 187, 110086 (2021))](https://doi.org/10.1016/j.commatsci.2020.110086).

The combination of concurrency, external runners, and re-entrant event loops helps AiiDA remain responsive, but it can also create non-standard debugging situations.

---

## Why Is Debugging Async Code Hard?

Debugging asynchronous code is inherently challenging, not just in the Python ecosystem but across programming languages.
Also in (blessed) Rust 🦀, debugging asynchronous code often demands specialized tools and workflows.
For instance, a single asynchronous runtime in Rust, such as Tokio, has its own [dedicated toolchain](https://github.com/tokio-rs/console) to assist with debugging.

In Python, the situation relies heavily on community-contributed tools for debugging asynchronous code.
However, these tools are not always widely known or commonly adopted, which can add to the difficulty of debugging in Python's async landscape.

The situation is further complicated, because the asynchronous execution flow is not predictable.
In async code, the flow of execution doesn't follow a strict top-to-bottom, call-stack pattern like synchronous code.
Coroutines can yield control back to the event loop at different times, making it harder to pinpoint where problems occur.

Finally, it is tricky to set breakpoints into the code for debugging, as traditional Python debugging (like `pdb.set_trace()`) often relies on a breakpoint that suspends _all_ execution.
However, in async code, placing a breakpoint in the middle of a coroutine may not truly pause the entire event loop.
Other coroutines can still be running in parallel, leading to inconsistent states when you inspect variables.

## Async programming in AiiDA is harder.

### `nest-asyncio`

As mentioned above, AiiDA is using `nest-asyncio` to make the event loop started by the parent AiiDA process able to nest other event loops of child processes.
In principle, every AiiDA process could be launched as an asyncio task, however, for historical reasons, this approach wasn't adopted.
AiiDA processes include workchains, which are themselves processes capable of launching other AiiDA processes.
Instead, processes are launched using `loop.run_until_complete(self.step_until_terminated())`, where `self.step_until_terminated` is an asynchronous function that steps through all `awaitable` coroutines of the process.

This approach requires starting a new event loop for each newly spawned process within the parent process's event loop.
However, after the introduction of [PEP 3156](https://peps.python.org/pep-3156/), which standardized `asyncio` as Python's asynchronous runtime, event loops became non-reentrant.
The community also decided not to [support nested event loop](https://github.com/python/cpython/issues/66435).
Previously, AiiDA used [`tornado`](https://www.tornadoweb.org/en/stable/), a separate asynchronous runtime, before the standardization of `asyncio`.

To ensure compatibility with the original design, AiiDA utilizes [`nest-asyncio`](https://github.com/erdewit/nest_asyncio), which allows re-entry into event loops.
This approach enables AiiDA to manage a single event loop per thread, allowing all processes to run asynchronously within that loop.
Meanwhile, we recognizing that most AiiDA users come from scientific fields where asynchronous programming may be unfamiliar and challenging to work with.
By exposing the synchronous `execute` method of AiiDA process to the users, they don't need have to struggle with any asynchronous programming concepts, which are effectively hidden away in AiiDA's (and plumpy's) `src`.

This also allows AiiDA to run asynchronous code in an interactive environment like an IPython shell.
However, it lead to edge cases that don't arise in a purely "vanilla" `asyncio` setup.

### RPC-Like Communication

Python's `asyncio` typically runs in a single thread, but AiiDA uses its daemon to spin up dedicated runners on separate threads or even kernal processes (separate python interpreters).
Since the main thread is not always the one directly running the event loop, standard debugging tools can be less effective.

AiiDA's `verdi daemon` command or its internal runners can communicate with each other (and with the client) via remote procedure calls (RPC).
Debugging these interactions can be complicated when you have multiple processes or threads exchanging async messages.

It means when using AiiDA in production, we are facing two levels of concurrency:
1. The AiiDA workers are run in independent interpreters which are not sharing the memory, and
1. Each worker manages its own event loop that interleaves and jumps between for running processes.

---

## Standard Ways to Debug Async Python Code

Despite these complexities, there are still some regular tools for debugging async code in Python:

1. **`print` and Logging**:
   - The simplest solution can be the most effective: insert logging statements (`logging.debug`, `logging.info`) or `print` to trace the execution flow.
   - You can set up more verbose logging or increase the logging level to capture more details about what is happening inside coroutines.

2. **`asyncio` Debug Mode**:
   - `loop.set_debug(True)` can be used to enable extra debugging features in `asyncio`. It often logs warnings about long-running tasks, late callbacks, or exceptions that aren't caught.
   - In standard Python code, you might do something like:
     ```python
     import asyncio

     loop = asyncio.get_event_loop()
     loop.set_debug(True)

     # The rest of your async code...
     loop.run_until_complete(some_coroutine())
     ```
   - This can already provide insights into where the event loop might be getting stuck and we use it inside the plumpy event loop when the `debug` logging level is set.

3. **Tracers and Profilers**:
   - Tools such as [Yappi](https://github.com/sumerc/yappi) or [PyInstrument](https://github.com/joerick/pyinstrument) can sometimes give you an overview of where the code is spending time.
   - When writting this post, I found out about these tools, and deemed it worth it to give them a try in AiiDA. However, they require more standard event loop management without using `nest-asyncio`.

4. **`pdb`/`ipdb`**:
   - You can still use Python's `pdb` debugger (or the iPython version, `ipdb`), but you have to be mindful: hitting a breakpoint in a coroutine does not always guarantee the rest of the event loop will pause nicely.
   - In some scenarios, wrapping coroutines in synchronous "test harnesses" (i.e., running them via `asyncio.run(...)`) can let you debug them in a more controlled environment.

---

## A Real-World Stuck Coroutine

The insights for this post were obtained while working on [PR #6701](https://github.com/aiidateam/aiida-core/pull/6701), where I was stuck on debugging a long execution time of an AiiDA unit test that checks for a memory leak.
While the test itself was actually working fine, the long execution time originated from accessing remote resouces via AiiDA's `Transport` mechanism, which took unexpectedly long because transport operations were running in a synchronous, blocking manner, having a default SSH timeout interval of 30s for each transport communication (see plans to decrease the default value of this setting in [PR #6599](https://github.com/aiidateam/aiida-core/pull/6599) for more detail).
Until using `aiomonitor` to check the stack trace of the asynchronous task, the actual issue was very difficult to trace back.

### Regular Tools vs. AiiDA's Setup

Because AiiDA can run the event loop in a dedicated runner or separate interpreter, not all standard techniques outlined above can be applied cleanly.
For example:

- If you try `loop.set_debug(True)` in a shell script or an AiiDA plugin, you might not control the loop if it's managed in a dedicated python interpreter managed by the AiiDA daemon.
- If you add breakpoints in the code run by the daemon, you might not have access to the daemon's console to interact with through `pdb`.
- Logging messages may go to different loggers or be handled by the daemon's logging configuration.

### Where Do My Debug Messages Go?

A key question is: *Which logger am I using, and where can I access the logs?* In AiiDA, you often have logs going to:

- The daemon's own logs
- The user's command line (for `verdi` commands).

In the first case, if the AiiDA processes are run through the daemon, the log messages generally go into the daemon log file in your AiiDA config path, typically located in `.aiida/daemon/log/` under your `$AIIDA_PATH` (which can also be printed to `stdout` via the `verdi daemon logshow` CLI command).
However, when actually running tests via pytest, the `$AiiDA_PATH` is reset to the pytest tmp folder for the session.
With the changes of a recent [PR #6698](https://github.com/aiidateam/aiida-core/pull/6698), now if you run pytest with setting the CLI log level to `DEBUG`, it will print where these log file is located.

For example you can run:

```
pytest tests/engine/processes/test_control.py::test_kill_processes -v -s --log-cli-level=DEBUG
```

Then you can go and check the log messages if exceptions raised from the daemon.
When debugging, double-check your `logging` setup and make sure you're either writing to `stderr` or to a file that you can monitor.

### `aiomonitor` Is A Good Friend: A Case Study

Another known challenge is diagnosing a situation where **Plumpy** or the AiiDA RPC communication gets "stuck."
This often manifests as your code simply hanging, with no apparent errors or timeouts.
Tracing this can be *extremely* frustrating without a real-time window into the event loop's state.

One particularly useful tool in such scenarios is [`aiomonitor`](https://github.com/aio-libs/aiomonitor).
`aiomonitor` allows you to attach a small Telnet-based console to your running event loop so you can:

- Inspect running tasks and coroutines.
- Trigger debugging or introspection on them.
- See how many tasks are currently in the loop.

To install the tool and apply it to debug async code in AiiDA:

```bash
pip install aiomonitor
```

In a typical script (or if you have direct control over the loop), you can wrap the event loop with an `aiomonitor` context manager:
For `test_kill_processes`, luckily the event is not from the daemon but directly from the pytest threading (otherwise one would need to use the daemon log to debug the former first and decouple the execution of the AiiDA process in a dedicate event loop of pytest).

Since the event loop is started from `plumpy` `Process`'s `execute` method, it is necessary to make the change for the `execute` method as below to monitor the event loop using `aiomonitor`.

```python
from aiomonitor import Monitor

class Process(...):
    ...

    def execute(self) -> dict[str, Any] | None:
        """
        Execute the process.  This will return if the process terminates or is paused.

        :return: None if not terminated, otherwise `self.outputs`
        """
        if not self.has_terminated():
            with Monitor(loop=loop, host='127.0.0.1', port=50101):
                self.loop.run_until_complete(self.step_until_terminated())

        return self.future().result()

```

Now, if your event loop seems stuck, you can open a separate terminal and run:

```bash
telnet 127.0.0.1 50101
```

From there, you can type commands like `tasks` to see a list of running coroutines.
It will enter a read-eval-print-loop (REPL) like `ipdb` session, where you can check the status and stack trace of a running task by finding its id and use `where` to print its traceback.
If you notice one coroutine isn't making progress, you can delve deeper into it, potentially finding out if there's a deadlock, an indefinite `await`, or some blocking I/O.

## Future Improvements for Async Programming in AiiDA

Debugging async code in AiiDA is still evolving. Some potential areas for improvement include:

1. **Remove deprecated `nest-asyncio`**:
   - `nest-asyncio` is deprecated, so there is no strong reason to keep on using it. It means we need to find a better way to manage the event loop for nested AiiDA processes.

1. **Better Logging & Tracing**:
   - Introducing more trace logs around critical sections (like scheduling, cancellations, and state transitions of coroutines) could help developers pinpoint issues faster.

1. **Documentation & Recipes**:
   - Sharing debugging "recipes" (e.g., how to attach an event loop debugger in a plugin vs. in the daemon) would help new developers.

1. **Test Harnesses for Async**:
   - Providing a robust local runner that can be launched in a fully controlled environment (with or without `nest-asyncio`, with or without AiiDA daemon, with or without RabbitMQ) would let developers more easily replicate issues in their own environment.

1. **Enhanced Timeout & Deadlock Detection**:
   - Building on top of `asyncio` debug mode, AiiDA could detect tasks that exceed certain time limits, automatically log stack traces, or even attempt to break out of deadlocks.

---

## Conclusion

Asynchronous programming enables AiiDA to manage complex, distributed, and nested workflows efficiently, and allows it to scale effectively, however, it also complicates developing and debugging.
From standard Python debugging approaches (`pdb`, logging, trace tools) to more advanced techniques like `aiomonitor`, there are various ways to tackle challenges.
While some approaches work seamlessly, others need adaptation for AiiDA's `nest-asyncio` and multi-process, RPC environment.

By continuing to improve our asynchronous design, refine our logging strategies, adopting specialized debugging tools, and sharing best practices across the community, we hope can make async in AiiDA robust and traceable for everyone.

Lastly, make sure to keep an eye open for the next blog post!
It is scheduled for 2025-02-21, will continue on the topic of asynchronous programming, and give you insight into how we added an asynchronous transport plugin (via [PR #6626](https://github.com/aiidateam/aiida-core/pull/6626)) which will be released with AiiDA v2.7.0.
