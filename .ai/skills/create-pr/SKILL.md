---
name: create-pr
description: Open a pull request for the work on the current branch against the default branch, with a conventional title and a bullet list of the changes. Use when asked to create, open or submit a PR.
---

# Create a PR

Turns the current branch into a GitHub pull request against the default branch. Title and body follow `.ai/context/writing-style.md`.

## 1. Check the branch

1. Find the base branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. If that fails, use `main` if it exists, otherwise `master`.
2. If the current branch is the base branch, stop and ask the user which branch to create.
3. Run `git status`. If there are uncommitted or untracked changes, stop and ask the user whether to commit, stash or leave them. Never commit them on your own.
4. Run `git log <base>..HEAD`. If it is empty, stop: there is nothing to open a PR for.

Done when: you are on a feature branch with a clean working tree and at least one commit ahead of the base.

## 2. Understand the changes

Read `git log <base>..HEAD` and `git diff <base>...HEAD`. Group the changes into logical changes; a logical change can span several commits, and one commit can hold several.

Done when: you can name every logical change in one line each.

## 3. Write the title

Format: `<type>: <short description>`

- `<type>` is `feat` for new behaviour, `fix` for a bug fix, and `chore` for everything else (refactoring, docs, tests, dependencies, build).
- If the branch mixes types, use the most significant: `feat` over `fix` over `chore`.
- The description is lowercase, imperative ("add", not "added" or "adds"), has no trailing period, and stays under about 60 characters.

Done when: the title matches the format and says what the branch does.

## 4. Write the body

Read `.ai/context/writing-style.md`. The body is a flat bullet list with one bullet per logical change from step 2:

- each bullet is one sentence in the imperative, saying what changed and, when not obvious, why;
- name files, commands and flags in backticks;
- no headings, no summary paragraph, no test plan, no list of commits.

Then reread title and body against the writing style and cut every needless word.

Done when: every logical change has exactly one bullet and the text follows the writing style.

## 5. Push and open the PR

1. If the branch has no upstream, push it: `git push -u origin <branch>`.
2. Open the PR, passing the body through a heredoc:

   ```bash
   gh pr create --base <base> --title "<title>" --body "$(cat <<'BODY'
   - ...
   BODY
   )"
   ```

3. If `gh` is not installed or the remote is not on GitHub, print the title and body for the user instead.

Done when: the PR is open and you have given the user its URL, or you have printed the title and body.
