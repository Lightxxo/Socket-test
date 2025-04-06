import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const WaitingArea = () => {
  // Helper functions.
  const generateUserId = () => {
    const randomStr = Math.random().toString(36).substring(2, 8);
    const randomInt = Math.floor(Math.random() * 1000);
    return `${randomStr}${randomInt}#`;
  };

  const generateRandomColor = () => {
    const color = Math.floor(Math.random() * 0xffffff).toString(16);
    return '#' + color.padStart(6, '0');
  };

  // Views: "join" | "waiting" | "dating"
  const [currentView, setCurrentView] = useState("join");
  const [formData, setFormData] = useState({
    userid: generateUserId(),
    eventid: '2',
    gender: 'M',
    interestedGender: 'M',
    color: generateRandomColor(),
  });
  const [myInfo, setMyInfo] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [datingPartner, setDatingPartner] = useState(null);
  // We store the absolute end time (ms) for the event.
  const [eventEndTime, setEventEndTime] = useState(null);
  const [eventEndedFlag, setEventEndedFlag] = useState(false);
  
  // Local countdown display computed from eventEndTime.
  const [displayTime, setDisplayTime] = useState(null);

  // Extend flow modals (for dating view)
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [extendRequester, setExtendRequester] = useState(null);

  // On mount, if we already have an eventEndTime stored, use it.
  useEffect(() => {
    const storedEndTime = localStorage.getItem('eventEndTime');
    if (storedEndTime) {
      setEventEndTime(parseInt(storedEndTime, 10));
    }
  }, []);

  // Update timer display based on eventEndTime.
  useEffect(() => {
    let countdown;
    if (currentView === "waiting" && eventEndTime) {
      countdown = setInterval(() => {
        const remaining = eventEndTime - Date.now();
        if (remaining >= 0) {
          setDisplayTime(remaining);
        } else {
          clearInterval(countdown);
          setDisplayTime(0);
        }
      }, 1000);
    } else {
      setDisplayTime(null);
    }
    return () => clearInterval(countdown);
  }, [currentView, eventEndTime]);

  useEffect(() => {
    socket.on('eventEnded', () => {
      setEventEndedFlag(true);
      if (currentView === "waiting") {
        alert("Event has ended. Returning to join page.");
        setCurrentView("join");
        setMyInfo(null);
        setEventEndTime(null);
        localStorage.removeItem('eventEndTime');
      }
      // Dating users will simply have the flag set.
    });

    socket.on('joinRejected', (data) => {
      alert(data.message);
      setCurrentView("join");
      setMyInfo(null);
      setEventEndTime(null);
      localStorage.removeItem('eventEndTime');
    });

    socket.on('roomUpdate', (users) => {
      setRoomUsers(users);
    });

    socket.on('matchFound', (data) => {
      setDatingPartner(data.partner);
      setCurrentView("dating");
    });

    socket.on('joinResponse', (data) => {
      if (data.endTime) {
        setEventEndTime(data.endTime);
        localStorage.setItem('eventEndTime', data.endTime);
      }
    });

    // Extend flow listeners.
    socket.on('extendRequest', (data) => {
      setExtendRequester(data.requester);
      setShowExtendModal(true);
    });
    socket.on('extendWaiting', () => {
      setShowWaitingModal(true);
    });
    socket.on('extendResult', (data) => {
      if (data.accepted) {
        // Accept branch: do not change currentView.
        console.log("Extend accepted; continuing dating.");
        setShowExtendModal(false);
        setShowWaitingModal(false);
      } else {
        console.log("Extend rejected; sending both users back.");
        setShowExtendModal(false);
        setShowWaitingModal(false);
        setDatingPartner(null);
        setMyInfo(null);
        setCurrentView("join");
      }
    });
    socket.on('datingEnded', () => {
      setDatingPartner(null);
      setCurrentView(eventEndedFlag ? "join" : "waiting");
    });

    return () => {
      socket.off('eventEnded');
      socket.off('joinRejected');
      socket.off('roomUpdate');
      socket.off('matchFound');
      socket.off('joinResponse');
      socket.off('extendRequest');
      socket.off('extendWaiting');
      socket.off('extendResult');
      socket.off('datingEnded');
    };
  }, [currentView, eventEndedFlag]);

  const formatTime = (ms) => {
    let totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleJoin = () => {
    if (!formData.eventid) {
      alert("Please enter an event ID");
      return;
    }
    socket.emit("joinRoom", formData);
    setMyInfo(formData);
    setCurrentView("waiting");
    setEventEndedFlag(false);
  };

  const handleLeaveDating = () => {
    if (!myInfo) {
      setCurrentView("join");
      return;
    }
    socket.emit("leaveDating", myInfo);
  };

  const handleExtend = () => {
    socket.emit("extendRequest");
    setShowWaitingModal(true);
  };

  const handleAcceptExtend = () => {
    socket.emit("extendResponse", { accepted: true });
    // Do not change currentView here; simply hide the modals.
    setShowExtendModal(false);
    setShowWaitingModal(false);
  };

  const handleRejectExtend = () => {
    socket.emit("extendResponse", { accepted: false });
    setShowExtendModal(false);
  };

  if (currentView === "join") {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Enter Your Details</h2>
        <div style={{ marginBottom: "10px" }}>
          <label>
            User ID:
            <input type="text" name="userid" value={formData.userid} readOnly style={{ marginLeft: "10px" }} />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Event ID:
            <input type="text" name="eventid" placeholder="Event ID" value={formData.eventid} onChange={handleChange} style={{ marginLeft: "10px" }} />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Gender:
            <select name="gender" value={formData.gender} onChange={handleChange} style={{ marginLeft: "10px" }}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Interested In:
            <select name="interestedGender" value={formData.interestedGender} onChange={handleChange} style={{ marginLeft: "10px" }}>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="B">B</option>
            </select>
          </label>
        </div>
        <button onClick={handleJoin}>Join Room</button>
      </div>
    );
  }

  if (currentView === "dating") {
    if (!myInfo || !datingPartner) {
      setCurrentView("join");
      return null;
    }
    return (
      <div style={{ padding: "20px" }}>
        <h2>Dating Area</h2>
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{
            flex: 1,
            minWidth: "250px",
            border: `3px solid ${myInfo.color}`,
            padding: "10px",
            backgroundColor: myInfo.color,
            color: getContrastColor(myInfo.color),
            borderRadius: "4px"
          }}>
            <h3>My Info</h3>
            <p><strong>UserID:</strong> {myInfo.userid}</p>
            <p><strong>Gender:</strong> {myInfo.gender}</p>
            <p><strong>Interested In:</strong> {myInfo.interestedGender}</p>
          </div>
          <div style={{
            flex: 1,
            minWidth: "250px",
            border: `3px solid ${datingPartner.color}`,
            padding: "10px",
            backgroundColor: datingPartner.color,
            color: getContrastColor(datingPartner.color),
            borderRadius: "4px"
          }}>
            <h3>My Match</h3>
            <p><strong>UserID:</strong> {datingPartner.userid}</p>
            <p><strong>Gender:</strong> {datingPartner.gender}</p>
            <p><strong>Interested In:</strong> {datingPartner.interestedGender}</p>
          </div>
        </div>
        <button onClick={handleExtend} style={{ backgroundColor: "blue", color: "#fff", padding: "10px", marginRight: "10px" }}>
          Extend
        </button>
        <button onClick={handleLeaveDating}>Leave Dating</button>

        {showWaitingModal && (
          <Modal>
            <div style={{ padding: "20px" }}>
              <h3>Waiting for partner’s decision...</h3>
            </div>
          </Modal>
        )}

        {showExtendModal && (
          <Modal>
            <div style={{ padding: "20px" }}>
              <h3>{extendRequester?.userid} wants to extend the call.</h3>
              <div style={{ marginTop: "20px" }}>
                <button onClick={handleAcceptExtend} style={{ marginRight: "10px" }}>Accept</button>
                <button onClick={handleRejectExtend}>Reject</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Waiting view.
  return (
    <div style={{ padding: "20px" }}>
      <h2>Waiting Area</h2>
      <div style={{
        backgroundColor: 'red',
        color: '#fff',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '1.5em',
        width: 'fit-content',
        marginBottom: '20px'
      }}>
        {displayTime !== null ? formatTime(displayTime) : "Loading..."}
      </div>
      {roomUsers.length === 0 ? (
        <p>No users in this room yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {roomUsers.map((user, index) => (
            <li key={index} style={{
              backgroundColor: user.color,
              color: getContrastColor(user.color),
              padding: "5px",
              marginBottom: "5px",
              borderRadius: "4px"
            }}>
              {user.userid} - {user.gender} - {user.interestedGender}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Modal = ({ children }) => (
  <div style={modalOverlayStyle}>
    <div style={modalBoxStyle}>
      {children}
    </div>
  </div>
);

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalBoxStyle = {
  backgroundColor: '#000',
  padding: '20px',
  borderRadius: '8px',
  minWidth: '300px',
  textAlign: 'center'
};

const getContrastColor = (hexColor) => {
  if (!hexColor) return "#000";
  const color = hexColor.charAt(0) === "#" ? hexColor.substring(1) : hexColor;
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
};

export default WaitingArea;
