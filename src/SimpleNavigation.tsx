import React, { useState } from 'react';

// Join Page Component
const JoinPage = ({ goToPage }) => (
  <div style={{ padding: "20px" }}>
    <h2>Join Page</h2>
    <p>This is the Join Page.</p>
    <button onClick={() => goToPage("waiting")} style={{ marginTop: "10px" }}>
      Go to Waiting Page
    </button>
  </div>
);

// Waiting Page Component
const WaitingPage = ({ goToPage }) => (
  <div style={{ padding: "20px" }}>
    <h2>Waiting Page</h2>
    <p>This is the Waiting Page.</p>
    <button onClick={() => goToPage("dating")} style={{ marginTop: "10px" }}>
      Go to Dating Page
    </button>
  </div>
);

// Dating Page Component
const DatingPage = ({ goToPage }) => (
  <div style={{ padding: "20px" }}>
    <h2>Dating Page</h2>
    <p>This is the Dating Page.</p>
    <button onClick={() => goToPage("join")} style={{ marginTop: "10px" }}>
      Go to Join Page
    </button>
  </div>
);

// Main App Component that handles navigation
const App = () => {
  const [currentPage, setCurrentPage] = useState("join");

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "join":
        return <JoinPage goToPage={goToPage} />;
      case "waiting":
        return <WaitingPage goToPage={goToPage} />;
      case "dating":
        return <DatingPage goToPage={goToPage} />;
      default:
        return <JoinPage goToPage={goToPage} />;
    }
  };

  return (
    <div>
      {renderPage()}
      {/* Global Navigation */}
      <div style={{ padding: "20px", borderTop: "1px solid #ccc" }}>
        <button onClick={() => goToPage("join")} style={{ marginRight: "10px" }}>
          Join
        </button>
        <button onClick={() => goToPage("waiting")} style={{ marginRight: "10px" }}>
          Waiting
        </button>
        <button onClick={() => goToPage("dating")}>
          Dating
        </button>
      </div>
    </div>
  );
};

export default App;
