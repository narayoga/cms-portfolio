/**
 * The users that are created in the test database before the integration tests run.
 * These accounts only exist in the test database.
 */
export const TEST_USERS = {
  admin: {
    name: 'Test Admin',
    email: 'admin@test.local',
    password: 'Admin-Test-Password-1',
    role: 'admin',
  },
  editor: {
    name: 'Test Editor',
    email: 'editor@test.local',
    password: 'Editor-Test-Password-1',
    role: 'editor',
  },
};

export type TestUserRole = keyof typeof TEST_USERS;
