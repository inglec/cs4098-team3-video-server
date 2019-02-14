const app = require('http').createServer();
const io = require('socket.io')(app);

const Room = require('./room')
const Server = require('./server')

//TODO: remove
const dummyUser = require('./dummy-data').user;
const dummyServerConfig = require('./dummy-data').dummyServerConfig;
const dummyPort = require('./dummy-data').port;


app.listen(dummyPort, () => {
  console.log(`Server is listening on ${dummyPort}`)
});

const server = new Server(dummyServerConfig);

//TODO: change to actual authentication
const authenticate = (socket) => {
  console.log(dummyUser);
  return new Promise( (resolve, reject) => { resolve(socket, dummyUser) });
}


io.on('connection', (socket) => {

  authenticate(socket)
    .then( (socket, user) => {
      //Forward on mediasoup events if socket request checks out

      //TODO: 'user' seems to be erased from scope during event firings below

      socket.on('mediasoup-notifaction', (request, cb) => {
        server.recieveNotification(socket, dummyUser, request, cb)
      });

      socket.on('mediasoup-request', (request, cb) => {
        server.recieveRequest(socket, dummyUser, request, cb)
      });

    })
    .catch( (error) => {
      console.log(error.toString())
      socket.disconnect(true);
    })

});
