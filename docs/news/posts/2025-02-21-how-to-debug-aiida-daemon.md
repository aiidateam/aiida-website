---
blogpost: true
category: Blog
tags: daemon, debug
author: Ali Khosravi
date: 2025-02-21
---


# Debugging AiiDA Daemon (a practical guide!)

Debugging an AiiDA daemon process can feel like chasing a ghost, especially when issues only pop up during job submission.
But fear not! This guide will walk you through the problem and provide a step-by-step how-to.

## The Issue

Imagine there's a bug occurring in AiiDA when you try to kill a process using `verdi process kill`.
For instance, the daemon might appear to hang without any activity —something we noticed as a side issue while writing tests for [this PR](https://github.com/aiidateam/aiida-core/pull/6575).
Naturally, you start debugging the easiest way possible: writing a dummy process (probably just a `sleep` command with a lot of seconds), running it, and killing it over and over.
Each time, you gather clues and adjust your breakpoints accordingly, probably focusing on the module responsible for handling `verdi process kill`.

But wait—everything seems to work fine! No bug, no errors.
The bug only rears its head when you **submit** the process to the daemon.
Uh-oh. That's when you realize you have a problem: all those carefully placed breakpoints? Completely unreachable.

### Why is this happening?

AiiDA provides two ways to start a process:

- **`engine.run()`**: The process runs in your current Python session, making debugging a breeze.
- **`engine.submit()`**: The process runs in a separate daemon-managed process, making debugging significantly harder.

The daemon spawns a new process, meaning your breakpoints are being triggered, but you can't interact with them because the execution happens in a separate background process.
Worse, the process might just freeze due to those breakpoints, but you still won't be able to access them.

## Okay, how do we actually debug this?

Here's how to do it right:

### Step 1: Insert Your Breakpoints Before Starting the Daemon

This is critical! Once the daemon starts, the source code is already loaded, so any changes you make afterward won't take effect.

### Step 2: Start the Daemon with One Worker

```bash
verdi daemon start 1
```

### Step 3: Stop the Worker (but Keep the Daemon Running)

```bash
verdi daemon decr 1
```

At this point, the daemon is running, but no workers are picking up tasks.
This means your to-be-submitted process will just chill in the queue, waiting for a worker.

### Step 4: Submit Your Dummy Script

Since there's no worker, your submitted process will remain in the queue.
Perfect—now we can inspect what's happening.

### Step 5: Start a Worker in the Foreground

```bash
verdi daemon worker
```

This step is crucial because now, instead of running in the background, the worker operates in the foreground.
This means you can finally see what's going on and interact with debugging tools like `pdb`.

## Example: Debugging with `verdi process kill`

Alright, let's get back to our example of debugging a **fictitious bug** in `verdi process kill`.
Your debugging steps should look something like this:

- **Stop the daemon to start fresh:**
   ```bash
   verdi daemon stop
   ```
- **Insert breakpoints in AiiDA's source code where you suspect the issue is.**
- **Start the daemon:**
   ```bash
   verdi daemon start 1
   ```
- **Stop the worker while keeping the daemon alive:**
   ```bash
   verdi daemon decr 1
   ```
- **Submit your dummy script.**
- **Start a worker in the foreground:**
   ```bash
   verdi daemon worker
   ```
   Now you can actually see the process running in real time!
- **In a separate terminal, try killing the process:**
   ```bash
   verdi process kill <PROCESS_ID>
   ```
- **Interact with the breakpoints in the `worker` terminal.**
- **Gather clues, refine your breakpoints, adjust your script, and repeat the process!**

### Additional Debugging Tips

- **Enable detailed logging:**

  ```bash
  verdi config list
  verdi config set logging.* DEBUG
  ```

  This will give you a clear picture of execution steps, helping you pinpoint the issue faster.

Now, you can debug AiiDA daemon-managed processes and understand what's going wrong during tasks submission to daemon.
Good luck! 😉
