# Multi-Agent SDLC Framework - Global Project Memory

## Project Overview
Claude Code compatible multi-agent software development lifecycle framework with specialized agents for requirements analysis, architecture design, implementation, testing, security auditing, documentation, deployment, and project coordination.

## Common Commands
- `claude`: Start interactive Claude Code session
- `claude -p "query"`: Run single query and exit
- `cd <agent-directory> && claude`: Launch agent-specific session
- `/init`: Initialize CLAUDE.md files in current directory
- `/memory`: View loaded memory files
- `/help`: Show available commands

## Global Development Standards
- Use TypeScript for all new JavaScript code
- Follow semantic versioning for releases
- Write comprehensive tests with >85% coverage
- Document all public APIs and interfaces
- Implement proper error handling and logging
- Follow security best practices (OWASP guidelines)
- Use meaningful commit messages and branch names

## Agent Coordination Rules
- All agents must reference this global memory for consistency
- Architecture decisions require SystemArchitect approval
- Security changes must pass SecurityAuditor review
- Code changes need corresponding tests and documentation
- Quality gates must be passed before moving to next phase
- Human escalation for confidence scores <0.7 or conflicts

## Quality Gates
- Code coverage minimum: 85%
- Security scan: Zero high/critical vulnerabilities
- API response time: <200ms for 95th percentile
- Documentation completeness: >90%
- Accessibility: WCAG 2.1 AA compliance for UI components

## Tool Integration
- Version Control: Git with conventional commits
- Testing: Jest/Pytest with automated CI/CD
- Security: OWASP ZAP, Snyk, npm audit
- Documentation: OpenAPI/Swagger for APIs
- Monitoring: Application performance monitoring required

## Emergency Contacts
- Tech Lead: For architectural decisions
- Security Officer: For security vulnerabilities
- DevOps: For deployment and infrastructure issues
- Product Owner: For requirement clarifications