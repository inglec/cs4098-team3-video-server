const app = require('http').createServer();
const io = require('socket.io')(app);
const config = require('./config');
const mediasoup = require('mediasoup');
const port = config.server.port;
const Connection = require('./connection')
const logger = require('./logme')

app.listen(port, () => console.log(`MediaSoup server is listening on port ${port}!`));

// MediaSoup server
const mediaServer = mediasoup.Server({
  numWorkers: null, // Use as many CPUs as available.
  logLevel: config.mediasoup.logLevel,
  logTags: config.mediasoup.logTags,
  rtcIPv4: config.mediasoup.rtcIPv4,
  rtcIPv6: config.mediasoup.rtcIPv6,
  rtcAnnouncedIPv4: config.mediasoup.rtcAnnouncedIPv4,
  rtcAnnouncedIPv6: config.mediasoup.rtcAnnouncedIPv6,
  rtcMinPort: config.mediasoup.rtcMinPort,
  rtcMaxPort: config.mediasoup.rtcMaxPort
});



// Map of Room instances indexed by roomId.
const rooms = new Map(); //TODO: Make this conform to some external config

const getRoom = (id) => {
  if (rooms.has(id)) {
    return rooms.get(id);
  } else {
    room = mediaServer.Room(config.mediasoup.mediaCodecs);
    rooms.set(id, room);
    room.on('close', () => {
      rooms.delete(id);
    });
    return room;
  }
}

const authenticate = (socket) => {
  const user = {
    peerId : socket.handshake.query.peerName,
    roomId : socket.handshake.query.roomId
  }
  return Promise.resolve({socket, user});
}

// Handle socket connection and its messages
io.on('connection', (socket) => {

  authenticate(socket)
    .then( ({socket, user}) => {
      logger.info('New socket connection:', user);
      const room = getRoom(user.roomId);
      const connection = new Connection(socket, user, room);
    })
    .catch( (error) => {
      logger.warn("Unauthorized socket connection", error.toString());
    })

});
