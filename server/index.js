const app = require('http').createServer();
const io = require('socket.io')(app);

const { default : createLogger } = require('logging');
const logger = createLogger('LogIndex');

const Room = require('./room')
const Server = require('./server')

//TODO: remove
const dummyUser = require('./dummy-data').user;
const dummyServerConfig = require('./dummy-data').dummyServerConfig;
const dummyPort = require('./dummy-data').port;


app.listen(dummyPort, () => {
  logger.info('Server is listening on', dummyPort);
});

const server = new Server(dummyServerConfig);

//TODO: change to actual authentication
const authenticate = (socket) => {

  const user = {
    roomId : socket.handshake.query.roomId || dummyUser.roomId,
    peerId : socket.handshake.query.peerName || dummyUser.peerId
  };

  logger.debug('Authenticating user', user);
  return Promise.resolve({socket, user});
}

io.on('connection', (socket) => {

  authenticate(socket)
    .then( ({socket, user}) => {
      //Forward on mediasoup events if socket request checks out
      logger.debug('Setting up socket events for', user);

      //TODO: 'user' seems to be erased from scope during event firings below
      socket.on('mediasoup-notifaction', (request, cb) => {
        server.recieveNotification(socket, user, request, cb)
      });

      socket.on('mediasoup-request', (request, cb) => {
        server.recieveRequest(socket, user, request, cb)
      });

    })
    .catch( (error) => {
      logger.error(error.toString())
      socket.disconnect(true);
    })

});
