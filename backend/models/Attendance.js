const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: String, required: true },
  status: {
    type: String,
    enum: ["Present", "Absent", "Leave"],
    default: "Present",
  },
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
