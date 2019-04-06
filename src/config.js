const baseConfig = {
  defaultPort: 8081,

  mediasoupServer: {
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
    numWorkers: null,
  },

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
};

module.exports = baseConfig;
