import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "./SocketContext";
import { AppContext } from "./AppContext";
import config from "./config";
import Countdown from "./countdown";

const { API } = config;

const WaitingPage = ({ goToPage }) => {
  const socket = useContext(SocketContext);
  const { sharedData, updateSharedData } = useContext(AppContext);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    console.log("#######", sharedData);
  }, [sharedData]);

  useEffect(() => {
    if (!sharedData.event_id) return;

    const handleStartDate = (dateData) => {
      if (sharedData.timeoutRef) {
        clearTimeout(sharedData.timeoutRef);
      }
      updateSharedData({ timer: dateData.timer });
      goToPage("dating");
    };

    socket.once("start_date", handleStartDate);

    return () => {
      socket.off("start_date", handleStartDate);
      if (sharedData.timeoutRef) {
        clearTimeout(sharedData.timeoutRef);
      }
    };
  }, [socket, sharedData, goToPage, updateSharedData]);

  useEffect(() => {
    const handleMatchFound = (data) => {
      if (isConfirmed) return;
      setMatchData(data);
      setShowModal(true);
    };

    socket.on("match_found", handleMatchFound);

    return () => {
      socket.off("match_found", handleMatchFound);
    };
  }, [socket, isConfirmed]);

  const confirmDate = async (data) => {
    try {
      const response = await fetch(`${API}confirmDate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: data.pair,
          event_id: sharedData.event_id,
          dateRoomId: data.dateRoomId,
          userData: sharedData.user,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        updateSharedData({ dateRoomId: data.dateRoomId, timerActive: true });

        const timeoutId = setTimeout(() => {
          console.log(
            "❌ Other user did not join in time. Call failure API..."
          );
          // Failure API callback; currently does nothing else.
        }, 10000);
        updateSharedData({ timeoutRef: timeoutId }); // Store timeout reference in sharedData
      } else {
        console.error("confirmDate API call failed", result);
      }
    } catch (error) {
      console.error("Error in confirmDate:", error);
    }
  };

  const handleAccept = () => {
    if (!matchData) return;
    setIsConfirmed(true);
    setShowModal(false);
    socket.emit("switch_room", matchData.dateRoomId);
    confirmDate(matchData);
  };

  const handleDecline = () => {
    console.log("User declined the match.");
    setShowModal(false);
  };

  // Calculate countdown seconds using event_time in sharedData.
  // The difference is computed from now until the event_time.
  let initialSeconds = 0;
  if (sharedData.event_time) {
    const eventDate = new Date(sharedData.event_time);
    const now = new Date();
    initialSeconds = Math.floor((eventDate - now) / 1000);
    if (initialSeconds < 0) {
      initialSeconds = 0;
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Waiting Room</h1>
      <p>Waiting for a match...</p>

      {/* Render event countdown if event_time is available */}
      {sharedData.event_time && (
        <div style={{ marginTop: "20px" }}>
          <h2>Event Countdown</h2>
          <Countdown initialSeconds={initialSeconds} onComplete={() => {goToPage("join")}} />
        </div>
      )}

      {showModal && matchData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#000",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h2>Match Found!</h2>
            <p>
              Pair: {matchData.pair.join(" & ")} <br />
              Room: {matchData.dateRoomId}
            </p>
            <div style={{ marginTop: "20px" }}>
              <button onClick={handleAccept} style={{ marginRight: "10px" }}>
                Yes
              </button>
              <button onClick={handleDecline}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingPage;
