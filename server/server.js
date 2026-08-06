import dotenv from "dotenv";

dotenv.config();

console.log("SERVER:", process.env.RESEND_API_KEY);

import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./utils/socket.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running with WebSockets on port ${PORT}`);
  });
});