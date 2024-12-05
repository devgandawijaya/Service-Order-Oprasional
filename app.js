const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const initSocket = require("./hellpers/socketio");
const { scheduleTask } = require('./hellpers/taskscheduler');
const configureSecurity = require("./hellpers/security");
const logger = require('./hellpers/logger');
const app = express();
const server = http.createServer(app);

configureSecurity(app);
app.use(bodyParser.json());
app.use("/openapi", userRoutes);
app.use(express.static(path.join(__dirname, "public")));

initSocket(server);
scheduleTask();

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});