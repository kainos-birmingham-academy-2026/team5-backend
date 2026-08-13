---
name: implement-story
description: 'Implement a user story end to end from pasted requirements, a Git-host issue, or a Microsoft Planner work item. Use when asked to deliver a ticket: clarify requirements, inspect all workspace repositories, infer branch and commit conventions, branch from chosen bases, implement code and tests, validate, commit, push, explain the changes, and create approved pull or merge requests.'
argument-hint: 'Story title and description, issue URL, or work item ID'
---

# Implement Story

Deliver a user story across every affected Git repository in the current
workspace. Treat repositories as independent histories: a cross-repository
story gets a separate branch, commit series, push, and review request in each
affected repository.

## Required Inputs

Collect or derive these before implementation:

- Story title.
- Story description.
- Acceptance criteria.
- Source branch for each affected repository.
- Review-request target branch for each affected repository.
- Optional ticket or story ID.

Accept pasted story details or an issue/work-item URL or ID. For retrieval:

1. Detect the Git host from `git remote` and use an authenticated, available
   host integration or CLI.
2. Retrieve Microsoft Planner details only when an authenticated Planner or
   Microsoft Graph integration is available.
3. Never invent inaccessible issue content. Ask the user to paste the title,
   description, and acceptance criteria when retrieval is unavailable.

## Safety and Approval Gates

- Ask clarification questions whenever an answer could materially change
  behavior, scope, repository impact, data contracts, or tests. Do not ask
  questions that can be answered reliably from nearby code or repository
  documentation.
- Do not implement, create branches, stash changes, commit, or push until the
  user approves the pre-implementation summary.
- Pre-implementation approval authorizes the approved implementation through
  committing and pushing. Stop for renewed approval if the required scope,
  branch, or approach changes materially.
- Do not create a pull request or merge request until the user approves its
  exact target, title, and description.
- Never force-push, discard user changes, expose secrets, bypass hooks, or
  include unrelated work in commits.
- Do not push when relevant validation remains failing or the implementation
  is incomplete. Report the blocker instead.

## Terminal Execution Rules

- Keep the terminal in the workspace root. Never use `cd` to enter a
  repository; scope Git commands with `git -C <repository-path>` and use the
  execution tool's working directory for package commands when available.
- Run staging, inspection, validation, commit, and push as separate terminal
  calls. Do not combine these steps into a long `&&` command.
- Run `git add` as a one-shot command. It normally prints nothing on success;
  treat a completed exit code `0` with empty output as success and immediately
  verify the index with a separate `git diff --cached --name-only` command. Do
  not wait, poll, or rerun staging merely because stdout is empty.
- Do not use shell negation (`!`), quote-spliced regular expressions, or an ad
  hoc credential regex against a piped diff. These constructs can be parsed as
  incomplete interactive input and can also turn an expected no-match result
  into an ambiguous command status.
- Use non-interactive commands. If a command unexpectedly requests input, stop
  and handle the prompt explicitly rather than sending another shell command.
- Prefer repository-provided secret scanning. If none exists, inspect the
  staged file list and staged diff directly for credentials and sensitive data;
  never print secret values in chat or terminal output.

## Phase 1: Understand and Propose

1. Discover every Git repository in the current workspace and evaluate whether
   the story affects each one. Do not assume the repository containing this
   skill is the only affected repository.
2. Read applicable repository instructions, contribution guidance, package
   scripts, review-request templates, and nearby implementation and tests.
3. Inspect each repository's status, remotes, default branch, recent local and
   remote branch names, and recent commit subjects.
4. Infer branch naming and commit conventions from repository evidence. If the
   evidence is inconsistent, propose the closest dominant pattern and call out
   the uncertainty.
5. Ask only the material clarification questions that remain. Confirm source
   and target branches separately; do not assume they are the same.
6. Present one pre-implementation approval summary containing:
   - interpreted requirements, acceptance criteria, and explicit assumptions;
   - affected repositories and why each is or is not affected;
   - proposed feature branch, source branch, and target branch per repository;
   - implementation approach and likely areas of change;
   - test, lint, build, type-check, and UI-evidence plan;
   - existing working-tree changes that will be stashed; and
   - any risks, migrations, dependencies, or external requirements.
7. Ask the user to approve or revise that summary. Do not proceed without an
   affirmative response.

## Phase 2: Prepare Branches

For each affected repository after approval:

