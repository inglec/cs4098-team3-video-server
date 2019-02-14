function Room(config, msroom){

  this._room = msroom;
  this.peers = new Map();
  this.id = config.id;

  this.addPeer = (socket, user) => {

    //should hopefully create a peer if non-exists
    const peer = this._room.getPeerByName(user.peerId);

    peer.on('notify', (notification) => {
      console.log('New notification for mediaPeer received:', notification);
      socket.emit('mediasoup-notification', notification);
    });

    peer.on('newtransport', (transport) => {
      console.log('New mediaPeer transport:', transport.direction);
      transport.on('close', (originator) => {
        console.log('Transport closed from originator:', originator);
      });
    });

    peer.on('newproducer', (producer) => {
      console.log('New mediaPeer producer:', producer.kind);
      producer.on('close', (originator) => {
        console.log('Producer closed from originator:', originator);
      });
    });

    peer.on('newconsumer', (consumer) => {
      console.log('New mediaPeer consumer:', consumer.kind);
      consumer.on('close', (originator) => {
        console.log('Consumer closed from originator', originator);
      });
    });

    // Also handle already existing Consumers.
    peer.consumers.forEach((consumer) => {
      console.log('mediaPeer existing consumer:', consumer.kind);
      consumer.on('close', (originator) => {
        console.log('Existing consumer closed from originator', originator);
      });
    });
    
    socket.on('disconnect', () => {
      if(peer)
        peer.close()
    });
  }

  this.getPeer = (user) => {
    peers.get(user.peerId);
  }

  this.onClose = (onCloseCallback) => {
    this._room.on('close', onCloseCallback);
  }

}

module.exports = Room
