require("dotenv").config({ path: "./.env" }); // if .env is one level up
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const socketRoutes = require("./routes");
const socketController = require("./controller");
const dbConnect = require("./dbConnect");

const startSocketServer = async () => {
  await dbConnect();

  const app = express();
  const server = http.createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:8000",
    "https://jobifyy.com",
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      console.log("CORS Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  };

  app.use(cors(corsOptions));

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  socketController.initializeSocketIO(io);

  app.get("/", (req, res) => res.send("Socket.IO + REST backend is live"));

  app.use("/socket", socketRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  server.listen(8001, () => {
    console.log(`Socket.IO Server running on http://localhost:8002`);
  });
};

startSocketServer().catch(console.error);
