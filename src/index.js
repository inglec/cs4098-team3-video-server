// Node modules.
const http = require('http');
const { default: createLogger } = require('logging');
const mediasoup = require('mediasoup');
const socketio = require('socket.io');

// Local imports.
const {
  ROOM_CLOSE,
  SOCKET_CONNECTION,
} = require('./events');

const configs = require('./config');
const Room = require('./room');
const User = require('./user');

const config = process.env.NODE_ENV === 'production'
  ? configs.remote
  : configs.local;

// Globals.
const app = http.createServer();
const io = socketio(app);
const logger = createLogger('Server');
const { port } = config;
const mediaServer = mediasoup.Server(config.mediasoupServer);

const authenticate = (socket) => {
  const user = new User(
    socket.handshake.query.uid,
    socket.handshake.query.token,
    socket,
  );
  return Promise.resolve(user);
};

// TODO: Get an actual value from somewhere or generate one
const sessionID = 'testID';
const room = new Room(sessionID, mediaServer, config.mediaCodecs);
room.on(ROOM_CLOSE, () => logger.warn('Room has closed'));

function main() {
  // Handle socket connection and its messages.
  io.on(SOCKET_CONNECTION, (socket) => {
    authenticate(socket)
      .then(user => room.addUser(user))
      .catch((error) => {
        logger.error(error);
        socket.emit('exception', error);
      });
  });

  app.listen(port, () => logger.info('MediaSoup server is listening on port', port));
}

main();
