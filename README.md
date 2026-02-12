# Legend App State Utils

A comprehensive monorepo for utility and integration packages built on top of [Legend-State](https://legendapp.com/open-source/state/).

## Overview

Legend App State Utils provides a collection of well-tested, production-ready packages that extend and integrate with Legend-State. This monorepo is designed to help developers build scalable applications with powerful state management capabilities.

## Packages

### [@las/utils](./packages/utils)
Utility functions and helpers for working with Legend-State. Provides common patterns, adapters, and tools to simplify state management workflows.

**Key Features:**
- State helper functions
- Common patterns and utilities
- Type-safe utilities
- Tree-shakeable exports

### [@las/integrations](./packages/integrations)
Third-party integrations for Legend-State. Seamlessly connect your state management with popular libraries and services.

**Supported Integrations:**
- Database adapters
- API client helpers
- Middleware utilities
- Plugin system support

## Getting Started

### Prerequisites

- **Node.js:** v16.0.0 or higher
- **pnpm:** v7.0.0 or higher

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd legendapp-state-utils
```

2. Install dependencies:
```bash
pnpm install
```

### Development

#### Build all packages:
```bash
pnpm build
```

#### Development mode with watch:
```bash
pnpm dev
```

#### Run tests:
```bash
pnpm test
```

#### Lint and format code:
```bash
pnpm lint
pnpm format
```

## Project Structure

```
legendapp-state-utils/
├── packages/
│   ├── utils/              # Core utility functions
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   └── integrations/       # Third-party integrations
│       ├── src/
│       ├── tests/
│       ├── package.json
│       └── README.md
├── .github/
│   └── workflows/          # CI/CD workflows
├── .npmrc                  # npm/pnpm configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Root package configuration
├── pnpm-workspace.yaml     # pnpm workspace configuration
└── README.md              # This file
```

## Workspace Commands

The following commands are available at the root level:

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies for all packages |
| `pnpm build` | Build all packages |
| `pnpm dev` | Start development mode with watch |
| `pnpm test` | Run tests for all packages |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code in all packages |
| `pnpm clean` | Clean build artifacts and node_modules |

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork and Clone:** Create a fork of the repository and clone it locally
2. **Create a Branch:** Use a descriptive branch name (e.g., `feature/new-utility`, `fix/integration-bug`)
3. **Develop:** Make your changes and ensure tests pass
   ```bash
   pnpm test
   ```
4. **Lint and Format:** Ensure code quality
   ```bash
   pnpm lint
   pnpm format
   ```
5. **Commit:** Write clear, concise commit messages
   ```bash
   git commit -m "feat: add new utility function"
   ```
6. **Push and Create PR:** Push your branch and create a pull request with a clear description

### Code Style

- TypeScript is required for all new code
- Follow the existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Ensure type safety (strict mode enabled)

### Commit Message Format

Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for test updates
- `chore:` for build/tooling changes

## License

This project is licensed under the **MIT License** - see the LICENSE file for details.

## Support

- **Issues:** Report bugs and request features via [GitHub Issues](../../issues)
- **Discussions:** Join community discussions for questions and ideas
- **Documentation:** Refer to individual package READMEs for detailed documentation

## Related Resources

- [Legend-State Documentation](https://legendapp.com/open-source/state/)
- [Legend-State GitHub](https://github.com/LegendApp/legend-state)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

**Made with ❤️ for the Legend-State community**
