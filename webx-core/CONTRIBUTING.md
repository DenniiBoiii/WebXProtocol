# Contributing to WebX Core

Thank you for your interest in contributing to WebX Protocol! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/webx-core.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

```bash
# Start development mode (watches for changes)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Code Style

- Use TypeScript for all code
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update version in package.json following [SemVer](https://semver.org/)
5. Submit your pull request

## Content Block Types

When adding new content block types:

1. Add the type to `CONTENT_BLOCK_TYPES` array
2. Update the `ContentBlockSchema` if needed
3. Add a helper to the `block` object
4. Document in README.md

## Compression Improvements

WebX aims for maximum compression. When proposing compression changes:

1. Benchmark before/after with real-world blueprints
2. Ensure backwards compatibility with existing encoded strings
3. Document the compression ratio improvement

## Questions?

Open an issue or reach out at [webxnexus.com](https://webxnexus.com).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
