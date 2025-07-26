# Testing Documentation - Fantastic Task

## Overview

This document provides comprehensive information about the testing strategy, setup, and implementation for the Fantastic Task application.

## Testing Strategy

We have implemented a multi-layered testing approach to ensure code quality and reliability:

### 1. Unit Tests
- **Location**: `src/**/__tests__/*.test.jsx`
- **Purpose**: Test individual components and hooks in isolation
- **Coverage**: Components, hooks, utility functions
- **Framework**: Vitest + React Testing Library

### 2. Integration Tests
- **Location**: `src/test/integration/*.test.js`
- **Purpose**: Test interactions between components and external services
- **Coverage**: Supabase operations, API integrations
- **Framework**: Vitest with mocked services

### 3. End-to-End Tests
- **Location**: `tests/e2e/*.spec.js`
- **Purpose**: Test complete user workflows in a browser environment
- **Coverage**: Authentication flow, task management, user interactions
- **Framework**: Playwright

### 4. Regression Tests
- **Location**: `src/test/regression/*.test.jsx`
- **Purpose**: Ensure core functionality remains stable across changes
- **Coverage**: Critical user paths, accessibility, performance
- **Framework**: Vitest + React Testing Library

## Test Configuration

### Vitest Configuration
- **File**: `vitest.config.js`
- **Environment**: jsdom for browser simulation
- **Coverage**: V8 provider with 80% threshold
- **Setup**: Global test utilities and mocks

### Playwright Configuration
- **File**: `playwright.config.js`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Features**: Screenshots, videos, traces on failure
- **Base URL**: http://localhost:5173

## Running Tests

### All Tests
```bash
npm test                    # Run tests in watch mode
npm run test:run           # Run tests once
npm run test:ui            # Run tests with UI
```

### Coverage
```bash
npm run test:coverage      # Run tests with coverage report
```

### End-to-End Tests
```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Run E2E tests with UI
```

## Test Structure

### Unit Tests

#### Hooks Tests
- `useAuth.test.jsx`: Authentication logic, sign in/up/out, password reset
- `useTasks.test.jsx`: Task operations, CRUD, completion, verification
- `useFamily.test.jsx`: Family management, member operations

#### Component Tests
- `LoginPage.test.jsx`: Authentication UI, form validation, mode switching
- `TaskList.test.jsx`: Task display, completion, interaction
- `CreateTaskForm.test.jsx`: Task creation, validation, recurring types

### Integration Tests

#### Supabase Integration
- Database operations (CRUD)
- Authentication flows
- Real-time subscriptions
- Error handling
- Row Level Security

### End-to-End Tests

#### Authentication Flow
- Login page rendering
- Mode switching (signin, signup, reset, family creation)
- Form validation
- Responsive design

#### Task Management
- Task list display
- Task completion
- Date navigation
- Modal interactions

### Regression Tests

#### Core Functionality
- Authentication state management
- Task management workflows
- Responsive design
- Accessibility
- Performance considerations

## Test Utilities

### Setup Files
- `src/test/setup.js`: Global test configuration, mocks, polyfills
- `src/test/utils.jsx`: Helper functions, mock data, custom renders

### Mock Data
- Mock users, families, tasks, assignments, completions
- Consistent test data across all test files
- Helper functions for generating dynamic test data

### Custom Render Functions
- `renderWithProviders()`: Renders components with all required providers
- `createTestProps()`: Helper for creating component props
- `mockLocalStorage`: Mock localStorage implementation

## Coverage Requirements

### Target Coverage: 80%+
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Excluded from Coverage
- Configuration files
- Test files
- Node modules
- Build artifacts
- Entry point (main.jsx)

## Mock Strategy

### Environment Mocking
- Local test mode via `VITE_LOCAL_TEST_USER`
- Supabase client mocking
- Browser APIs (IntersectionObserver, ResizeObserver, matchMedia)

### Service Mocking
- Authentication operations
- Database operations
- Real-time subscriptions
- File operations

## Testing Best Practices

### Unit Tests
1. Test behavior, not implementation
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Mock external dependencies
5. Test error conditions

### Integration Tests
1. Test real interactions between components
2. Use realistic test data
3. Test edge cases and error scenarios
4. Verify side effects

### E2E Tests
1. Test critical user journeys
2. Use data attributes for reliable selectors
3. Handle loading states and async operations
4. Test across different browsers and devices

### General Guidelines
1. Keep tests simple and focused
2. Use consistent naming conventions
3. Maintain test data separately
4. Regular test maintenance and refactoring
5. Document complex test scenarios

## Continuous Integration

### Test Automation
- All tests run on every commit
- Coverage reports generated automatically
- E2E tests run on staging environment
- Performance regression tracking

### Quality Gates
- 80% minimum test coverage required
- All tests must pass before merge
- E2E tests must pass for production deploy
- Performance budgets enforced

## Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` and `act` properly
2. **Mock setup**: Ensure mocks are cleared between tests
3. **Provider setup**: Use custom render functions
4. **Test isolation**: Avoid test interdependencies

### Debugging Tools
- Vitest UI for interactive debugging
- Playwright trace viewer for E2E debugging
- React Developer Tools in tests
- Console logging in test environment

## Maintenance

### Regular Tasks
- Update test snapshots when UI changes
- Refactor tests with code changes
- Add tests for new features
- Remove obsolete tests
- Update mock data to match API changes

### Performance
- Monitor test execution time
- Parallelize test execution
- Use efficient selectors in E2E tests
- Optimize mock data generation

## Future Improvements

### Planned Enhancements
1. Visual regression testing with Percy or similar
2. Performance testing with Lighthouse CI
3. Accessibility testing automation
4. Cross-browser testing in CI
5. Load testing for critical paths

### Test Metrics
- Track test coverage trends
- Monitor test execution performance
- Measure test reliability (flakiness)
- Document test maintenance overhead

## Troubleshooting

### Common Test Failures

#### Mock-related Issues
```javascript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
```

#### Async State Updates
```javascript
// Wrap state updates in act()
await act(async () => {
  await updateState()
})
```

#### Provider Missing
```javascript
// Use custom render function
renderWithProviders(<Component />, {
  initialUser: mockUser,
  initialFamily: mockFamily
})
```

### Getting Help
1. Check test output for specific error messages
2. Review test setup and configuration
3. Verify mock implementations
4. Check for missing dependencies or providers
5. Consult testing framework documentation

---

## Summary

The Fantastic Task application has a comprehensive testing strategy covering unit, integration, end-to-end, and regression testing. With proper setup and consistent implementation, we aim to maintain high code quality and user experience reliability.

For questions or issues with testing, please refer to this documentation or reach out to the development team.