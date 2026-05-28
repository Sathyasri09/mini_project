const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    const urls = [
        process.env.DB_URL,
        'mongodb://127.0.0.1:27017/mptex'
    ];

    for (const url of urls) {
        console.log(`Testing connection to: ${url}`);
        try {
            await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 });
            console.log(`SUCCESS: Connected to ${url}`);
            await mongoose.disconnect();
            process.exit(0);
        } catch (err) {
            console.log(`FAILED: Could not connect to ${url}. Error: ${err.message}`);
        }
    }
    process.exit(1);
}

test();
