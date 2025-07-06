const { default: mongoose } = require("mongoose");
const Message = require("./models/message");
const User = require("./models/user");

let io;
const onlineUsers = new Map();

const initializeSocket = (serverInstance) => {
  io = serverInstance;

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on("authenticate", handleAuthentication(socket));
    socket.on("send-message", handleSendMessage(socket));
    socket.on("make-offer", handleMakeOffer(socket));
    socket.on("respond-offer", handleRespondOffer(socket));
    socket.on("typing", handleTyping(socket));
    socket.on("message-seen", handleMessageSeen(socket));
    socket.on("disconnect", handleDisconnect(socket));
  });

  return io;
};

const handleAuthentication = (socket) => async (userId, callback) => {
  try {
    await User.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: Date.now(),
    });

    onlineUsers.set(userId, socket.id);

    const undeliveredMessages = await Message.find({
      recipient: userId,
      status: "sent",
    });

    await Message.updateMany(
      { recipient: userId, status: "sent" },
      { $set: { status: "delivered" } }
    );
    const deliveredMessages = undeliveredMessages.map((msg) => ({
      ...msg.toObject(),
      status: "delivered",
    }));

    for (const msg of undeliveredMessages) {
      const senderSocketId = onlineUsers.get(msg.sender.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("message-delivered", {
          deliveredMessages,
        });
      }
    }

    if (callback) {
      callback({
        status: "ok",
        undeliveredMessages,
      });
    }

    socket.broadcast.emit("user-online", userId);
  } catch (error) {
    console.error("Authentication error: ", error);
  }
};

const handleSendMessage =
  (socket) =>
  async ({ sender, recipient, conversationId, content }, callback) => {
    try {
      console.log("📬 Sending message:");
      let message = new Message({
        sender,
        recipient,
        conversationId,
        content,
        type: "message",
      });

      await message.save();
      console.log("✅ Message saved:", message._id);

      const receiverSocketId = onlineUsers.get(recipient);
      console.log("🎯 Receiver socket ID:", receiverSocketId);

      if (receiverSocketId) {
        const deliveredMessage = await Message.findByIdAndUpdate(
          message._id,
          { status: "delivered" },
          { new: true }
        );
        message = deliveredMessage;

        io.to(receiverSocketId).emit("new-message", {
          message: message.toObject(),
          status: "delivered",
        });
        console.log("📤 Delivered message to recipient");
      }

      if (callback) {
        callback({
          status: "ok",
          messageId: message._id,
          message,
        });
      }
    } catch (error) {
      console.error("❌ Message sending error:", error);
    }
  };

const handleMessageSeen =
  (socket) =>
  async ({ conversationId, userId }) => {
    try {
      const unseenMessages = await Message.find({
        conversationId,
        recipient: userId,
        status: "delivered",
      });

      const seen = await Message.updateMany(
        { conversationId, recipient: userId, status: "delivered" },
        { $set: { status: "seen" } }
      );

      const seenMessages = unseenMessages.map((msg) => ({
        ...msg.toObject(),
        status: "seen",
      }));

      for (const msg of unseenMessages) {
        const senderSocketId = onlineUsers.get(msg.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("seen", {
            seenMessages,
          });
        }
      }
    } catch (error) {
      console.error("Message seen error: ", error);
    }
  };

const handleMakeOffer =
  (socket) =>
  async ({ sender, recipient, amount, terms, conversationId }, callback) => {
    try {
      const message = new Message({
        sender,
        recipient,
        conversationId,
        type: "offer",
        offer: {
          amount,
          terms,
          status: "pending",
        },
      });
      await message.save();

      const receiverSocketId = onlineUsers.get(recipient);
      if (receiverSocketId) {
        await Message.findByIdAndUpdate(message._id, {
          status: "delivered",
        });
        io.to(receiverSocketId).emit("new-offer", {
          message: message.toObject(),
          status: "delivered",
        });
      }

      if (callback) {
        callback({
          status: "ok",
          messageId: message._id,
          message,
        });
      }

      socket.emit("offer-sent", message.toObject());
    } catch (error) {
      console.error("Offer making error:", error);
      if (callback) {
        callback({
          status: "error",
          error: error.message,
        });
      }
    }
  };

const handleRespondOffer =
  (socket) =>
  async (
    { sender, recipient, conversationId, response, counterOffer, terms },
    callback
  ) => {
    try {
      const message = new Message({
        sender,
        recipient,
        conversationId,
        type: "offer",
        offer: {
          amount: counterOffer,
          terms,
          status: response,
        },
      });
      await message.save();

      const receiverSocketId = onlineUsers.get(recipient);
      if (receiverSocketId) {
        await Message.findByIdAndUpdate(message._id, {
          status: "delivered",
        });
        io.to(receiverSocketId).emit("updated-offer", {
          message: message.toObject(),
          status: "delivered",
        });
      }

      if (callback) {
        callback({
          status: "ok",
          messageId: message._id,
          message,
        });
      }

      socket.emit("offer-replied", message.toObject());
    } catch (error) {
      console.error("Offer response error:", error);
      socket.emit("offer-response-error", {
        error: "Failed to process offer response",
      });
    }
  };

const handleTyping =
  (socket) =>
  async ({ conversationId, userId, isTyping }) => {
    try {
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(1);

      if (messages.length > 0) {
        const lastMessage = messages[0];

        let recipientId;
        if (lastMessage.sender.toString() === userId) {
          recipientId = lastMessage.recipient.toString();
        } else {
          recipientId = lastMessage.sender.toString();
        }

        const receiverSocketId = onlineUsers.get(recipientId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing-status", {
            conversationId,
            userId,
            isTyping,
          });
        }
      }
    } catch (error) {
      console.error("Typing indicator error:", error);
    }
  };

const handleDisconnect = (socket) => async () => {
  try {
    let userId;
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) userId = key;
    });

    if (userId) {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        online: false,
        lastSeen: new Date(),
      });
      socket.broadcast.emit("user-offline", userId);
    }
  } catch (error) {
    console.error("Disconnection error:", error);
  }
};

// Function to generate a random chat_id
const generateChatId = () => {
  return Math.floor(Math.random() * 1000000); // Generates a random number between 0 and 999999
};

module.exports.ChatService = {
  initializeSocket,
  getIo: () => io,
  getOnlineUsers: () => onlineUsers,
  handleAuthentication,
  handleSendMessage,
  handleMakeOffer,
  generateChatId,
};
