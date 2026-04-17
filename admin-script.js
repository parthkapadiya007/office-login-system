// ================= ADMIN LOGIN =================
function adminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;
    const loginBtn = document.getElementById("login-btn");
    const errorMessage = document.getElementById("error-message");
    
    // Default admin credentials (in production, these should be from server)
    const validUsername = "admin";
    const validPassword = "admin";
    
    // Disable button during login attempt
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    
    // Simulate server validation
    setTimeout(() => {
        if (username === validUsername && password === validPassword) {
            // Store admin session
            localStorage.setItem("adminAuth", "true");
            localStorage.setItem("adminUsername", username);
            
            // Redirect to dashboard
            window.location.href = "admin-dashboard.html";
        } else {
            // Show error
            errorMessage.textContent = "Invalid admin credentials";
            errorMessage.style.display = "block";
            
            // Reset button
            loginBtn.disabled = false;
            loginBtn.textContent = "Login to Admin Panel";
            
            // Hide error after 3 seconds
            setTimeout(() => {
                errorMessage.style.display = "none";
            }, 3000);
        }
    }, 1000);
}

// ================= ADMIN LOGOUT =================
function adminLogout() {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminUsername");
    window.location.href = "admin.html";
}

// ================= CHECK ADMIN AUTH =================
function checkAdminAuth() {
    const adminAuth = localStorage.getItem("adminAuth");
    if (!adminAuth || adminAuth !== "true") {
        window.location.href = "admin.html";
        return false;
    }
    return true;
}

// ================= SHOW NOTIFICATION =================
function showNotification(message, type = 'success') {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ================= CREATE USER =================
async function createUser(event) {
    event.preventDefault();
    
    const username = document.getElementById("new-username").value;
    const password = document.getElementById("new-password").value;
    const fullname = document.getElementById("new-fullname").value;
    
    try {
        // Send to backend
        const response = await fetch("http://localhost:5000/admin/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password,
                fullname: fullname || username
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification("User created successfully!", "success");
            
            // Reset form
            document.getElementById("new-username").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("new-fullname").value = "";
            
            // Refresh users list
            loadUsers();
            updateStats();
        } else {
            showNotification(result.message || "Error creating user", "error");
        }
    } catch (error) {
        console.error("Error creating user:", error);
        showNotification("Connection error. Please try again.", "error");
    }
}

// ================= LOAD USERS =================
async function loadUsers() {
    try {
        const response = await fetch("http://localhost:5000/admin/users");
        const result = await response.json();
        
        if (response.ok) {
            displayUsers(result.users);
        } else {
            showNotification("Error loading users", "error");
        }
    } catch (error) {
        console.error("Error loading users:", error);
        document.getElementById("users-list").innerHTML = "<p>Error loading users</p>";
    }
}

// ================= DISPLAY USERS =================
function displayUsers(users) {
    const usersList = document.getElementById("users-list");
    
    if (users.length === 0) {
        usersList.innerHTML = "<p>No users found</p>";
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">${user.username}</div>
                <div class="user-date">Created: ${new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="user-actions">
                <button class="btn btn-danger" onclick="deleteUser('${user.username}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// ================= DELETE USER =================
async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/admin/users/${username}`, {
            method: "DELETE"
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification("User deleted successfully!", "success");
            loadUsers();
            updateStats();
        } else {
            showNotification(result.message || "Error deleting user", "error");
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        showNotification("Connection error. Please try again.", "error");
    }
}

// ================= UPDATE STATS =================
async function updateStats() {
    try {
        // Get total users
        const usersResponse = await fetch("http://localhost:5000/admin/users");
        const usersResult = await usersResponse.json();
        
        if (usersResponse.ok) {
            document.getElementById("total-users").textContent = usersResult.users.length;
        }
        
        // Get today's attendance
        const attendanceResponse = await fetch("http://localhost:5000/attendance/today");
        const attendanceResult = await attendanceResponse.json();
        
        if (attendanceResponse.ok) {
            const records = attendanceResult.records || [];
            document.getElementById("today-attendance").textContent = records.length;
            
            // Count unique users who marked attendance today
            const uniqueUsers = new Set(records.map(r => r.name));
            document.getElementById("active-users").textContent = uniqueUsers.size;
        }
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

// ================= DASHBOARD INITIALIZATION =================
function initDashboard() {
    if (!checkAdminAuth()) {
        return;
    }
    
    const adminUsername = localStorage.getItem("adminUsername");
    document.getElementById("admin-welcome").textContent = `Welcome, ${adminUsername}`;
    
    loadUsers();
    updateStats();
    
    // Update stats every 30 seconds
    setInterval(updateStats, 30000);
}

// ================= PAGE LOAD HANDLERS =================
if (window.location.pathname.includes("admin-dashboard.html")) {
    initDashboard();
}

if (window.location.pathname.includes("admin.html")) {
    // Clear any existing admin session on login page
    if (localStorage.getItem("adminAuth")) {
        localStorage.removeItem("adminAuth");
        localStorage.removeItem("adminUsername");
    }
}
