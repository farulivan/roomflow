# Contributing

## Branches and pull requests

Work on a branch off `main`, named `feat/<short-name>` or `fix/<short-name>`, and open a pull request. Pull requests are squash-merged, so `main` gets one commit per pull request.

The pull request title follows the commit format below and is at most **44 characters**: GitHub appends ` (#123)` when squashing, and the result has to stay within 50. Fill in the template's sections.

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
