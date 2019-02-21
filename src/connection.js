const { default: createLogger } = require('logging');

const logger = createLogger('connection');

class Connection {
  constructor(socket, user, room) {
    this.peer = null;
    this.room = room;
    this.socket = socket;
    this.user = user;
    this.disconnectHandler = this.disconnectHandler.bind(this);
    this.notificationHandler = this.notificationHandler.bind(this);
    this.peerRequest = this.peerRequest.bind(this);
    this.requestHandler = this.requestHandler.bind(this);
    this.roomRequest = this.roomRequest.bind(this);

    this.socket.on('disconnect', this.disconnectHandler);
    this.socket.on('mediasoup-notification', this.notificationHandler);
    this.socket.on('mediasoup-request', this.requestHandler);
  }

  getUser() {
    return this.user;
  }

  getPeer() {
    return this.peer;
  }

  hasPeer() {
    return this.peer !== null;
  }

  getRoom() {
    return this.room;
  }

  /**
   * Sets the peer object that is associated with this connection and sets the event listeners
   * required.
   */
  setPeer(peer) {
    this.peer = peer;
    this.setupPeerEventHandlers();
    logger.debug('Peer set for', this.user);
  }

  /**
   * Handler for all requests coming through on this connection routes the requests to their correct
   * target.
   */
  requestHandler(request, socketCallback) {
    switch (request.target) {
      case 'room':
        this.roomRequest(request, socketCallback);
        break;
      case 'peer':
        this.peerRequest(request, socketCallback);
        break;
      default:
        logger.error(`Unknown request target ${request.target}`);
        socketCallback(Error(`Unknown request target ${request.target}`));
    }
  }

  /**
   * Handler for requests with the target: 'room'.
   */
  roomRequest(request, socketCallback) {
    logger.debug('REQ:', request.method, request.peerName);
    if (request.method === 'join') {
      this.room.receiveRequest(request)
        .then((response) => {
          const peer = this.room.getPeerByName(this.user.name);
          this.setPeer(peer);
          socketCallback(null, response);
        })
        .catch((error) => {
          logger.error(error);
          socketCallback(error.toString());
        });
    } else {
      this.room.receiveRequest(request)
        .then(response => socketCallback(null, response))
        .catch((error) => {
          logger.error(error);
          socketCallback(error.toString());
        });
    }
  }

  /**
   * Handler for requests with the target: 'peer'.
   */
  peerRequest(request, socketCallback) {
    if (this.hasPeer()) {
      this.peer.receiveRequest(request)
        .then(response => socketCallback(null, response))
        .catch((error) => {
          logger.error(error);
          socketCallback(error.toString());
        });
    } else {
      logger.warn('Cannot handle mediaSoup request, no mediaSoup Peer');
    }
  }

  /**
   * Handler for all notifactions that come through on this connection.
   */
  notificationHandler(notification) {
    logger.debug('Got notification from client peer', notification);

    switch (notification.target) {
      case 'peer':
        if (this.hasPeer()) {
          this.peer.receiveNotification(notification);
        } else {
          logger.warn('Cannot handle mediaSoup notification, no mediaSoup Peer');
        }
        break;
      default:
        logger.warn('An invalid target was set for notification:', notification.target);
    }
  }

  /**
   * Handler for when the socket disconnects.
   */
  disconnectHandler() {
    logger.info('Socket connection close', this.user);
    if (this.peer) {
      this.peer.close();
    }
  }

  /**
   * Helper function to set all the event handlers specifically for this peer on this connection.
   */
  setupPeerEventHandlers() {
    logger.debug('Setting up callbacks');
    this.peer.on('notify', (notification) => {
      logger.info('Notification recieved for:', this.user, ' method:', notification.method);
      this.socket.emit('mediasoup-notification', notification);
    });

    this.peer.on('newtransport', (transport) => {
      logger.info('New peer transport:', transport.direction, this.user);
      transport.on('close', () => logger.info('Transport closed:', transport.direction, this.user));
    });

    this.peer.on('newproducer', (producer) => {
      logger.info('New media producer:', producer.kind, producer.peer.name);
      producer.on('close', () => logger.info('Producer closed:', producer.kind, this.user));
    });

    this.peer.on('newconsumer', (consumer) => {
      logger.info('New media consumer:', consumer.kind, consumer.peer.name);
      consumer.on('close', () => logger.info('Consumer closed:', consumer.kind));
    });

    // Also handle already existing Consumers.
    this.peer.consumers.forEach((consumer) => {
      logger.info('Existing consumer:', consumer.kind, consumer.peer.name);
      consumer.on('close', () => logger.info('Existing consumer closed:', consumer.kind));
    });
  }
}

module.exports = Connection;
