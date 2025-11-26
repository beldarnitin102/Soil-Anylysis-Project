// This file contains the JavaScript logic for the SoilScope application, handling user interactions, page navigation, and form submissions for login and registration.

const users = JSON.parse(localStorage.getItem('users')) || [];

// Function to show a specific page
function showPage(event, pageId) {
    event.preventDefault();
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId + 'Page').classList.remove('hidden');
}

// Function to handle user registration
function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const newUser = {
        id: users.length + 1,
        username: name,
        email: email,
        password: password
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registration successful! You can now log in.');
    showPage(event, 'login');
}

// Function to handle user login
function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        alert('Login successful! Welcome back, ' + user.username + '!');
        // Redirect to the home page or dashboard
        showPage(event, 'home');
    } else {
        alert('Invalid email or password. Please try again.');
    }
}

// Event listeners for form submissions
document.getElementById('registerPage').addEventListener('submit', registerUser);
document.getElementById('loginPage').addEventListener('submit', loginUser);