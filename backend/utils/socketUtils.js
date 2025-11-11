// Socket.io event emitter utility
const emitEvent = (io, event, data, room = null) => {
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

// Emit to specific user
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

// Emit to specific post room
const emitToPost = (io, postId, event, data) => {
  io.to(`post_${postId}`).emit(event, data);
};

// Emit globally
const emitGlobal = (io, event, data) => {
  io.to('global').emit(event, data);
};

module.exports = {
  emitEvent,
  emitToUser,
  emitToPost,
  emitGlobal
};