const logger = require('./logme')

class Room{

  constructor(config, msroom) {
    this._room = msroom;
    this.peers = new Map();
    this.id = config.id;
  }

  receiveJoin(request, socket, user, cb) {
    this._room.receiveRequest(request)
      .then( (response) => {
        logger.info("User ", user.peerId, " joined room", this.id);
        mpeer = this._room.getPeerByName(user.peerId);
        this._setNewPeerHandles(mpeer, user, socket);
        this.peers.add(user.peerId, mpeer);
        cb(null, response);
      })
      .catch( (error) => {
        logger.error("Failed to respond to", request, "\n", error);
        cb(error)
      });
  }

  receiveQueryRoom(request, cb) {
    this._room.receiveRequest(request)
      .then( (response) => {
        logger.info("User ", user.peerId, " queried room", this.id);
        cb(null, response);
      })
      .catch( (error) => {
        logger.error("Failed to respond to", request, "\n", error);
        cb(error)
      });
  }

  _setNewPeerHandles(peer, socket) {

    peer.on('notify', (notification) => {
      logger.info('New notification for mediaPeer received:', notification);
      socket.emit('mediasoup-notification', notification);
    });

    peer.on('newtransport', (transport) => {
      logger.info('New mediaPeer transport:', transport.direction);
      transport.on('close', (originator) => {
        logger.info('Transport closed from originator:', originator);
      });
    });

    peer.on('newproducer', (producer) => {
      logger.info('New mediaPeer producer:', producer.kind);
      producer.on('close', (originator) => {
        logger.info('Producer closed from originator:', originator);
      });
    });

    peer.on('newconsumer', (consumer) => {
      logger.info('New mediaPeer consumer:', consumer.kind);
      consumer.on('close', (originator) => {
        logger.info('Consumer closed from originator', originator);
      });
    });

    // Also handle already existing Consumers.
    peer.consumers.forEach((consumer) => {
      logger.info('mediaPeer existing consumer:', consumer.kind);
      consumer.on('close', (originator) => {
        logger.info('Existing consumer closed from originator', originator);
      });
    });

    socket.on('disconnect', () => {
      logger.info("Peer has closed the connection", user);
      this.peers.delete(user.peerId);
      if(peer){
        peer.close()
      }
    });
  }

  getPeer(user) {
    return peers.get(user.peerId);
  }

  onClose(onCloseCallback) {
    this._room.on('close', onCloseCallback);
  }

}

module.exports = Room
