import { io } from "socket.io-client";
import config from "./config";


const { API } = config;
// Adjust the URL to match your server's address.
const socket = io(API);

export default socket;
