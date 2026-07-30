jest.mock("expo-audio", () => ({
  setAudioModeAsync: jest.fn(async () => undefined),
  useAudioPlayer: jest.fn(() => ({
    pause: jest.fn(),
    play: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(async () => undefined),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    didJustFinish: false,
    isBuffering: false,
    isLoaded: false,
    playing: false,
  })),
}));

export {};
