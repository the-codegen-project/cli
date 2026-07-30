import { User } from './src/models/User';
import { Profile } from './src/models/Profile';
import { ProfilePreferences } from './src/models/ProfilePreferences';
import { ProfilePreferencesTheme } from './src/models/ProfilePreferencesTheme';
import { RolesItem } from './src/models/RolesItem';

// Example usage of generated User model
function demonstrateUserModel() {
  console.log('=== JSON Schema Models Example ===\n');

  // Create a new user instance. The generated models are classes, so nested
  // objects and enums are constructed with their own generated types.
  const user = new User({
    id: '123e4567-e89b-12d3-a456-426614174000',
    reservedName: 'John Doe',
    email: 'john.doe@example.com',
    age: 30,
    isActive: true,
    roles: [RolesItem.USER, RolesItem.MODERATOR],
    profile: new Profile({
      bio: 'Software developer with a passion for TypeScript',
      website: 'https://johndoe.dev',
      avatar: 'https://example.com/avatar.jpg',
      preferences: new ProfilePreferences({
        theme: ProfilePreferencesTheme.DARK,
        notifications: true
      })
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Created user:', user);
  console.log('User name:', user.reservedName);
  console.log('User email:', user.email);
  console.log('User roles:', user.roles);

  // Create a minimal user (only required fields)
  console.log('\n--- Minimal User ---');
  const minimalUser = new User({
    id: '987fcdeb-51a2-43d1-9f12-123456789abc',
    reservedName: 'Jane Smith',
    email: 'jane.smith@example.com',
    createdAt: new Date()
  });

  console.log('Minimal user:', minimalUser);
  console.log('Default active status:', minimalUser.isActive); // Should be undefined since not provided
  console.log('Roles:', minimalUser.roles); // Should be undefined since not provided

  console.log('\n=== Example completed ===');
}

// Run the demonstration
demonstrateUserModel();
