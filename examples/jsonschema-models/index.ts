import { User } from './src/models';

// Example usage of generated User model
function demonstrateUserModel() {
  console.log('=== JSON Schema Models Example ===\n');

  // Create a new user instance
  const user = new User({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30,
    isActive: true,
    roles: ['user', 'moderator'],
    profile: {
      bio: 'Software developer with a passion for TypeScript',
      website: 'https://johndoe.dev',
      avatar: 'https://example.com/avatar.jpg',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('Created user:', user);
  console.log('User name:', user.name);
  console.log('User email:', user.email);
  console.log('User roles:', user.roles);
  
  // Demonstrate marshalling
  console.log('\n--- Marshalling ---');
  const jsonString = user.marshal();
  console.log('Marshalled to JSON:', jsonString);

  // Demonstrate unmarshalling
  console.log('\n--- Unmarshalling ---');
  const unmarshalledUser = User.unmarshal(jsonString);
  console.log('Unmarshalled user:', unmarshalledUser);
  console.log('Names match:', user.name === unmarshalledUser.name);

  // Create a minimal user (only required fields)
  console.log('\n--- Minimal User ---');
  const minimalUser = new User({
    id: '987fcdeb-51a2-43d1-9f12-123456789abc',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    createdAt: new Date().toISOString()
  });

  console.log('Minimal user:', minimalUser);
  console.log('Default active status:', minimalUser.isActive); // Should be undefined since not provided
  console.log('Roles:', minimalUser.roles); // Should be undefined since not provided

  console.log('\n=== Example completed ===');
}

// Run the demonstration
demonstrateUserModel();
