const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📗 Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@sustainablelife.com' },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('🔑 Admin user already exists!');
      console.log('Admin Details:');
      console.log(`- Email: ${existingAdmin.email}`);
      console.log(`- Username: ${existingAdmin.username}`);
      console.log(`- Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin_sustainable',
      email: 'admin@sustainablelife.com',
      password: 'Admin123!',
      fullName: 'Sustainable Life Admin',
      role: 'admin',
      location: {
        city: 'Green City',
        country: 'EcoLand'
      }
    });

    await adminUser.save();

    console.log('🎉 Admin user created successfully!');
    console.log('Admin Login Credentials:');
    console.log('- Email: admin@sustainablelife.com');
    console.log('- Password: Admin123!');
    console.log('- Role: admin');
    console.log('- Username: admin_sustainable');

    // Create a regular test user as well
    const testUser = new User({
      username: 'test_user',
      email: 'user@test.com',
      password: 'User123!',
      fullName: 'Test Regular User',
      role: 'user',
      location: {
        city: 'Test City',
        country: 'TestLand'
      }
    });

    await testUser.save();

    console.log('\n🎯 Regular test user also created:');
    console.log('- Email: user@test.com');
    console.log('- Password: User123!');
    console.log('- Role: user');
    console.log('- Username: test_user');

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the seed function
createAdminUser();