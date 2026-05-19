# Contributing to HireIQ

First off, thank you for considering contributing to HireIQ! It's people like you that make HireIQ such a great platform for recruiting.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please be respectful and professional in your interactions.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for HireIQ. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for HireIQ, including completely new features and minor improvements to existing functionality.

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Describe the current behavior and explain which behavior you expected to see instead and why.

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the coding style of the project
* Include tests if applicable

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/HireIQ.git
   cd HireIQ/hireiq-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Start the AI Backend:**
   ```bash
   cd ../python-backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

## Commit Message Guidelines

We follow the Conventional Commits specification. This leads to more readable messages that are easy to follow when looking through the project history.

* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Changes to the build process or auxiliary tools and libraries

Example: `feat(candidates): add bulk status update feature`

Thank you for contributing!
