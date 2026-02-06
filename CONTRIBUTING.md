# Contributing to Secure Share Hub

Thank you for your interest in contributing to Secure Share Hub! This document provides guidelines and instructions for contributing.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB 5 or higher
- Git
- npm or yarn

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/YOUR_USERNAME/secure-share-hub.git
   cd secure-share-hub
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure Environment**
   ```bash
   # Create frontend .env
   cp .env.example .env
   
   # Create backend .env
   cp server/.env.example server/.env
   ```

4. **Start Development Servers**
   ```bash
   # Run both frontend and backend
   npm run dev:full
   
   # Or run separately
   npm run dev          # Frontend only
   npm run dev:server   # Backend only
   ```

5. **Seed Database**
   ```bash
   cd server
   npm run seed
   ```

## Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Adding tests
- `chore/description` - Maintenance tasks

Example: `feature/add-dark-mode` or `fix/file-upload-error`

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add password reset functionality
fix(upload): resolve file validation error
docs: update API documentation
test(auth): add lockout mechanism tests
```

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Avoid `any` type unless absolutely necessary
- Use ES6+ features (arrow functions, destructuring, etc.)

### React/Frontend
- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Follow component file structure:
  ```tsx
  // Imports
  import React from 'react';
  
  // Types/Interfaces
  interface Props {
    // ...
  }
  
  // Component
  export const MyComponent: React.FC<Props> = ({ prop }) => {
    // Hooks
    // Handlers
    // Render
    return ();
  };
  ```

### Backend/Node.js
- Follow MVC pattern
- Use async/await instead of callbacks
- Handle errors properly
- Add input validation
- Write descriptive error messages
- Use proper HTTP status codes

### Code Formatting
- Run linter before committing:
  ```bash
  npm run lint
  ```
- Fix auto-fixable issues:
  ```bash
  npm run lint -- --fix
  ```

## Testing

### Writing Tests

**Frontend Tests (Vitest)**
```bash
# Run tests
npm test

# Run with watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

**Backend Tests (Jest)**
```bash
cd server

# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage
- Aim for at least 80% code coverage
- All new features must include tests
- Fix any failing tests before submitting PR

### Test Guidelines
- Write clear, descriptive test names
- Test edge cases and error scenarios
- Keep tests isolated and independent
- Mock external dependencies
- Use descriptive assertions

## Pull Request Process

### Before Submitting
1. **Update from main**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run Tests**
   ```bash
   npm test
   cd server && npm test
   ```

3. **Run Linter**
   ```bash
   npm run lint
   ```

4. **Build**
   ```bash
   npm run build:full
   ```

### Submitting PR
1. Push your branch to your fork
2. Create Pull Request on GitHub
3. Fill out PR template completely
4. Link related issues
5. Wait for review

### PR Title Format
Use the same format as commit messages:
```
feat(auth): add password reset functionality
```

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
```

### Review Process
- Maintainers will review your PR
- Address any requested changes
- Once approved, PR will be merged
- Delete your branch after merge

## Reporting Bugs

### Before Reporting
1. Check existing issues
2. Verify bug on latest version
3. Gather relevant information

### Bug Report Template
```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 18.0.0]

**Additional Context**
Any other relevant information
```

## Suggesting Features

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Proposed Solution**
Describe your proposed solution

**Alternatives Considered**
Other approaches you've considered

**Additional Context**
Any other relevant information

**Implementation Idea** (optional)
If you have implementation ideas
```

## Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security issues to maintainers privately
2. Include details and steps to reproduce
3. Wait for acknowledgment before public disclosure

## Documentation

### Documentation Guidelines
- Update relevant documentation with code changes
- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep README.md up to date

### Documentation Structure
```
docs/
├── api/              # API documentation
├── guides/           # How-to guides
├── architecture/     # Architecture docs
└── deployment/       # Deployment guides
```

## Project Structure

```
secure-share-hub/
├── .github/          # GitHub Actions workflows
├── docker/           # Docker configurations
├── e2e/              # E2E tests
├── public/           # Static assets
├── server/           # Backend application
│   ├── src/
│   │   ├── __tests__/    # Backend tests
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Utility functions
│   │   └── index.ts      # Entry point
│   └── package.json
├── src/              # Frontend application
│   ├── components/   # React components
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilities
│   ├── pages/        # Page components
│   ├── services/     # API services
│   └── test/         # Frontend tests
└── package.json
```

## Getting Help

- **Discord**: [Join our Discord server]
- **GitHub Discussions**: For questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: contact@secure-share-hub.com

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Annual contributor highlights

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Secure Share Hub! 🎉
