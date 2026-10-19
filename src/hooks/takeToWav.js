// Turns a finished MediaRecorder take into a WAV file.
//
// This is the only place that knows the take came from MediaRecorder. A future capture
// engine (e.g. CoreAudio on the Rust side) that produces PCM directly can replace this
// function and nothing else in the recorder needs to change.
//
// The source is Opus (or AAC) from MediaRecorder, so the WAV is lossless only from this
// point on: it is a faithful decode of the compressed take, not of the microphone.
import { encodeWav } from '../constants/wav';

// A take whose quieter channel is this far below the louder one (-40 dB) came from a
// one-sided source, such as an interface with the guitar on input 1 only
const ONE_SIDED_RATIO = 0.01;

const rms = (data) => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
};

// Recording goes straight from the mic to MediaRecorder: routing it through Web Audio
// to mix down to mono caused brief dropouts, because Web Audio runs on the output
// device's clock. So the fold-down happens here, after the fact: a take with sound on
// only one side becomes centered mono, everything else keeps its channels.
const foldOneSided = (buffer) => {
  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
  if (channels.length !== 2) return channels;
  const [l, r] = channels.map(rms);
  const louder = Math.max(l, r);
  if (louder === 0 || Math.min(l, r) / louder > ONE_SIDED_RATIO) return channels;
  return [l >= r ? channels[0] : channels[1]];
};

// Resolves to { bytes, mimeType: 'audio/wav' }; throws if the take can't be decoded
export async function takeToWav(blob) {
  // Decode at 48 kHz, the rate recordings are made at, so nothing is resampled
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let context;
  try {
    context = new AudioCtx({ sampleRate: 48000 });
  } catch {
    context = new AudioCtx();
  }
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    const wav = encodeWav(foldOneSided(buffer), buffer.sampleRate);
    return { bytes: new Uint8Array(await wav.arrayBuffer()), mimeType: 'audio/wav' };
  } finally {
    context.close().catch(() => {});
  }
}
