import React, { useContext, useEffect } from "react";
import { SocketContext } from "./SocketContext";
import { AppContext } from "./AppContext";
import Countdown from "./countdown";
import config from "./config";

const { API } = config;

const DatingPage = ({ goToPage }) => {
  const socket = useContext(SocketContext);
  const { sharedData, updateSharedData } = useContext(AppContext);

  useEffect(() => {
    if (sharedData.timerActive) {
      console.log("✅ Cancelling timeout since user arrived in dating room");

      // Cancel timeout if it's still active when user arrives in dating room
      if (sharedData.timeoutRef) {
        clearTimeout(sharedData.timeoutRef);
        updateSharedData({ timeoutRef: null }); // Clear the reference from sharedData
      }

      updateSharedData({ timerActive: false });
    }
  }, [sharedData, updateSharedData]);

  async function onLeave() {
    try {
      const response = await fetch(`${API}join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: sharedData.event_id,
          user: sharedData.user,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Join response:", data);

        // Emit join events via socket
        socket.emit("switch_room", {
          from: sharedData.dateRoomId,
          to: sharedData.event_id,
        });

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
  }
  // Listen to the socket connect event
  useEffect(() => {
    // socket.on("connect", () => {
    //   console.log("Connected with id:", socket.id);
    // });

    socket.on("has_left", onLeave);

    return () => {
      socket.off("has_left", onLeave);
    };
  }, [socket]);

  const handleTimerComplete = async () => {
    console.log("Timer finished — calling completion API");
    try {
      const res = await fetch(`${API}leaveDatingRoom`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: sharedData.event_id,
          user_id: sharedData.user.user_id,
        }),
      });
      // const json = await res.json();
      // console.log("dateComplete response:", json);

      // fetch
    } catch (err) {
      console.error("Error calling dateComplete:", err);
    }
  };

  if (typeof sharedData.timer !== "number") {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Dating Page</h1>
        <p>Loading timer…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1>Dating Page</h1>

      <Countdown
        initialSeconds={sharedData.timer}
        onComplete={handleTimerComplete}
      />

      <button
        onClick={() => goToPage("join")}
        style={{ marginTop: "20px", padding: "10px 20px" }}
      >
        Go to Join Page
      </button>
    </div>
  );
};

export default DatingPage;
