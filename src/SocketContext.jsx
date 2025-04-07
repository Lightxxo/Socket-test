// import React, { createContext } from "react";
// import socket from "./socket";

// export const SocketContext = createContext();

// export const SocketProvider = ({ children }) => {
//   return (
//     <SocketContext.Provider value={socket}>
//       {children}
//     </SocketContext.Provider>
//   );
// };
// SocketContext.js
import { createContext } from "react";

export const SocketContext = createContext();
