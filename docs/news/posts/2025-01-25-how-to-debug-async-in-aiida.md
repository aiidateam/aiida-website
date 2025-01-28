---
blogpost: true
category: Blog
tags: asynchronous engine design
author: Jusong Yu
date: 2025-01-30
---

# Debugging Asynchronous Programming in AiiDA

Asynchronous allows program to scale better by switching tasks run on CPU while waiting on I/O, network operations, or other tasks that don’t require constant processing. 
However, debugging async code can be tricky especially in the context of **AiiDA**, where the event loop may be configured in unorthodox ways.

In this blog post, we will:

1. Introduce asynchronous programming in AiiDA.  
1. Explore why debugging async code is difficult.  
1. Discuss standard ways to debug Python async code and show how these approaches fit (or sometimes do not fit) in AiiDA’s setup.  
1. Walk through a specific case study of using `aiomonitor` to find a slow coroutine stuck in the event loop.  
1. Look at possible avenues for improving async programming within AiiDA.

---

## Async Programming in AiiDA

As part of its architecture, AiiDA employs [**Plumpy** (a Python workflow library)](https://github.com/aiidateam/plumpy) under the hood to schedule AiiDA processes into an event loop. 
Plumpy relies on asynchronous mechanisms (Futures, event loops, coroutines) for handling complex workflows with potentially long-lived tasks.

Most Python libraries that deal with concurrency use the `asyncio` module. 
A more standard way of using `asyncio` is by having an interpreter managing an single event loop. 
For tasks that may require IO bounded operations, a coroutine is scheduled with `await` if it needs to run chronologically after another coroutine. 
Or a coroutine can be scheduled as a task in the event loop so it can be picked up by the next event loop and run asynchronously with other tasks.

Many Python libraries that address concurrency rely on the asyncio module. 
Typically, you have a thread managing a single event loop. 

When dealing with I/O-bound tasks, you can use await to run one coroutine immediately after another in sequence. 
Using await does let one coroutine wait on (and effectively run after) another coroutine. 
However, a key idea is that await allows the event loop to run other coroutines while the current one is waiting for I/O. 
Using `await` cooperatively giving control back to the event loop whenever you do something that can be awaited.

Alternatively, you can schedule a coroutine as a task in the event loop, allowing it to be picked up in the next iteration and run concurrently with other tasks.
Scheduling a coroutine as a task with something like `asyncio.create_task(...)` that allows to run concurrently with other tasks. 
This means the event loop will interleave their execution. 
In practical sense, each task appears to run at the same time, but under the hood, the event loop is switching between tasks when they hit I/O or an await.

In AiiDA, processes are launched and scheduled on an event loop, which can be nested or re-entered using tools `nest-asyncio`. 
Each event loop running AiiDA processes is managed by an AiiDA runner (also referred to as a worker, as these terms are used interchangeably in the AiiDA context). 
The AiiDA daemon controls these workers, allowing for their dynamic start/stop and scaling by increasing or decreasing the number of workers as needed. 
For more detailed information on the AiiDA engine, refer to our [AiiDA engine paper (Comp. Mat. Sci. 187, 110086 (2021))](https://doi.org/10.1016/j.commatsci.2020.110086).

The combination of concurrency, external runners, and re-entrant event loops helps AiiDA remain responsive, but it can also create non-standard debugging situations.

---

## Why Is Debugging Async Code Hard?

Debugging asynchronous code is inherently challenging, not just in the Python ecosystem but across programming languages. 
Even in a language I enjoy working with, like Rust, debugging asynchronous code often demands specialized tools and workflows. 
For instance, a single asynchronous runtime in Rust, such as Tokio, has its own [dedicated toolchain](https://github.com/tokio-rs/console) to assist with debugging.

In Python, the situation relies heavily on community-contributed tools for debugging asynchronous code. 
However, these tools are not always widely known or commonly adopted, which can add to the difficulty of debugging in Python's async landscape.

The asynchronous execution flow is not predictable. 
In async code, the flow of execution doesn’t follow a strict top-to-bottom, call-stack pattern like synchronous code. 
Coroutines can yield control back to the event loop at different times, making it harder to pinpoint where problems occur.

It is tricky to set breakpoint to into the code break point and debug.
Traditional Python debugging (like `pdb.set_trace()`) often relies on a breakpoint that suspends all execution. 
But in async code, placing a breakpoint in the middle of a coroutine may not truly pause the entire event loop. 
Other coroutines can still be running in parallel, leading to inconsistent states when you inspect variables.

## Async programming in AiiDA is harder.

### `nest-asyncio` 

As mentioned above, AiiDA using `nest-asyncio` to make the event loop started by the parent AiiDA process able to nest another event loop of child process.
In principle, every AiiDA process could be launched as an asyncio task. 
However, for historical reasons, this approach wasn't adopted. 
AiiDA processes include workchains, which are themselves processes capable of launching other AiiDA processes. 
Instead, processes are launched using `loop.run_until_complete(self.step_until_terminated())`, where `self.step_until_terminated` is an asynchronous function that steps through all `awaitable` coroutines of the process. 

This approach requires starting a new event loop for each newly spawned process within the parent process's event loop. 
However, after the introduction of [PEP 3156](https://peps.python.org/pep-3156/), which standardized `asyncio` as Python's asynchronous runtime, event loops became non-reentrant. 
The community also decided not to [support nested event loop](https://github.com/python/cpython/issues/66435).
Previously, AiiDA used [`tornado`](https://www.tornadoweb.org/en/stable/), a separate asynchronous runtime, before the standardization of `asyncio`. 

To ensure compatibility with the original design, AiiDA utilize [`nest-asyncio`](https://github.com/erdewit/nest_asyncio), which allows re-entry into event loops. 
This approach enables AiiDA to manage a single event loop per thread, allowing all processes to run asynchronously within that loop.
Meanwhile, we recognizing that most AiiDA users come from scientific fields where asynchronous programming may be unfamiliar and challenging to work with.
By exposing the synchronous `execute` method of AiiDA process to end user, so user don't need to struggle about any asynchronous programming. 

This also allows AiiDA to run asynchronous code in an interactive environment like an IPython shell. 
However, it lead to edge cases that don’t arise in a purely “vanilla” `asyncio` setup.


### RPC-Like Communication 

Python’s `asyncio` typically runs in a single thread, but AiiDA use daemon to spin up dedicated runners on separate threads or even kernal processes (separate python interpreter). 
Since the main thread is not always the one directly running the event loop, standard debugging tools can be less effective.

AiiDA’s `verdi daemon` or its internal runners can communicate with each other (and with the client) via remote procedure calls (RPC). 
Debugging these interactions can be complicated when you have multiple processes or threads exchanging async messages.

It means when using AiiDA in production, we are facing two levels of concurrency.
The AiiDA workers are run in independent interpreters which not sharing the memory. 
Each worker manages its own event loop that interleave and jump between for running processes. 

---

## Standard Ways to Debug Async Python Code

Despite these complexities, there are still some regular tools for debugging async code in Python:

1. **`print` and Logging**:  
   - The simplest solution can be the most effective. Insert logging statements (`logging.debug`, `logging.info`) or `print` statements to trace the execution flow.  
   - You can set up more verbose logging or increase the logging level to capture more details about what is happening inside coroutines.

2. **`asyncio` Debug Mode**:  
   - `loop.set_debug(True)` can be used to enable extra debugging features in `asyncio`. It often logs warnings about long-running tasks, late callbacks, or exceptions that aren’t caught.  
   - In standard Python code, you might do something like:
     ```python
     import asyncio

     loop = asyncio.get_event_loop()
     loop.set_debug(True)

     # The rest of your async code...
     loop.run_until_complete(some_coroutine())
     ```
   - This can already provide insights into where the event loop might be getting stuck and we use it inside plumpy event loop when the debug logging level is set.

3. **Tracers and Profilers**:  
   - Tools such as [Yappi](https://github.com/sumerc/yappi) or [PyInstrument](https://github.com/joerick/pyinstrument) can sometimes give you an overview of where the code is spending time.
   - I notice these tools when I writting this post, it worth to give it a try in AiiDA. Nevertheless, it requires the event loop management more standard without using `nest-asyncio`.

4. **`pdb`/`ipdb`**:  
   - You can still use `pdb`, but you have to be mindful: hitting a breakpoint in a coroutine does not always guarantee the rest of the event loop will pause nicely.  
   - In some scenarios, wrapping coroutines in synchronous “test harnesses” (i.e., running them via `asyncio.run(...)`) can let you debug them in a more controlled environment.

---

## A Real-World Stuck Coroutine

The idea of this post comes from I [stuck and debugging hang up of running a unit test in AiiDA for checking memory leak](https://github.com/aiidateam/aiida-core/pull/6701#discussion_r1913513178).
The problem was lead from remote resouces accessing using the transport takes so long because they were running in the block manner and have default interval set for 30s for each communication operations (see discussion [#6599](https://github.com/aiidateam/aiida-core/pull/6599) for more detail).
Anyway, hard to find the cause until I use `aiomonitor` to check the stack trace of the asynchronous task.

### Regular Tools vs. AiiDA’s Setup

Because AiiDA can run the event loop in a dedicated runner or separate interpreter, not all standard techniques map cleanly. For example:

- If you try `loop.set_debug(True)` in a shell script or an AiiDA plugin, you might not control the loop if it’s managed in dedicated python interpreter by the AiiDA daemon.  
- If you add breakpoints in the code run by the daemon, you might not have access to the daemon’s console to interact with `pdb`.  
- Logging messages may go to different loggers or be handled by the daemon’s logging configuration.

### Where Do My Debug Messages Go?

A key question is: *Which logger am I using, and where are logs being handled?* In AiiDA, you often have logs going to:

- The daemon’s own logs.  
- The user’s command line (for `verdi` commands).  

If the AiiDA processes are run through daemon, then the log message are generally goes into the daemon log file in your AiiDA config path. 
It is usually the file inside `.aiida` path. 
For pytest, the AiiDA path is reset to the pytest tmp folder. 
By [aiidateam/aiida-core #6698](https://github.com/aiidateam/aiida-core/pull/6698), if you run pytest with setting cli log level to `DEBUG`, it will print where these log file is located.

For example run:
```
pytest tests/engine/processes/test_control.py::test_kill_processes -v -s --log-cli-level=DEBUG
```

Then you can go and check the log messages if exceptions raised from daemon.
When debugging, double-check your `logging` setup and make sure you’re either writing to `stderr` or to a file that you can monitor.

### `aiomonitor` Is A Good Friend: A Case Study

Another known challenge is diagnosing a situation where **Plumpy** or the AiiDA RPC communication gets “stuck.” 
This often manifests as your code simply hanging, with no apparent errors or timeouts. 
Tracing this can be *extremely* frustrating without a real-time window into the event loop’s state.

One particularly useful tool in such scenarios is [`aiomonitor`](https://github.com/aio-libs/aiomonitor). 
`aiomonitor` allows you to attach a small Telnet-based console to your running event loop so you can:

- Inspect running tasks and coroutines.
- Trigger debugging or introspection on them.
- See how many tasks are currently in the loop.

Install the tool and applying to AiiDA.

```bash
pip install aiomonitor
```

In a typical script (or if you have direct control over the loop), you can wrap the event loop with an `aiomonitor` context:
For `test_kill_processes`, luckily the event is not from daemon but directly from the pytest threading (otherwise need to using daemon log debug above first and decouple the run of AiiDA process in a dedicate event loop of pytest). 

Since the event loop is start from `plumpy` process's `execute` method, it requires to make the change for the `execute` method as below to monitoring the event loop using `aiomonitor`.

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
It will enter a REPL like ipdb where you can check the task and the stack trace of a running task by finding the id of the task and use `where` to print the trackback of the task.
If you notice one coroutine that isn’t making progress, you can delve deeper, potentially finding out if there’s a deadlock, an indefinite `await`, or some blocking I/O.

## Future Improvements for Async Programming in AiiDA

Debugging async code in AiiDA is still evolving. Some potential areas for improvement include:

1. **Deprecate deprecated `nest-asyncio`**:
   - `nest-asyncio` is deprecated, so there is not strong reason to keep on using it. It means we need to find a better way to manage the event loop for nested AiiDA processes.

1. **Better Logging & Tracing**:  
   - Introducing more trace logs around critical sections (like scheduling, cancellations, and state transitions of coroutines) could help developers pinpoint issues faster.

1. **Documentation & Recipes**:  
   - Sharing debugging “recipes” (e.g., how to attach an event loop debugger in a plugin vs. in the daemon) would help new developers.

1. **Test Harnesses for Async**:  
   - Providing a robust local runner that can be launched in a fully controlled environment (with or without `nest-asyncio`, with or without AiiDA daemon, with or without RabbitMQ) would let developers more easily replicate issues in their own environment.

1. **Enhanced Timeout & Deadlock Detection**:  
   - Building on top of `asyncio` debug mode, AiiDA could detect tasks that exceed certain time limits, automatically log stack traces, or even attempt to break out of deadlocks.

---

## Conclusion

Asynchronous programming enables AiiDA to manage complex, distributed nested workflows efficiently, but it also complicates developing and debugging. 
From standard Python debugging approaches (`pdb`, logging, trace tools) to more advanced techniques like `aiomonitor`, there are ways to tackle the challenges. 
While some approaches work seamlessly, others need adaptation for AiiDA’s nest-asyncio and multi-process environment.

By continuing to improve our asynchronous design, refine our logging strategies, adopting specialized debugging tools, and sharing best practices across the community, we hope can make async in AiiDA robust for everyone. 

