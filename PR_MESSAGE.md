# Improve CI Workflow

This PR enhances the CI/CD workflow by implementing the following improvements:

## Changes

1. **Format Checking**:
   - Added a `format:check` script to the root package.json to verify code formatting
   - Added a dedicated GitHub workflow job to check formatting as part of the CI process

2. **Type Checking**:
   - Added explicit `typecheck` scripts to packages that were missing it
   - Added a dedicated GitHub workflow job to verify TypeScript typings

3. **Integration Tests**:
   - Created dedicated integration test directories in each relevant package
   - Added `test:integration` scripts to each package
   - Updated the CI workflow to use the dedicated integration test command
   - Added sample integration tests to ensure the test structure works

## Benefits

- **Better Quality Assurance**: By adding formatting checks and explicit type checking, we improve code quality verification
- **Clearer Test Separation**: By separating unit tests from integration tests, we make the CI process more explicit and maintainable
- **More Robust CI Pipeline**: These changes make our CI pipeline more comprehensive without significantly increasing build times

## Testing

All tests are passing in the local environment. The changes have been tested to ensure integration tests can be run separately from unit tests.
