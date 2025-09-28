// src/mespeak.js
let initPromise = null;

export async function initMeSpeak() {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const ms = window.meSpeak;
    if (!ms) {
      reject(new Error("meSpeak not loaded"));
      return;
    }
    ms.loadConfig("/vendor/mespeak/mespeak_config.json", () => {
      ms.loadVoice("/vendor/mespeak/voices/en/en-us.json", () => {
        resolve(true);
      }, reject);
    }, reject);
  });

  return initPromise;
}

export async function speakMe(text, opts = {}) {
  await initMeSpeak();
  window.meSpeak.speak(text, {
    amplitude: 100,
    speed: 170,
    pitch: 60,
    variant: "f1",
    ...opts,
  });
}
