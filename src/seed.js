// This file seeds the database with initial user data for testing purposes.

const fs = require('fs');
const path = require('path');

// Path to the users.json file
const usersFilePath = path.join(__dirname, 'db', 'users.json');

// Sample user data
const sampleUsers = [
    {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123'
    },
    {
        id: 2,
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'securepass456'
    },
    {
        id: 3,
        username: 'alice_jones',
        email: 'alice@example.com',
        password: 'mypassword789'
    }
];

// Function to seed the database
const seedDatabase = () => {
    fs.writeFile(usersFilePath, JSON.stringify(sampleUsers, null, 2), (err) => {
        if (err) {
            console.error('Error writing to users.json:', err);
        } else {
            console.log('Database seeded successfully with sample user data.');
        }
    });
};

// Run the seed function
seedDatabase();