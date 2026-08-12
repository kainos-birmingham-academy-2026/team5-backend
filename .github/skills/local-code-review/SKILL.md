---
name: local-code-review
description: Review the current feature branch against the repository default branch and save a static review report under code_reviews/.
---

# Local code review

Perform a static review of the checked-out feature branch against `origin/main`
or `origin/master`.

## Constraints

- Do not modify application source files.
- Do not run builds, tests, formatters, package managers, or dependency installs.
- Stop with an error if the current branch is `main` or `master`.
- Review committed changes only.
- Treat `.github/copilot-review-instructions.md` as mandatory review guidance.
- Focus findings on defects, regressions, security, maintainability risks, and
  missing tests. Do not report style preferences unless they create a concrete
  risk.

## Procedure

1. Determine whether the default branch is `origin/main` or `origin/master`.
2. Fetch only that default branch from `origin`.
3. Determine the merge base between `HEAD` and the default branch.
4. Inspect the changed-file list, diff stat, and unified diff from the merge
   base to `HEAD`. Ignore generated files and dependency lockfile noise.
5. Apply `.github/copilot-review-instructions.md` to the review.
6. List findings first, ordered by severity. Every finding must include a file
   and line reference, the concrete risk, and a concise remediation hint.
7. Use `assets/report-template.md` for the report structure.
8. Create `code_reviews/` if needed and write the report to
   `code_reviews/<safe-branch-name>-<YYYY-MM-DD>.md`. Replace `/` in the branch
   name with `-`. Overwrite an existing report with the same name.
9. If no issues are found, say so explicitly and note any remaining test gaps
   or review limitations.

The final response must state the verdict and report path.