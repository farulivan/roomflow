# Contributing

## Branches and pull requests

Work on a branch off `main` named after the kind of change: `feat/`, `fix/`, `docs/`, `ci/` or `chore/`, followed by a short name. Open a pull request and fill in the template's sections.

Pull requests land as **merge commits**, so every commit on the branch stays in `main`'s history. Before asking for review, make sure each commit is clean and follows the format below: no "wip" or "fix typo" commits.

The pull request title follows the same commit format and is at most **44 characters**. It becomes the merge commit's subject with ` (#123)` appended, and the result has to stay within 50.

## Dependency updates

Dependabot opens one pull request a month for minor and patch bumps, one for each major bump, and one as soon as a security advisory affects a dependency. Shorten its title to 44 characters before merging if it runs over. Its commits keep GitHub's own message format, the one exception to the rules below.

New releases have to age before they come in. Dependabot waits a week before proposing one, and `bunfig.toml` keeps installs from taking a version less than three days old. Most malicious releases are pulled within that time. To take an urgent fix sooner, run `bun add <package> --minimum-release-age=0`.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org):

```
type(scope): summary in the imperative

Optional body: what changed and why, wrapped at 72 characters.

Refs: #12
```

- **Subject:** at most 50 characters, imperative ("add", not "added"), lowercase after the colon, no full stop.
- **Body:** optional, after a blank line, with lines of at most 72 characters. Explain why, not how.
- **Types:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`.
- **Scopes** (optional): `domain`, `mocks`, `ui`, `app`, `orders`, `dashboard`, `hotels`, `auth`, `simulator`, `deps`.
- **Breaking changes:** add `!` after the type (`feat(orders)!: …`) and a `BREAKING CHANGE:` footer.

Examples:

```
fix(orders): keep trailing space while searching
build(deps): bump vite to 8.2
docs: explain the hotel switcher
```

The repo's VS Code settings flag a subject over 50 characters or a body line over 72 while you type.

## Before pushing

Run the same checks CI runs:

```bash
bun run format:check && bun run lint && bun run spell && bun run typecheck && bun test && bun run build
```
