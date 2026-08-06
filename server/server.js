import dotenv from "dotenv";

dotenv.config();

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