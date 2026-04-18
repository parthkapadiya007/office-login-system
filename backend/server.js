require('dotenv').config();
const express = require("express");
const cors = require("cors");
const admin = require('firebase-admin');

// Initialize Firebase with error handling
let db;
try {
    // Load Firebase service account from environment or file
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require('../firebase-key.json');
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://employee-access-system-c81cb-default-rtdb.asia-southeast1.firebasedatabase.app/"
    });

    db = admin.database();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.log("Firebase initialization failed, using fallback mode:", error.message);
    db = null;
}

const app = express();

app.use(cors());
app.use(express.json());

const OFFICE_IP = process.env.OFFICE_IP || "122.172.241.8";
const PORT = process.env.PORT || 5000;

// ===== CHECK IP =====
app.get("/check-ip", (req, res) => {

    let userIP =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;

    if(userIP === "::1" || userIP.includes("127.0.0.1")){
        userIP = OFFICE_IP;
    }

    console.log("User IP:", userIP);

    if(userIP.includes(OFFICE_IP)){
        res.json({ access: true, ip:userIP });
    }else{
        res.status(403).json({
            access:false,
            message:"Access Denied - Outside Office"
        });
    }
});

// ===== ATTENDANCE API =====
app.post("/attendance", async (req,res)=>{

    let userIP =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;

    if(userIP === "::1" || userIP.includes("127.0.0.1")){
        userIP = OFFICE_IP;
    }

    if(!userIP.includes(OFFICE_IP)){
        return res.status(403).json({
            message:"Outside Office Network \u274c"
        });
    }

    const {name,type,time} = req.body;
    const date = new Date().toISOString().split('T')[0];

    try {
        // Check if Firebase is available
        if (!db) {
            console.log(`Attendance logged locally (Firebase not available): ${name} - ${type} - ${time}`);
            return res.json({
                message:"Attendance Logged Successfully (Local Mode)",
                ip:userIP
            });
        }

        // Save to Firebase
        const attendanceRef = db.ref(`attendance/${date}`);
        const newAttendance = {
            name: name,
            type: type,
            time: time,
            timestamp: new Date().toISOString(),
            date: date,
            ip: userIP
        };
        
        // Push to Firebase
        await attendanceRef.push(newAttendance);

        console.log(`Attendance saved to Firebase: ${name} - ${type} - ${time}`);

        res.json({
            message:"Attendance Saved Successfully",
            ip:userIP
        });
    } catch (error) {
        console.error("Error saving to Firebase:", error);
        res.status(500).json({
            message:"Error saving attendance"
        });
    }
});

// ===== MOBILE ACCESS API =====
app.get("/attendance/:date", async (req,res)=>{
    const { date } = req.params;
    
    try {
        // Check if Firebase is available
        if (!db) {
            return res.json({
                date: date,
                records: [],
                message: "Firebase not available - Local mode"
            });
        }

        // Get attendance from Firebase
        const attendanceRef = db.ref(`attendance/${date}`);
        const snapshot = await attendanceRef.once('value');
        const data = snapshot.val() || {};
        
        // Convert Firebase object to array
        const records = Object.values(data)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({
            date: date,
            records: records
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({
            message:"Error fetching attendance data"
        });
    }
});

// ===== TODAY'S ATTENDANCE API =====
app.get("/attendance/today", async (req,res)=>{
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Check if Firebase is available
        if (!db) {
            return res.json({
                date: today,
                records: [],
                message: "Firebase not available - Local mode"
            });
        }

        // Get today's attendance from Firebase
        const attendanceRef = db.ref(`attendance/${today}`);
        const snapshot = await attendanceRef.once('value');
        const data = snapshot.val() || {};
        
        // Convert Firebase object to array
        const records = Object.values(data)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({
            date: today,
            records: records
        });
    } catch (error) {
        console.error("Error fetching today's attendance:", error);
        res.status(500).json({
            message:"Error fetching today's attendance"
        });
    }
});

// ===== ADMIN USER MANAGEMENT APIS =====

// Get all users
app.get("/admin/users", async (req, res) => {
    try {
        // Check if Firebase is available
        if (!db) {
            return res.json({
                users: [],
                total: 0,
                message: "Firebase not available - Local mode"
            });
        }

        const usersRef = db.ref("users");
        const snapshot = await usersRef.once('value');
        const data = snapshot.val() || {};
        
        // Convert Firebase object to array
        const users = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
        }));
        
        res.json({
            users: users,
            total: users.length
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            message: "Error fetching users"
        });
    }
});

// Create new user
app.post("/admin/users", async (req, res) => {
    try {
        const { username, password, fullname } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }
        
        // Check if Firebase is available
        if (!db) {
            console.log(`User created locally (Firebase not available): ${username}`);
            return res.json({
                message: "User created successfully (Local Mode)",
                userId: "local_" + Date.now()
            });
        }
        
        // Check if user already exists
        const usersRef = db.ref("users");
        const snapshot = await usersRef.orderByChild("username").equalTo(username).once('value');
        
        if (snapshot.exists()) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        
        // Create new user
        const newUser = {
            username: username,
            password: password, // In production, hash this password
            fullname: fullname || username,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        const result = await usersRef.push(newUser);
        
        console.log(`User created: ${username}`);
        
        res.json({
            message: "User created successfully",
            userId: result.key
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            message: "Error creating user"
        });
    }
});

// Delete user
app.delete("/admin/users/:username", async (req, res) => {
    try {
        const { username } = req.params;
        
        // Check if Firebase is available
        if (!db) {
            console.log(`User deleted locally (Firebase not available): ${username}`);
            return res.json({
                message: "User deleted successfully (Local Mode)"
            });
        }
        
        // Find user by username
        const usersRef = db.ref("users");
        const snapshot = await usersRef.orderByChild("username").equalTo(username).once('value');
        
        if (!snapshot.exists()) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        
        // Delete the user
        const updates = {};
        snapshot.forEach(childSnapshot => {
            updates[childSnapshot.key] = null;
        });
        
        await usersRef.update(updates);
        
        console.log(`User deleted: ${username}`);
        
        res.json({
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            message: "Error deleting user"
        });
    }
});

// ===== ROOT ROUTE =====
app.get("/", (req, res) => {
    res.send('Backend server is running! Attendance API ready.');
});

app.listen(PORT,"0.0.0.0",()=>{
    console.log(`Server running on http://localhost:${PORT}`);
});
