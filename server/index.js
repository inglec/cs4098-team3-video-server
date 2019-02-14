const app = require('http').createServer();
const io = require('socket.io')(app);

const config = require('./config');
const Room = require('./room')
const Server = require('./server')

const port = config.server.port
app.listen(port, () => console.log(`Server is listening on ${port}`) );

//Get the config specific to the server
const serverConfig = config.mediasoup;
const server = new Server(serverConfig);
console.log('Server created')

io.on('connection', (socket) => {
  
});
