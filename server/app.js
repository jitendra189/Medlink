const express = require("express");
const cors = require("cors");
const path = require("path");
const patientRoutes = require("./routes/patientRoutes");
const hospitalDashboardRoutes = require("./routes/hospitalDashboardRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hospitalSearchRoutes = require("./routes/hospitalSearchRoutes");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

/* API Routes */
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/hospital", hospitalDashboardRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/hospitals",hospitalSearchRoutes);

/* Serve frontend */
app.use(express.static(path.join(__dirname, "../client/public")));

/* Default route */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/index.html"));
});

module.exports = app;