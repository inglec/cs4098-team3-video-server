const publicIP = '34.255.199.16';
const privateIP = '172.31.28.152';

module.exports = {
  server: { port: 48081 },
  mediasoup: {
    // Mediasoup Server settings.
    logLevel: 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
      'rbe',
      'rtx',
    ],
    rtcIPv4: privateIP,
    rtcIPv6: true,
    rtcAnnouncedIPv4: publicIP,
    rtcAnnouncedIPv6: null,
    rtcMinPort: 40000,
    rtcMaxPort: 49999,

    // Mediasoup Room codecs.
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
      // {
      //   kind: 'video',
      //   name: 'H264',
      //   clockRate: 90000,
      //   parameters: {
      //     'packetization-mode': 1
      //   }
      // }
    ],
    // Mediasoup per-Peer max sending bitrate (in bps).
    maxBitrate: 500000,
  },
};
