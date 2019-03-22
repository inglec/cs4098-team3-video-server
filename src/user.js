const { default: createLogger } = require('logging');

const {
  SOCKET_DISCONNECT,
  MEDIASOUP_NOTIFICATION,
  MEDIASOUP_REQUEST,
  NOTIFY,
} = require('./events');

const logger = createLogger('user');

class User {
  constructor(uid, token, socket) {
    this.peer = null;
    this.listeners = {
      [SOCKET_DISCONNECT]: [],
      [MEDIASOUP_NOTIFICATION]: [],
      [MEDIASOUP_REQUEST]: [],
    };

    this.uid = uid;
    this.token = token;
    this.socket = socket;

    this.socket.on(SOCKET_DISCONNECT, () => this.onSocketDisconnect());
    this.socket.on(MEDIASOUP_NOTIFICATION, (notification) => {
      this.emit(MEDIASOUP_NOTIFICATION, {
        notification,
        sender: this,
      });
    });
    this.socket.on(MEDIASOUP_REQUEST, (request, socketCallback) => {
      this.emit(MEDIASOUP_REQUEST, {
        request,
        socketCallback,
        sender: this,
      });
    });
  }

  setPeer(peer) {
    this.peer = peer;
    peer.on(NOTIFY, notification => this.socket.emit(MEDIASOUP_NOTIFICATION, notification));
  }

  hasPeer() {
    return this.peer !== null;
  }

  onSocketDisconnect() {
    logger.info('Socket connection close', this.uid);
    if (this.hasPeer()) {
      this.peer.close();
    }
    this.emit(SOCKET_DISCONNECT, this.uid);
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

module.exports = User;
