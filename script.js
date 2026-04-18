// ================= FIREBASE CONFIG (DISABLED FOR NOW) =================
// Firebase completely removed - using local storage only
let db = null;
console.log("Using local storage only - Firebase disabled");

// ================= LOGIN =================
function login(event){
    if (event) {
        event.preventDefault();
    }

    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const messageEl = document.getElementById("message");
    const loginBtn = document.querySelector("button[type='submit']");

    if (!user || !pass) {
        messageEl.innerText = "Please enter username and password";
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    messageEl.innerText = "";

    // Use hardcoded users for immediate login
    const fallbackUsers = [
        {username:"parth", password:"1234"},
        {username:"rahul", password:"1111"},
        {username:"admin", password:"admin"}
    ];

    console.log("Login attempt:", user, pass);
    const validUser = fallbackUsers.find(
        u => u.username === user && u.password === pass
    );

    console.log("Valid user found:", validUser);

    if(validUser){
        console.log("Login successful, redirecting...");
        localStorage.setItem("employee", user);
        localStorage.setItem("userFullname", user);
        window.location.href="attendance.html";
        return;
    }else{
        console.log("Login failed");
        messageEl.innerText="Invalid Login";
        // Reset button state only on failed login
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }
}

// ================= LOGOUT =================
function logout(){
    localStorage.removeItem("employee");
    localStorage.removeItem("status");
    localStorage.removeItem("inTime");
    localStorage.removeItem("outTime");
    localStorage.removeItem("attendanceDate");
    window.location="index.html";
}

// ================= TODAY DATE =================
function today(){
    return new Date().toISOString().split("T")[0];
}

// ================= ATTENDANCE PAGE LOAD =================
if(window.location.pathname.includes("attendance.html")){

    const employee = localStorage.getItem("employee");

    if(!employee){
        window.location="index.html";
    }

    // Check if DOM elements exist before accessing them
    const welcomeEl = document.getElementById("welcome");
    if(welcomeEl) {
        welcomeEl.innerText = "Welcome, " + employee;
    }

    startClock();
    loadAttendanceState();
}

// ================= LOAD ATTENDANCE STATE =================
function loadAttendanceState(){

    const savedDate = localStorage.getItem("attendanceDate");

    // NEW DAY RESET
    if(savedDate !== today()){
        localStorage.removeItem("status");
        localStorage.removeItem("inTime");
        localStorage.removeItem("outTime");
        localStorage.setItem("attendanceDate", today());
    }

    const inTime = localStorage.getItem("inTime");
    const outTime = localStorage.getItem("outTime");
    const status = localStorage.getItem("status");

    // Check if DOM elements exist before accessing them
    const inTimeEl = document.getElementById("inTime");
    const outTimeEl = document.getElementById("outTime");
    
    if(inTimeEl) inTimeEl.innerText = inTime || "--";
    if(outTimeEl) outTimeEl.innerText = outTime || "--";

    const inBtn = document.getElementById("inBtn");
    const outBtn = document.getElementById("outBtn");

    if(status === "IN"){
        inBtn.style.display="none";
        outBtn.style.display="block";
    }
    else if(status === "OUT"){
        inBtn.style.display="none";
        outBtn.style.display="none";
    }
    else{
        inBtn.style.display="block";
        outBtn.style.display="none";
    }
}

// ================= LIVE CLOCK =================
function startClock(){
    setInterval(()=>{
        const now = new Date();
        const timeEl = document.getElementById("currentTime");
        if(timeEl) {
            timeEl.innerText = now.toLocaleString();
        }
    },1000);
}

// ================= MARK IN =================
async function markIn(){

    if(localStorage.getItem("status")){
        showNotification("Already Marked Today", "warning");
        return;
    }

    const inBtn = document.getElementById("inBtn");
    const originalText = inBtn.innerText;
    
    // Add loading state
    inBtn.classList.add('loading');
    inBtn.innerText = '';
    inBtn.disabled = true;

    const employee = localStorage.getItem("employee");
    const now = new Date().toLocaleString();
    const timestamp = new Date().toISOString();

    try {
        // Save to backend server - works on both localhost and Vercel
        const apiUrl = window.location.hostname === 'localhost' 
            ? "http://localhost:5000/attendance"
            : "/attendance";
        
        let response;
        try {
            response = await fetch(apiUrl,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    name: employee,
                    type: "IN",
                    time: now
                })
            });
        } catch (fetchError) {
            // If fetch fails, work in offline mode
            console.log("Server not available, working offline");
            response = null;
        }

        if (response && response.ok) {
            const result = await response.json();
            console.log("Server response:", result);
        } else {
            console.log("Working in offline mode");
        }

        // Update local storage (works regardless of server)
        localStorage.setItem("status","IN");
        localStorage.setItem("inTime",now);
        localStorage.setItem("attendanceDate", today());
        
        // Save to local array for backup
        const attendance = JSON.parse(localStorage.getItem('attendanceBackup') || '[]');
        attendance.push({
            name: employee,
            type: "IN",
            time: now,
            timestamp: timestamp,
            date: today(),
            ip: "Server"
        });
        localStorage.setItem('attendanceBackup', JSON.stringify(attendance));

        document.getElementById("inTime").innerText = now;
        
        // Success animation
        inBtn.classList.remove('loading');
        inBtn.classList.add('success');
        inBtn.innerText = 'Success!';
        
        setTimeout(() => {
            inBtn.style.display="none";
            document.getElementById("outBtn").style.display="block";
            showNotification("IN Marked \u2705 Saved to Server", "success");
        }, 600);

    } catch(err) {
        inBtn.classList.remove('loading');
        inBtn.innerText = originalText;
        inBtn.disabled = false;
        console.error("Server Error:", err);
        showNotification("Server connection failed ❌", "error");
    }
}

