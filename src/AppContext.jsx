import React, { createContext, useRef, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sharedData, setSharedData] = useState({});
  const timeoutRef = useRef(null);

  const updateSharedData = (newData) => {
    setSharedData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <AppContext.Provider
      value={{
        sharedData,
        updateSharedData,
        setSharedData,
        timeoutRef,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
