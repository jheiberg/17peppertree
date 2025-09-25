# Test Coverage Improvement TODO List

## Overview
Current test coverage analysis shows good coverage for core user functionality (Contact, AvailabilityCalendar) but significant gaps in authentication, admin features, and some infrastructure components.

## High Priority Tasks

### 1. Fix Failing Tests
- [ ] **Hero Component Tests** - Fix CSS class mismatches
  - Update `.hero` class expectations to match actual Tailwind classes
  - Fix `.stars-large .fas.fa-star` selectors
  - Update `.cta-button` to `.btn-primary`
  - Fix `.hero-overlay` and `.scroll-indicator` selectors

- [ ] **Footer Component Tests** - Fix CSS class expectations
  - Update `.footer` class expectations to match Tailwind classes
  - Fix `.footer-section` selectors
  - Update container class expectations

- [ ] **Header Component Tests** - Fix mobile menu selectors
  - Update `.hamburger` and `.bar` class selectors
  - Fix responsive navigation tests

### 2. Authentication Coverage (Currently 19.28% coverage)
- [ ] **AuthContext.js** - Add comprehensive tests
  - Test Keycloak initialization
  - Test login/logout flows
  - Test token refresh functionality
  - Test user state management
  - Test error handling for auth failures
  - Mock Keycloak adapter properly

- [ ] **Auth Components** (Currently 0% coverage)
  - [ ] **AuthCallback.js** - Test auth callback handling
  - [ ] **LoginPage.js** - Test login page rendering and interactions
  - [ ] **ProtectedRoute.js** - Test route protection logic
  - [ ] **UserProfile.js** - Test user profile display

### 3. Admin Features Coverage (Currently 0% coverage)
- [ ] **AdminDashboard.js** - Test dashboard rendering and data fetching
- [ ] **BookingDetails.js** - Test booking detail view and actions
- [ ] **BookingList.js** - Test booking list rendering and filtering
- [ ] **DashboardStats.js** - Test statistics calculations and display

## Medium Priority Tasks

### 4. API Services Coverage (Currently 0% coverage)
- [ ] **apiService.js** - Add comprehensive API tests
  - Test all CRUD operations for bookings
  - Test error handling and retry logic
  - Test authentication headers
  - Mock fetch responses properly
  - Test timeout handling

### 5. Improve Branch Coverage
- [ ] **Header.js** - Improve from 57.14% to 80%+
  - Test mobile menu toggle scenarios
  - Test different viewport responsive behaviors
  - Test navigation state changes

- [ ] **Contact.js** - Improve from 92.3% to 95%+
  - Test edge cases in date validation
  - Test form submission error scenarios
  - Cover unused `formatDateForInput` function (lines 121-124)

- [ ] **AvailabilityCalendar.js** - Improve from 83.72% to 90%+
  - Test month navigation edge cases
  - Test date selection with various unavailable date scenarios
  - Cover uncovered lines (52, 101-105, 166-168, 217)

## Low Priority Tasks

### 6. Test Infrastructure Improvements
- [ ] **Update Testing Libraries**
  - Replace deprecated `ReactDOMTestUtils.act` with `React.act`
  - Update test patterns to modern React Testing Library practices
  - Add proper act() wrapping for async state updates

- [ ] **Add Integration Tests**
  - Test complete booking flow end-to-end
  - Test admin workflow scenarios
  - Test authentication integration with components

- [ ] **Performance and Error Boundary Tests**
  - Add tests for error boundaries
  - Test loading states and performance scenarios
  - Add accessibility testing

## Target Coverage Goals

| Component | Current Coverage | Target Coverage |
|-----------|------------------|-----------------|
| AuthContext.js | 19.28% | 85%+ |
| Admin Components | 0% | 80%+ |
| apiService.js | 0% | 85%+ |
| Header.js | 57.14% branches | 80%+ |
| Contact.js | 92.3% branches | 95%+ |
| AvailabilityCalendar.js | 83.72% branches | 90%+ |

## Implementation Notes

### Testing Strategy
1. **Start with failing tests** - Fix existing test failures first
2. **Focus on critical paths** - Authentication and booking flows
3. **Use proper mocking** - Mock external services (Keycloak, API calls)
4. **Test user scenarios** - Focus on real user workflows

### Mock Setup Requirements
```javascript
// Required mocks for implementation
- Keycloak adapter mock
- fetch/API response mocks
- localStorage/sessionStorage mocks
- Date mocks for consistent testing
- File upload mocks (if applicable)
```

### Success Criteria
- [ ] All tests passing
- [ ] Overall coverage above 80%
- [ ] No critical functionality untested
- [ ] Authentication flows fully covered
- [ ] Admin features adequately tested

---

**Priority Order for Execution:**
1. Fix failing tests (immediate)
2. Add AuthContext tests (critical for security)
3. Add Admin component tests (business critical)
4. Add API service tests (infrastructure critical)
5. Improve branch coverage (optimization)
6. Test infrastructure improvements (maintenance)