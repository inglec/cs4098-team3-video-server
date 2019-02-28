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

const room = mediaServer.Room(config.mediasoup.mediaCodecs);
const getRoom = user => room;

const authenticate = (socket) => {
  const user = {
    id: 0,
    uid: socket.handshake.query.uid,
    token: socket.handshake.query.token,
  };

  return Promise.resolve({ socket, user });
};
function main() {
  // Handle socket connection and its messages.
  io.on('connection', (socket) => {
    authenticate(socket)
      .then(({ socket, user }) => {
        // TODO: Use connection to do something?
        const userroom = getRoom(user);
        logger.info('New socket connection:', user);
        const connection = new Connection(socket, user, userroom);
      })
      .catch(error => logger.warn('Unauthorized socket connection', error.toString()));
  });

  app.listen(port, () => logger.info('MediaSoup server is listening on port', port));
}

main();
