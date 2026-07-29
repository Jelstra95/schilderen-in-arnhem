@AGENTS.md

# Worktrees & branches

This repo uses three long-lived colour branches, each checked out in its own
sibling worktree, so several sessions can work in parallel without stepping on
each other:

| Branch | Worktree |
| --- | --- |
| `blue` | `../SchilderenInArnhem-blue` |
| `green` | `../SchilderenInArnhem-green` |
| `pink` | `../SchilderenInArnhem-pink` |

`main` stays checked out in the primary directory `SchilderenInArnhem/`.

Rules:

- Work in the colour worktree the user names (usually matching the session
  colour). Never commit directly to `main`.
- Do not `git checkout` a colour branch in another worktree — each branch is
  already checked out somewhere, so switch directories instead.
- Before starting new work in a colour worktree, rebase or merge `main` into it;
  the colour branches drift behind between tasks.
- Ship changes by opening a PR from the colour branch into `main`; after merge,
  leave the colour branch in place for the next task.
