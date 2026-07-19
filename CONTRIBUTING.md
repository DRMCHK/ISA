# Contributing to ISA Link

Thank you for interest in contributing! This document provides guidelines for reporting issues, submitting PRs, and improving the platform.

---

## Code of Conduct

Be respectful, inclusive, and professional. We're building a platform for international students to connect.

---

## Getting Started

### Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/ISA.git
cd ISA
git remote add upstream https://github.com/DRMCHK/ISA.git
```

### Install & Setup

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with test values
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git fetch upstream
git checkout -b feature/amazing-feature upstream/main
```

### 2. Make Changes

- Keep commits focused on one feature
- Write clear commit messages
- Test your changes locally

### 3. Type Check & Lint

```bash
npm run type-check
npm run lint
```

### 4. Test Locally

```bash
npm run build
npm start
```

### 5. Push & Create PR

```bash
git push origin feature/amazing-feature
# Go to GitHub and create a Pull Request
```

---

## Commit Message Guidelines

Format: `<type>: <subject>`

**Types:**
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `style:` — formatting (no code change)
- `refactor:` — code restructuring (no behavior change)
- `perf:` — performance improvement
- `test:` — test changes
- `chore:` — dependency updates, etc

**Examples:**
```
feat: add group invite links
fix: prevent duplicate friend requests
docs: update deployment guide
refactor: extract ChatWindow to separate component
```

---

## PR Checklist

Before submitting:

- [ ] Branch is up-to-date with `upstream/main`
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] Code follows project style
- [ ] Changes tested locally
- [ ] Database migrations included (if needed)
- [ ] Documentation updated (if needed)
- [ ] No sensitive data in commits

---

## Areas for Contribution

### Bug Fixes
- Check [Issues](https://github.com/DRMCHK/ISA/issues) for `bug` label
- Comment to claim the issue
- Follow the development workflow

### Features
- Check [Issues](https://github.com/DRMCHK/ISA/issues) for `enhancement` label
- Discuss in issue before starting work
- Follow the development workflow

### Documentation
- Improve README, guides, comments
- Fix typos or unclear explanations
- Add architecture documentation

### Tests
- We need unit tests!
- Add tests for bug fixes
- Test critical paths

### Performance
- Identify bottlenecks (use Chrome DevTools)
- Optimize database queries
- Reduce bundle size

---

## Code Style

### TypeScript

- Use strict mode (`"strict": true` in `tsconfig.json`)
- Export types with `type` keyword
- Avoid `any` — use proper types

```typescript
// Good
interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

// Avoid
const user: any = {};
```

### React Components

- Use functional components + hooks
- Keep components small & focused
- Use descriptive component names

```typescript
// Good
function PostCard({ post }: { post: Post }) {
  return <div>{post.content}</div>;
}

// Avoid
function PC(p: any) {
  return <div>{p.c}</div>;
}
```

### CSS

- Use Tailwind CSS utilities
- Avoid inline styles
- Add custom CSS only when necessary

```tsx
// Good
<div className="bg-blue-500 p-4 rounded-lg">

// Avoid
<div style={{ backgroundColor: 'blue', padding: 16 }}>
```

---

## Database Migrations

If your change requires schema changes:

1. Update `prisma/schema.prisma`
2. Run migration:
   ```bash
   npm run db:migrate
   ```
3. Commit both `schema.prisma` and migration files
4. Document breaking changes in PR

---

## Security

Found a security issue? **Do not open a public issue.**

Instead, report privately:
- Go to [Security](https://github.com/DRMCHK/ISA/security) tab
- Click "Report a vulnerability"
- Include steps to reproduce

---

## Testing

### Manual Testing

1. Create test account
2. Test your changes end-to-end
3. Check both light & dark modes
4. Test on mobile (if UI change)

### Automated Tests (Future)

We're setting up Jest + React Testing Library. Help wanted!

```bash
# Run tests (when available)
npm run test
```

---

## Documentation

### Update README if:
- New feature added
- Setup process changed
- Dependencies added/removed

### Update inline comments if:
- Logic is complex
- Non-obvious decisions made
- Future maintainers would benefit

### Good comment example:
```typescript
// We use NaCl box cipher instead of symmetric because
// each user needs different encryption keys for their DMs
const encrypted = nacl.box(message, publicKey, secretKey);
```

---

## Review Process

### What Reviewers Look For

1. **Code Quality** — clean, readable, maintainable
2. **Security** — no XSS, SQL injection, or sensitive data exposure
3. **Performance** — no N+1 queries, unnecessary renders
4. **Tests** — adequate coverage
5. **Documentation** — changes clearly explained

### Responding to Feedback

- Don't take criticism personally
- Ask for clarification if feedback is unclear
- Make requested changes promptly
- Re-request review after updates

---

## Architecture Decisions

### When to Ask First

- Major refactoring
- New dependencies (check `package.json` for alternatives)
- Database schema changes
- API design changes

**Open an issue to discuss** before investing time.

---

## Performance Tips

### Frontend
- Use React DevTools Profiler
- Avoid re-renders with `useMemo`, `useCallback`
- Code-split large components
- Lazy-load images

### Backend
- Use Prisma's `select()` to fetch only needed fields
- Batch database queries when possible
- Cache frequently accessed data
- Monitor N+1 queries

### Database
- Add indexes for frequently queried fields
- Use connection pooling
- Monitor slow queries

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Questions?

- 💬 [GitHub Discussions](https://github.com/DRMCHK/ISA/discussions)
- 🐛 [GitHub Issues](https://github.com/DRMCHK/ISA/issues)

---

**Thank you for contributing to ISA Link! 🎉**
