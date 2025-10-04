// Simple test script to verify the setup
const mongoose = require('mongoose');

// Test MongoDB connection
async function testConnection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/idcs_cricket_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ MongoDB connection test successful!');

        // Test basic operations
        const testSchema = new mongoose.Schema({
            name: String,
            testDate: { type: Date, default: Date.now }
        });

        const TestModel = mongoose.model('Test', testSchema);

        // Create a test document
        const testDoc = new TestModel({ name: 'Test Connection' });
        await testDoc.save();

        console.log('✅ Database write test successful!');

        // Read the test document
        const foundDoc = await TestModel.findOne({ name: 'Test Connection' });
        console.log('✅ Database read test successful!', foundDoc.name);

        // Clean up
        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('✅ Database delete test successful!');

        await mongoose.connection.close();
        console.log('✅ All tests passed! Your setup is ready.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n📝 Setup checklist:');
        console.log('1. Make sure MongoDB is installed and running');
        console.log('2. Run: npm install');
        console.log('3. Create .env file from .env.example');
        console.log('4. Start MongoDB service');
        console.log('5. Run: npm start');
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testConnection();
}

module.exports = { testConnection };