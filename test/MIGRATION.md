# Migrating from Enzyme to React Testing Library

This project is in the process of migrating from Enzyme to React Testing Library for component testing.

## Why migrate?

- Enzyme is no longer actively maintained and doesn't have official support for newer React versions
- React Testing Library encourages better testing practices that focus on how users interact with components
- React Testing Library is the recommended testing library by the React team

## Migration Guide

### For each test file:

1. Replace the enzyme import with our utility import:
```diff
- import { mount } from 'enzyme';
+ import { renderWithWrapper, screen } from '../test-utils';
```

2. Replace `mount` with `renderWithWrapper`:
```diff
- const wrapper = mount(<Component />);
+ const wrapper = renderWithWrapper(<Component />);
```

3. Use the wrapper's compatible API for assertions:
```javascript
// Instead of wrapper.find() in enzyme
wrapper.find('#element-id').exists();
wrapper.find('#element-id').text();
```

4. For more complex scenarios, use React Testing Library's native methods:
```javascript
// Get elements by text, role, etc.
screen.getByText('Submit');
screen.getByRole('button', { name: 'Submit' });

// Assertions
expect(screen.getByText('Hello')).toBeInTheDocument();
```

## Migration Progress

- [x] Created test utilities to ease migration
- [x] Updated Jest configuration
- [x] Migrated core.test.tsx as an example
- [ ] Migrate remaining test files

Once all test files are migrated, we can:

1. Remove the `enzyme` and any enzyme adapter packages from dependencies
2. Remove the `test-utils.js` compatibility layer
3. Update all tests to use React Testing Library's native API directly 