1. Record the original branch and working-tree state.
2. If tracked or untracked changes exist, create a clearly labelled stash that
   includes untracked files. Record the exact stash reference. Do not stash
   ignored files.
3. Fetch the approved source branch from its remote.
4. Check out the local source branch, creating it to track the remote source if
   necessary, and update it using fast-forward only. Stop if it cannot be
   fast-forwarded cleanly.
5. Create the approved feature branch from the updated source. Stop rather than
   overwrite or reset an existing branch with divergent work.

Prepare all affected repositories before editing. If preparation fails in any
repository, do not start implementation and restore repositories as described
in Cleanup.

## Phase 3: Implement and Test

1. Follow the story through the owning code path and implement the smallest
   complete change that satisfies every acceptance criterion.
2. Preserve repository architecture, public contracts, formatting, and naming
   patterns unless the story explicitly requires a change.
3. Add or update focused automated tests for new behavior, regressions, edge
   cases, and error paths justified by the story.
4. After the first substantive edit, run the cheapest focused executable check.
   Continue iteratively, repairing failures caused by the implementation.
5. Run all relevant repository checks before committing. Discover commands from
   repository configuration; normally include focused tests, the full relevant
   test suite, non-mutating lint or CI checks, type checking, and build checks.
6. For UI changes, verify affected flows at representative desktop and mobile
   sizes. Capture screenshots when browser tooling is available. Do not commit
   screenshots solely as review evidence unless the repository convention
   requires it.
7. If a failure is unrelated, record evidence that it predates the story. If a
   relevant failure cannot be resolved, stop before commit and push.

## Phase 4: Review, Commit, and Push

For each affected repository:

1. Review the complete diff against the approved source branch and check for
   accidental files, generated noise, credentials, debug code, missing tests,
   and acceptance-criteria gaps.
2. Stage only the intended paths using `git -C <repository-path> add --
   <paths>`. In separate commands, run `git diff --cached --check`, inspect
   `git status --short`, inspect `git diff --cached --stat`, and review the
   staged diff. Run a configured secret scanner separately when available.
3. Infer commit-message style and commit granularity from recent history. Create
   one or more logical commits without mixing unrelated changes. Include the
   optional ticket ID where the inferred convention supports it.
4. Re-run any validation affected by commit hooks or formatting.
5. Push the feature branch with upstream tracking using a normal push. Never
   force-push.

If one repository fails, do not conceal partial progress. Stop further remote
mutations and report exactly which branches and commits were already pushed.

## Phase 5: Explain and Request Approval

After all required branches are pushed, prepare a separate review request for
each repository. Show the user:

- repository, source branch, pushed feature branch, and target branch;
- exact review-request title;
- commit and changed-file summary;
- exact review-request description;
- validation commands and outcomes; and
- UI screenshots or a clear reason they could not be attached.

Use this description structure, adapting headings to an existing repository
template when one exists:

```markdown
## Story
<title, description, ticket link or ID, and acceptance criteria>

## Implementation
<what changed, key design choices, and notable files or components>

## Testing
<commands run, outcomes, and UI evidence>

## Risks and follow-ups
<migrations, compatibility concerns, limitations, or "None">
```

Ask for one explicit approval of the exact titles, targets, and descriptions.
The user may approve all requests together or revise them individually.

## Phase 6: Create Review Requests

1. Re-detect the host from each repository's remote.
2. Verify the corresponding CLI or integration is installed and authenticated.
3. Create a ready-for-review request, not a draft, using the approved feature
   branch, target branch, title, and description.
4. Do not add reviewers, labels, assignees, or milestones unless the user asks
   during that run.
5. Record each created request URL. If creation fails, preserve the pushed
   branch and provide the error and a retry command that does not duplicate a
   successfully created request.

## Cleanup

After review-request creation, rejection, or any post-preparation stop:

1. Ensure story work is committed before leaving its feature branch. Never
   hide uncommitted story work in the user's original stash.
2. Return each repository to its recorded original branch.
3. Reapply that repository's recorded stash, if any.
4. If stash application conflicts, stop destructive cleanup, preserve the
   stash, and report the repository, stash reference, and conflicted files.
5. Confirm the final branch and working-tree state for every repository.

## Final Response

Explain in plain language what was implemented and why. Include acceptance
criteria coverage, tests and checks run, pushed branch names, review-request
URLs, restored working-tree status, and any remaining risks or follow-ups.
