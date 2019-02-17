const mediasoup = require('mediasoup');
const Room = require('./room')

const { default : createLogger } = require('logging');
const logger = createLogger('LogServer');

function Server(config){

  this.rooms = new Map();
  this.config = config;
  this.roomIds = config.rooms.map( (roomConfig) => roomConfig.id);
  this._mediaserver = mediasoup.Server(config.mediasoup);

  //Create every room in the config
  config.rooms.forEach( (roomConfig) => {
    logger.info('Creating room: id -', roomConfig);
    msroom = this._mediaserver.Room(config.roomcodecs)
    room = new Room(roomConfig, msroom);
    room.onClose( () => rooms.delete(room.id))
    this.rooms.set(roomConfig.id.toString(), room);
  });


  //Gets a room, creates it if it should be there and rejects if not
  this.getRoom = (roomId) => {
  
    if (this.rooms.has(roomId)) //Made and found
    {
      return this.rooms.get(roomId);
    }
    else if (this.roomIds.includes(roomId)) //Included but not made
    {
      msroom = this._mediaserver.Room(this.config.roomcodecs);
      roomConfig = this.config.rooms.find( (e) => { return e.id == roomId });
      this.rooms.set(roomId, new Room(roomConfig, msroom));

      return this.rooms.get(roomId);
    }
    else //Not included
    {
      return null;
    }
  };

  this.recieveRequest = (socket, user, request, cb) => {
    logger.info("Request recieved", request, "user", user);
    //logger.info("\tUser",user);
    const room = this.getRoom(user.roomId);
    if (room == null){
      logger.warn("Room does not exist on this server", user);
      return cb(Error("Room does not exist on this server"));
    }

    switch (request.target){

      case 'room':

        switch (request.method) {

          case 'join':
            room.recieveRequest(request)
              .then( (response) => {
                room.addPeer(socket, user);
                return cb(null, response);
              }).catch( (error) => cb(error));
            break;

          case 'queryRoom':
            room.recieveRequest(request)
              .then( (response) => cb(null, response))
              .catch( (error) => cb(error.toString()));
            break;

          default:
            const err = Error("Unrecognized method for target: room");
            logger.error(err);
            return cb(err);
        }

      break; //case 'room' end

      case 'peer': //TODO: Break up into actual methods

        const peer = room.getPeer(user);
        peer.recieveRequest(request)
          .then( (response) => cb(null, response))
          .catch( (error) => cb(error.toString()) )

      break; //case 'peer' end

      default:
        cb(Error("Unrecognized request target"));
    }

  }

  this.recieveNotification = (socket, user, request, cb) => {
    logger.info("Notification Recieved ")
    const room = this.getRoom(user.roomId);
    if (room == null){
      return cb(Error("Room does not exist on this server"));
    }
    room.getPeer(user).recieveNotification(notifaction);
  }


}

module.exports = Server