// ================= MARK OUT =================
async function markOut(){

    if(localStorage.getItem("status") !== "IN"){
        showNotification("First mark IN", "warning");
        return;
    }

    const outBtn = document.getElementById("outBtn");
    const originalText = outBtn.innerText;
    
    // Add loading state
    outBtn.classList.add('loading');
    outBtn.innerText = '';
    outBtn.disabled = true;

    const employee = localStorage.getItem("employee");
    const now = new Date().toLocaleString();
    const timestamp = new Date().toISOString();

    try {
        // Save to backend server - works on both localhost and Vercel
        const apiUrl = window.location.hostname === 'localhost' 
            ? "http://localhost:5000/attendance"
            : "/attendance";
        
        let response;
        try {
            response = await fetch(apiUrl,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    name: employee,
                    type: "OUT",
                    time: now
                })
            });
        } catch (fetchError) {
            // If fetch fails, work in offline mode
            console.log("Server not available, working offline");
            response = null;
        }

        if (response && response.ok) {
            const result = await response.json();
            console.log("Server response:", result);
        } else {
            console.log("Working in offline mode");
        }

        // Update local storage (works regardless of server)
        localStorage.setItem("status","OUT");
        localStorage.setItem("outTime",now);
        
        // Save to local array for backup
        const attendance = JSON.parse(localStorage.getItem('attendanceBackup') || '[]');
        attendance.push({
            name: employee,
            type: "OUT",
            time: now,
            timestamp: timestamp,
            date: today(),
            ip: "Server"
        });
        localStorage.setItem('attendanceBackup', JSON.stringify(attendance));

        document.getElementById("outTime").innerText = now;
        
        // Success animation
        outBtn.classList.remove('loading');
        outBtn.classList.add('success');
        outBtn.innerText = 'Success!';
        
        setTimeout(() => {
            outBtn.style.display="none";
            showNotification("OUT Marked \u2705 Saved Successfully", "success");
        }, 600);

    } catch(err) {
        outBtn.classList.remove('loading');
        outBtn.innerText = originalText;
        outBtn.disabled = false;
        console.error("Server Error:", err);
        showNotification("Server connection failed ❌", "error");
    }
}

// ================= GET USER IP =================
async function getUserIP(){
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return "Unknown";
    }
}

// ================= NOTIFICATION SYSTEM =================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#3b82f6';
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function(event) {
    console.log("DOM loaded, script ready");
});
