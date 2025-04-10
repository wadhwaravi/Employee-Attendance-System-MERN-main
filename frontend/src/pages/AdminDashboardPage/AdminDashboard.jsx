import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [status, setStatus] = useState("Present");
  const [attendance, setAttendance] = useState([]);
  const [showAttendance, setShowAttendance] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const user = jwtDecode(token);
    if (user.role !== "admin") {
      alert("Access denied. Admins only.");
      return navigate("/");
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("User and their attendance records deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error.response?.data);
      alert("Failed to delete user.");
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert(`User role updated to ${newRole}!`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error.response?.data);
      alert("Failed to update role.");
    }
  };

  const fetchAttendance = () => {
    axios
      .get("http://localhost:5000/api/admin/attendance", {
        params: {
          userId: selectedUser,
          date: selectedDate.toISOString().split("T")[0],
        },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => setAttendance(data));
  };

  const addAttendance = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/admin/attendance",
        {
          userId: selectedUser,
          date: selectedDate.toISOString().split("T")[0],
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert("Attendance saved!");
      fetchAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error.response?.data);
      alert("Failed to save attendance");
    }
  };

  const fetchAllAttendance = () => {
    axios
      .get("http://localhost:5000/api/admin/attendance/all", {
        params: { userId: selectedUser },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => {
        setAttendance(data);
        setShowAttendance(true);
      })
      .catch((err) => {
        console.error("Error fetching attendance:", err.response?.data);
        alert("Failed to fetch attendance records");
      });
  };

  const deleteAttendance = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/attendance/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Attendance deleted!");
      fetchAttendance();
    } catch (error) {
      console.error("Error deleting attendance:", error.response?.data);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-dashboard">
        <h3>Manage Users</h3>
        {users && (
          <ul className="user-list">
            {users.length === 0 ? (
              <li className="no-records">No users found!</li>
            ) : (
              users.map((user) => (
                <li key={user._id} className="user-item">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                  <select
                    value={user.role}
                    onChange={(e) => changeUserRole(user._id, e.target.value)}
                    className="input-select"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="btn-delete"
                    onClick={() => deleteUser(user._id)}
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        <h3>Manage Attendance</h3>
        <div className="form-group">
          <select
            className="input-select"
            onChange={(e) => {
              const selectedId = e.target.value;
              setSelectedUser(selectedId);

              const user = users.find((user) => user._id === selectedId);
              setSelectedUserName(user ? user.name : "");

              setAttendance([]);
              setShowAttendance(false);
            }}
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>

          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="YYYY MMMM dd"
            className="input-select"
          />

          <select
            className="input-select"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select>
        </div>

        <div className="form-group-btn">
          <button className="btn-fetch" onClick={addAttendance}>
            Save Attendance
          </button>

          <button className="btn-fetch" onClick={fetchAllAttendance}>
            View Attendance
          </button>
        </div>

        <h3 className="attendance-heading">
          All Attendance Records for {selectedUserName || "Selected User"}
        </h3>

        {showAttendance && (
          <ul className="attendance-list">
            {attendance.length === 0 ? (
              <li className="no-records">No attendance records found!</li>
            ) : (
              attendance.map((record) => (
                <li key={record._id}>
                  {record.date} - {record.status}{" "}
                  <button
                    className="btn-delete"
                    onClick={() => deleteAttendance(record._id)}
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
