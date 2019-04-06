// Node modules.
const http = require('http');
const { default: createLogger } = require('logging');
const mediasoup = require('mediasoup');
const socketio = require('socket.io');
const uuidv1 = require('uuid/v1');


// Local imports.
const {
  ROOM_CLOSE,
  SOCKET_CONNECTION,
} = require('./events');


const config = require('./config');
const Room = require('./room');
const User = require('./user');

// Globals.
const app = http.createServer();
const io = socketio(app);
const logger = createLogger('Server');
const port = process.env.PORT || config.defaultPort;

if (process.env.NODE_ENV === 'production') {
  if (process.env.PRIVATE_IP === null || process.env.ANNOUNCED_IP === null) {
    logger.error("Must set PRIVATE_IP, ANNOUNCED_IP env variables in 'production'");
  }
  config.rtcIPv4 = process.env.PRIVATE_IP;
  config.rtcAnnouncedIPv4 = process.env.ANNOUNCED_IP;
}

const mediaServer = mediasoup.Server(config.mediasoupServer);

const authenticate = (socket) => {
  const user = new User(
    socket.handshake.query.uid,
    socket.handshake.query.token,
    socket,
  );
  return Promise.resolve(user);
};

const sessionID = uuidv1();
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
