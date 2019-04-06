const { default: createLogger } = require('logging');

const {
  ROOM_CLOSE,
  SOCKET_DISCONNECT,
  MEDIASOUP_NOTIFICATION,
  MEDIASOUP_REQUEST,
} = require('./events');

const logger = createLogger('Server');

/* eslint-disable class-methods-use-this */
class Room {
  constructor(sessionId, msServer, mediaCodecs) {
    this.users = {}; // map user.uid => User
    this.listeners = {
      [ROOM_CLOSE]: [],
    };

    this.sessionId = sessionId;
    this.msRoom = msServer.Room(mediaCodecs);
    this.msRoom.on(ROOM_CLOSE, () => {
      logger.warn('Room has closed');
      this.emit(ROOM_CLOSE);
    });
  }

  addUser(user) {
    this.users[user.uid] = user;
    user.on(SOCKET_DISCONNECT, uid => delete this.users[uid]);
    user.on(MEDIASOUP_NOTIFICATION, ({ notification, sender }) => {
      this.onNotification({ notification, sender });
    });
    user.on(MEDIASOUP_REQUEST, ({ request, socketCallback, sender }) => {
      this.onRequest({ request, socketCallback, sender });
    });
  }

  onNotification({ notification, sender }) {
    logger.info('Notification:', notification.method, sender.uid);
    switch (notification.target) {
      case 'peer':
        this.onPeerNotification({ notification, sender });
        break;

      case 'room':
        this.onRoomNotification({ notification, sender });
        break;

      default:
        logger.warn('Unrecognized notification target', notification.target);
    }
  }

  onRequest({ request, socketCallback, sender }) {
    logger.info('Request:', request.method, 'source', sender.uid);

    switch (request.target) {
      case 'peer':
        this.onPeerRequest({ request, socketCallback, sender });
        break;

      case 'room':
        this.onRoomRequest({ request, socketCallback, sender });
        break;

      default:
        logger.warn('Unknown request target', request.target);
        socketCallback(Error(`Unknown request target ${request.target}`));
    }
  }

  onPeerNotification({ notification, sender }) {
    if (!sender.hasPeer()) {
      logger.warn('No peer set for user', sender);
      return;
    }
    // May include more here
    sender.peer.receiveNotification(notification); // mediasoup method
  }

  onRoomNotification({ notification, sender }) {
    switch (notification.method) {
      case 'chat-message':
        this.onChatMessage({ notification, sender });
        break;

      default:
        logger.warn('Unrecognized notification method', notification.method);
    }
  }

  onPeerRequest({ request, socketCallback, sender }) {
    if (sender.hasPeer()) {
      sender.peer.receiveRequest(request)
        .then(response => socketCallback(null, response))
        .catch((error) => {
          logger.error(error);
          socketCallback(error.toString());
        });
    } else {
      logger.warn('No peer set', sender);
      socketCallback(`Can't handle ${request}, no peer set for ${sender}`);
    }
  }

  onRoomRequest({ request, socketCallback, sender }) {
    switch (request.method) {
      case 'join':
        this.msRoom.receiveRequest(request)
          .then((response) => {
            const senderPeer = this.msRoom.getPeerByName(sender.uid);
            sender.setPeer(senderPeer);
            response.sessionId = this.sessionId;
            socketCallback(null, response);
          })
          .catch((error) => {
            logger.error(error);
            socketCallback(error.toString());
          });
        break;

      default:
        this.msRoom.receiveRequest(request)
          .then(response => socketCallback(null, response))
          .catch((error) => {
            logger.error(error);
            socketCallback(error.toString());
          });
    }
  }

  onChatMessage({ notification, sender }) {
    if (!sender.hasPeer()) {
      logger.warn('No peer set for user', sender);
      return;
    }

    const messageNotifcation = {
      target: 'peer',
      method: 'chat-message',
      notification: true,
      appData: notification.appData,
    };

    Object.values(this.users).forEach((user) => {
      if (user.hasPeer() && user.uid !== sender.uid) {
        logger.info('Sending message to peer', notification.appData, user.uid);
        user.socket.emit(MEDIASOUP_NOTIFICATION, messageNotifcation);
      }
    });
  }

  on(eventName, callback) {
    if (eventName in this.listeners) {
      this.listeners[eventName].push(callback);
    }
    return this;
  }

  emit(eventName, ...args) {
    if (eventName in this.listeners) {
      this.listeners[eventName].forEach(cb => cb(...args));
    }
  }
}

module.exports = Room;
