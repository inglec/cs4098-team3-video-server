const logger = require('./logme')

class Connection {

  constructor(socket, user, room){
    this._socket = socket;
    this._room = room;
    this._peer = null;
    this._user = {
      peerId : socket.handshake.query.peerName,
      roomId : socket.handshake.query.roomId,
    }

    //The source of hours of woes, slain
    this._requestHandler = this._requestHandler.bind(this);
    this._notificationHandler = this._notificationHandler.bind(this);
    this._disconnectHandler = this._disconnectHandler.bind(this);
    this._roomRequest = this._roomRequest.bind(this);
    this._peerRequest = this._peerRequest.bind(this);

    this._socket.on('mediasoup-request', this._requestHandler);
    this._socket.on('mediasoup-notification', this._notificationHandler);
    this._socket.on('disconnect', this._disconnectHandler);
  }

  user(){
    return this._user;
  }

  peer(){
    return this._peer;
  }

  hasPeer(){
    return (this._peer != null);
  }

  roomId(){
    return this._user.roomId;
  }

  peerId(){
    return this._user.peerId;
  }

  room(){
    return this._room;
  }

  setPeer(peer){
    if(!(this instanceof Connection)){
      logger.error("'this' is a ", this.constructor.name);
      throw Error("this not setting properly");
    }
    this._peer = peer;
    Connection._setupPeerEventHandlers(this._peer, this._user, this._socket);
    logger.debug("Peer set for ", this.user());
  }

  _requestHandler(request, socketCallback){

    switch (request.target) {

      case 'room':
        this._roomRequest(request, socketCallback); break;

      case 'peer':
        this._peerRequest(request, socketCallback); break;

      default:
        const err = Error("Unknown request target", request.target);
        logger.error('Err', err);
        socketCallback(err.toString());
    }
  }

  _roomRequest(request, socketCallback){
    switch (request.method) {

      case 'join':
        this.room().receiveRequest(request)
          .then((response) => {
            this.setPeer(room.getPeerByName(this.peerId()));
            socketCallback(null, response);
          })
          .catch((error) => {
            socketCallback(error.toString())
          });
        break;

      default:
        this.room().receiveRequest(request)
          .then((response) => socketCallback(null, response))
          .catch((error) => socketCallback(error.toString()));
    }
  }

  _peerRequest(request, socketCallback){
    if(this.hasPeer())
    {
      this.peer().receiveRequest(request)
        .then((response) => socketCallback(null, response))
        .catch((error) => socketCallback(error.toString()));
    }
    else
    {
      logger.warn('Cannot handle mediaSoup request, no mediaSoup Peer');
      return;
    }
  }

  _notificationHandler(notification){
    logger.debug('Got notification from client peer', notification);
    switch (notification.target) {
      case 'peer':
        if (this.hasPeer())
        {
          this.peer().receiveNotification(notification);
        }
        else
        {
          logger.warn('Cannot handle mediaSoup notification, no mediaSoup Peer');
          return;
        }
        break;

      default:
        throw Error("Invalid notification target");

    }
  }

  _disconnectHandler(){
    if(this._peer){
      this._peer.close();
    }
  }

  static _setupPeerEventHandlers(peer, user, socket){
    logger.debug("Setting up callbacks");

    peer.on('notify', (notification) => {
      logger.info('Notifcation recieved for :', user, " method: "
        , notification.method);
      socket.emit('mediasoup-notification', notification);
    });

    peer.on('newtransport', (transport) => {
      logger.info('New peer transport:', transport.direction, user);
      transport.on('close', (originator) => {
        logger.info('Transport closed:', transport.direction, user);
      });
    });

    peer.on('newproducer', (producer) => {
      logger.info('New media producer:', producer.kind, producer.peer.name);
      producer.on('close', (originator) => {
          logger.info('Producer closed:', producer.kind, user);
      });
    });

    peer.on('newconsumer', (consumer) => {
      logger.info('New media consumer:', consumer.kind, consumer.peer.name);
      consumer.on('close', (originator) => {
        logger.info('Consumer closed:', consumer.kind);
      });
    });

    // Also handle already existing Consumers.
    peer.consumers.forEach((consumer) => {
      logger.info('Existing consumer:', consumer.kind, consumer.peer.name);
      consumer.on('close', (originator) => {
        logger.info('Existing consumer closed:', consumer.kind);
      });
    });
  }

}

module.exports = Connection;
