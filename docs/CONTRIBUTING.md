# Contributing

## Code style
- TypeScript, explicit props
- Keep components small and focused
- Use Tailwind utilities for layout/spacing
- Prefer semantic HTML and accessible attributes

## Lint & build
```bash
npm run lint
npm run build
npm run preview
```

## Git workflow
- Create a feature branch from `main`
- Keep PRs small and focused; include a short description
- Add/update docs if you introduce new agent types or routes

## Adding an agent UI
- Extend `src/pages/ChatPage.tsx` switch to render your new page for your agent id
- Keep agent-specific logic in a dedicated page/component
- Document any new response contract under `docs/AGENTS.md`
