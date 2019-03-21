const remotePublicIP = '34.255.199.16';
const remotePrivateIP = '172.31.28.152';

const baseConfig = {
  port: 8081,

  mediasoup: {
    // Mediasoup Server settings.
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp', 'rbe', 'rtx'],
    rtcIPv4: true,
    rtcIPv6: true,
    rtcAnnouncedIPv4: null,
    rtcAnnouncedIPv6: null,
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    maxBitrate: 500000,
    mediaCodecs: [
      {
        kind: 'audio',
        name: 'opus',
        clockRate: 48000,
        channels: 2,
        parameters: { useinbandfec: 1 },
      },
      {
        kind: 'video',
        name: 'VP8',
        clockRate: 90000,
      },
    ],
  },
};

const localConfig = {
  ...baseConfig,
  mediasoup: {
    ...baseConfig.mediasoup,
  },
};

const remoteConfig = {
  ...baseConfig,
  port: 48081,
  mediasoup: {
    ...baseConfig.mediasoup,
    rtcIPv4: remotePrivateIP,
    rtcAnnouncedIPv4: remotePublicIP,
  },
};

module.exports = {
  local: localConfig,
  remote: remoteConfig,
};
