/**
 * Utilitário de celebração sonora do Santuário.
 * Reproduz o toque do Shofar (/toque-shofar.mp3) com volume suave (22%)
 * e fade-in progressivo para uma experiência reverente e agradável.
 */

export const SHOFAR_AUDIO_SRC = "/toque-shofar.mp3";
export const SHOFAR_TARGET_VOLUME = 0.22;
export const SHOFAR_INITIAL_VOLUME = 0.04;

let activeAudioInstance: HTMLAudioElement | null = null;
let activeFadeTimer: ReturnType<typeof setInterval> | null = null;

export function playSoftShofarSound(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return null;
  }

  try {
    if (activeFadeTimer) {
      clearInterval(activeFadeTimer);
      activeFadeTimer = null;
    }

    if (activeAudioInstance) {
      try {
        activeAudioInstance.pause();
        activeAudioInstance.currentTime = 0;
      } catch {
        // Ignora erro caso o elemento anterior não suporte pause em ambiente de teste
      }
    }

    const audio = new Audio(SHOFAR_AUDIO_SRC);
    audio.preload = "auto";
    audio.volume = SHOFAR_INITIAL_VOLUME;
    activeAudioInstance = audio;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          // Fade-in suave de 0.04 até 0.22 em ~600ms (6 passos de 100ms)
          let currentVol = SHOFAR_INITIAL_VOLUME;
          activeFadeTimer = setInterval(() => {
            currentVol = Math.min(SHOFAR_TARGET_VOLUME, currentVol + 0.03);
            try {
              audio.volume = Number(currentVol.toFixed(2));
            } catch {
              // Ignora se volume for somente leitura
            }
            if (currentVol >= SHOFAR_TARGET_VOLUME && activeFadeTimer) {
              clearInterval(activeFadeTimer);
              activeFadeTimer = null;
            }
          }, 100);
        })
        .catch(() => {
          // Navegador bloqueou autoplay ou ambiente de teste sem suporte a mídia
        });
    } else {
      audio.volume = SHOFAR_TARGET_VOLUME;
    }

    return audio;
  } catch {
    return null;
  }
}

