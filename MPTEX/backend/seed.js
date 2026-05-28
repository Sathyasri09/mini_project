const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Products = require('./src/products/products.model');
const User = require('./src/users/user.model');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected for seeding...');

        // Clear existing products and users (Optional: only clearing admin for safety)
        await Products.deleteMany({});
        console.log('Cleared existing products');
        
        // Create Admin User
        const adminEmail = 'admin@gmail.com';
        const adminData = {
            username: 'admin',
            email: adminEmail,
            password: 'admin1234',
            role: 'admin'
        };

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            await User.deleteOne({ email: adminEmail });
            console.log('Cleared existing admin user');
        }
        const adminUser = new User(adminData);
        await adminUser.save();
        console.log('Admin user created successfully!');

        // Load data from frontend
        const dataPath = path.join(__dirname, '../frontend/src/data/products.json');
        const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        // Assign the newly created admin user ID as author
        const adminId = adminUser._id;

        const formattedProducts = products.map(p => {
            const { _id, ...rest } = p;
            return {
                ...rest,
                author: adminId
            };
        });

        await Products.insertMany(formattedProducts);
        console.log('Successfully seeded products!');
        
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
