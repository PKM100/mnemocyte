# FOXP2 Scripts

This directory contains utility scripts for the FOXP2 Smart NPCs application.

## Scripts Overview

### test-api.js
Comprehensive API testing script that validates all endpoints in the FOXP2 application.

**Features:**
- Tests all character-related endpoints (GET, POST, PUT, DELETE)
- Tests room creation and management
- Tests chat functionality
- Automatic test data cleanup
- Colored terminal output with detailed results

**Test Modes:**

#### Read-Only Mode (Default)
```bash
node scripts/test-api.js
```
- **Safe for production:** No persistent test data is created
- Uses mock data for testing
- Tests API structure and response formats
- Prevents test data accumulation in database
- Recommended for regular development testing

#### Write Mode
```bash
TEST_MODE=write node scripts/test-api.js
```
- **Use with caution:** Creates actual test data in database
- Performs full integration testing with real data
- Automatically cleans up created test data after tests
- Use only when full integration testing is needed

**Environment Variables:**
- `TEST_MODE`: Set to `write` to enable data creation mode (default: `read-only`)

### cleanup-test-data.js
Database cleanup utility that removes all test data from the database.

**Usage:**
```bash
node scripts/cleanup-test-data.js
```

**What it cleans:**
- Test characters (names containing "Test", roles like "API Tester")
- Test rooms and room-related data
- Test conversations and messages
- Test sessions and character memories
- All related foreign key dependent data

**Safety:**
- Only removes data that matches test patterns
- Preserves all production/user data
- Shows detailed cleanup report

### seed-meta-config.js
Seeds the database with default configuration data required for the application.

**Usage:**
```bash
node scripts/seed-meta-config.js
```

## Best Practices

1. **Use read-only mode by default** for regular development testing
2. **Use write mode sparingly** and only when full integration testing is required
3. **Always run cleanup scripts** if you suspect test data accumulation
4. **Check database state** periodically with the cleanup script to ensure it remains clean

## Safety Measures

- **Default read-only mode** prevents accidental test data creation
- **Automatic cleanup** in write mode removes test data after tests
- **Pattern-based cleanup** ensures only test data is removed
- **Clear mode indicators** show which mode is active

## Troubleshooting

If you notice test data accumulating in your database:

1. Run the cleanup script: `node scripts/cleanup-test-data.js`
2. Check if you accidentally ran tests in write mode without cleanup
3. Ensure you're using read-only mode for regular testing

For questions or issues, check the application logs or contact the development team.