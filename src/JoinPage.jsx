import React, { useState, useEffect, useContext } from "react";
import { SocketContext } from "./SocketContext";
import { AppContext } from "./AppContext";
import config from "./config";

const { API } = config;

const JoinPage = ({ goToPage }) => {
  const socket = useContext(SocketContext);
  const { updateSharedData } = useContext(AppContext);

  // Generate a random user_id
  const generateUserId = () => Math.random().toString(36).substr(2, 9);

  const [formData, setFormData] = useState({
    event_id: "1",
    user: {
      user_id: generateUserId(),
      gender: "M",
      interested: "M",
    },
  });

  // Listen to the socket connect event
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected with id:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, [socket]);

  // Handle changes for both top-level and nested user fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["user_id", "gender", "interested"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        user: { ...prev.user, [name]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // On submit, call the backend, update shared data, emit join event, and navigate to waiting room
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Join response:", data);

        // Update global shared data
        updateSharedData({
          ...formData,
          event_time: data.event_time,
        });

        // Emit join events via socket
        socket.emit("join_event", formData.event_id);

        // Navigate to waiting page
        goToPage("waiting");
      } else {
        console.error(
          "Failed to join, server responded with status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error submitting join form:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Join Page</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>
            User ID:
            <input
              type="text"
              name="user_id"
              value={formData.user.user_id}
              onChange={handleChange}
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Event ID:
            <input
              type="text"
              name="event_id"
              value={formData.event_id}
              onChange={handleChange}
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Gender:
            <input
              type="text"
              name="gender"
              value={formData.user.gender}
              onChange={handleChange}
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Interested In:
            <input
              type="text"
              name="interested"
              value={formData.user.interested}
              onChange={handleChange}
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default JoinPage;
