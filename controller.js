const { ChatService } = require("./datasource");

const initializeSocketIO = (server) => {
  return ChatService.initializeSocket(server);
};

const getSocketIO = () => {
  return ChatService.getIo();
};

module.exports = {
  initializeSocketIO,
  getSocketIO,
};
