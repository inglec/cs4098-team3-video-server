// Node modules.
const http = require('http');
const _ = require('lodash');
const { default: createLogger } = require('logging');
const mediasoup = require('mediasoup');
const socketio = require('socket.io');

// Local imports.
const config = require('./config');
const Connection = require('./connection');

// Globals.
const app = http.createServer();
const io = socketio(app);
const logger = createLogger('Server');
const { port } = config.server;
const rooms = {}; // TODO: Make this conform to some external config.

// MediaSoup server
const mediaServer = mediasoup.Server({
  // Copy the following fields from the mediasoup config.
  ..._.pick(config.mediasoup, [
    'logLevel',
    'logTags',
    'rtcAnnouncedIPv4',
    'rtcAnnouncedIPv6',
    'rtcIPv4',
    'rtcIPv6',
    'rtcMaxPort',
    'rtcMinPort',
  ]),
  numWorkers: null, // Use as many CPUs as available.
});

const getRoom = (id) => {
  if (id in rooms) {
    return rooms[id];
  }

  const room = mediaServer.Room(config.mediasoup.mediaCodecs);
  rooms[id] = room;
  room.on('close', () => delete rooms[id]);

  return room;
};

const authenticate = (socket) => {
  const user = {
    peerId: socket.handshake.query.peerName,
    roomId: socket.handshake.query.roomId,
  };

  return Promise.resolve({ socket, user });
};

function main() {
  // Handle socket connection and its messages.
  io.on('connection', (socket) => {
    authenticate(socket)
      .then(({ socket, user }) => {
        logger.info('New socket connection:', user);

        // TODO: Use connection to do something?
        const room = getRoom(user.roomId);
        const connection = new Connection(socket, user, room);
      })
      .catch(error => logger.warn('Unauthorized socket connection', error.toString()));
  });

  app.listen(port, () => logger.info('MediaSoup server is listening on port', port));
}

main();
