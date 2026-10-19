// The audio and video recorders remember the devices they last opened so the next take
// starts on the same ones. Both share one saved record, so picking an input in either
// recorder (e.g. a Loopback virtual device) carries over to the other.
// The key predates the audio picker; it is kept so existing users keep their devices.
const DEVICES_KEY = 'chops_videoDevices';

export function loadSavedDevices() {
  try {
    return JSON.parse(localStorage.getItem(DEVICES_KEY)) || {};
  } catch {
    return {};
  }
}

// Merges into the saved record so one recorder doesn't forget the other's devices
export function saveDevices(devices) {
  try {
    localStorage.setItem(DEVICES_KEY, JSON.stringify({ ...loadSavedDevices(), ...devices }));
  } catch {
    // Remembering devices is a convenience only
  }
}

// Device IDs can change (e.g. after an OS update), so fall back to the label
export function resolveDevice(list, id, label) {
  return list.find((d) => d.deviceId === id) || list.find((d) => label && d.label === label) || null;
}

// Picks the saved audio input out of the current device list. Only the saved ID gets the
// label fallback: a different, explicitly chosen ID that is gone should not silently
// turn back into the saved device.
export function resolveSavedAudioInput(list, id) {
  const saved = loadSavedDevices();
  return resolveDevice(list, id, id === saved.audioInputId ? saved.audioInputLabel : null);
}

export async function listAudioInputs() {
  const all = await navigator.mediaDevices.enumerateDevices();
  return all.filter((d) => d.kind === 'audioinput');
}
