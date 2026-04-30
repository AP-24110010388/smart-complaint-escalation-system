const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = "smart_secure_2026_design";

mongoose.connect("mongodb://localhost:27017/complaintsDB")
    .then(() => console.log("✅ Database Connected"))
    .catch(err => console.log("❌ DB Error:", err));

const User = mongoose.model("User", {
    fullName: String, email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, gender: String,
    dob: String, phone: String, role: { type: String, enum: ["User", "Staff", "Admin"], default: "User" }
});

const Complaint = mongoose.model("Complaint", {
    title: String, area: String, submittedBy: String,
    userEmail: String, userPhone: String, status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

app.post("/register", async (req, res) => {
    try {
        const { fullName, email, password, gender, dob, phone, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ fullName, email, password: hashedPassword, gender, dob, phone, role }).save();
        res.status(201).json({ message: "Success" });
    } catch (err) { res.status(400).json({ error: "Registration failed" }); }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, role: user.role, fullName: user.fullName, email: user.email, phone: user.phone });
});

app.get("/complaints", async (req, res) => { res.json(await Complaint.find().sort({ createdAt: -1 })); });
app.post("/add-complaint", async (req, res) => { await new Complaint(req.body).save(); res.json({ message: "Added" }); });
app.put("/resolve/:id", async (req, res) => { await Complaint.findByIdAndUpdate(req.params.id, { status: "Resolved" }); res.json({ message: "Updated" }); });
app.get("/stats", async (req, res) => {
    res.json({ total: await Complaint.countDocuments(), pending: await Complaint.countDocuments({ status: "Pending" }), resolved: await Complaint.countDocuments({ status: "Resolved" }) });
});

app.listen(5000, () => console.log("🚀 Server: http://localhost:5000"));