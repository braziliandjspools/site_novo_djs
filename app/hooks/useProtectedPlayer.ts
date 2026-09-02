"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlayerState = {
  playingId: string | null;
  loadingId: string | null;
  currentTime: number;
  duration: number;
  error: string | null;
};

type UseProtectedPlayerOptions = {
  streamEndpoint?: string;
  getStreamUrl?: (id: string) => string;
  onEnded?: (trackId: string) => void;
};

function looksLikeAudio(data: ArrayBuffer): boolean {
  if (data.byteLength < 4) return false;
  const u8 = new Uint8Array(data, 0, Math.min(data.byteLength, 16));
  const isId3 = u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33;
  const isMp3Frame = u8[0] === 0xff && (u8[1] & 0xe0) === 0xe0;
  if (isId3 || isMp3Frame) return true;
  const isWav = u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46;
  if (isWav) return true;
  const isFlac = u8[0] === 0x66 && u8[1] === 0x4c && u8[2] === 0x61 && u8[3] === 0x43;
  if (isFlac) return true;
  const isOgg = u8[0] === 0x4f && u8[1] === 0x67 && u8[2] === 0x67 && u8[3] === 0x53;
  if (isOgg) return true;
  const head = new TextDecoder().decode(u8);
  return !head.includes("<!DOCTYPE") && !head.startsWith("{");
}

function waitForAudioMetadata(audio: HTMLAudioElement) {
  return new Promise<void>((resolve, reject) => {
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resolve();
      return;
    }

    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("metadata failed"));
    };
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("loadedmetadata", onReady);
    audio.addEventListener("error", onError);
  });
}

export function useProtectedPlayer(options?: UseProtectedPlayerOptions) {
  const streamEndpoint = options?.streamEndpoint ?? "/api/stream";
  const getStreamUrl = options?.getStreamUrl;
  const useMediaElement = Boolean(getStreamUrl);
  const onEndedRef = useRef(options?.onEnded);
  onEndedRef.current = options?.onEnded;

  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const startAtRef = useRef(0);
  const offsetRef = useRef(0);
  const trackIdRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);

  const [state, setState] = useState<PlayerState>({
    playingId: null,
    loadingId: null,
    currentTime: 0,
    duration: 0,
    error: null,
  });

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopSource = useCallback(() => {
    if (useMediaElement) {
      const audio = audioRef.current;
      if (audio) {
        stoppingRef.current = true;
        audio.pause();
        audio.onended = null;
        stoppingRef.current = false;
      }
      return;
    }

    if (sourceRef.current) {
      stoppingRef.current = true;
      try {
        sourceRef.current.stop();
      } catch {
        /* already stopped */
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  }, [useMediaElement]);

  const tick = useCallback(() => {
    if (useMediaElement) {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : prev.duration,
      }));
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = ctxRef.current;
    const buffer = bufferRef.current;
    if (!ctx || !buffer || !sourceRef.current) return;

    const elapsed = ctx.currentTime - startAtRef.current;
    const current = Math.min(buffer.duration, offsetRef.current + elapsed);

    setState((prev) => ({ ...prev, currentTime: current }));

    if (current >= buffer.duration) return;
    rafRef.current = requestAnimationFrame(tick);
  }, [useMediaElement]);

  const getContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const ensureContextRunning = useCallback(async () => {
    if (useMediaElement) return;
    const ctx = getContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }, [getContext, useMediaElement]);

  const failLoad = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      loadingId: prev.loadingId === id ? null : prev.loadingId,
      error: "Não foi possível carregar a faixa.",
    }));
  }, []);

  const loadTrackMedia = useCallback(
    async (id: string) => {
      const src = id.startsWith("/") ? id : getStreamUrl!(id);
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
        audioRef.current = audio;
      }

      stopSource();
      revokeObjectUrl();
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      audio.src = src;
      audio.currentTime = 0;

      try {
        await waitForAudioMetadata(audio);
      } catch {
        failLoad(id);
        return false;
      }

      trackIdRef.current = id;
      offsetRef.current = 0;
      setState((prev) => ({
        ...prev,
        loadingId: null,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        currentTime: 0,
        error: null,
      }));
      return true;
    },
    [failLoad, getStreamUrl, revokeObjectUrl, stopSource],
  );

  const loadTrackBuffer = useCallback(
    async (id: string) => {
      try {
        const isLocalSrc = id.startsWith("/");
        const res = isLocalSrc
          ? await fetch(id, { cache: "force-cache" })
          : await fetch(streamEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
              cache: "no-store",
            });

        if (!res.ok) throw new Error("Stream indisponível");

        const data = await res.arrayBuffer();
        if (!looksLikeAudio(data)) throw new Error("Resposta inválida do servidor");

        const ctx = getContext();
        stopSource();

        bufferRef.current = await ctx.decodeAudioData(data.slice(0));
        trackIdRef.current = id;
        offsetRef.current = 0;

        setState((prev) => ({
          ...prev,
          loadingId: null,
          duration: bufferRef.current?.duration ?? 0,
          currentTime: 0,
          error: null,
        }));
        return true;
      } catch {
        failLoad(id);
        return false;
      }
    },
    [failLoad, getContext, stopSource, streamEndpoint],
  );

  const loadTrack = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loadingId: id, error: null }));
      if (useMediaElement) return loadTrackMedia(id);
      return loadTrackBuffer(id);
    },
    [loadTrackBuffer, loadTrackMedia, useMediaElement],
  );

  const handleNaturalEnd = useCallback(() => {
    const endedId = trackIdRef.current;
    if (endedId) {
      onEndedRef.current?.(endedId);
    }
    if (trackIdRef.current) {
      offsetRef.current = 0;
      setState((prev) => ({
        ...prev,
        playingId: null,
        currentTime: 0,
      }));
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const playBufferNode = useCallback(async () => {
    const ctx = getContext();
    const buffer = bufferRef.current;
    if (!buffer) return false;

    stopSource();
    await ensureContextRunning();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (stoppingRef.current) {
        stoppingRef.current = false;
        sourceRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
      }

      sourceRef.current = null;
      handleNaturalEnd();
    };

    startAtRef.current = ctx.currentTime;
    source.start(0, offsetRef.current);
    sourceRef.current = source;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return true;
  }, [ensureContextRunning, getContext, handleNaturalEnd, stopSource, tick]);

  const playMediaElement = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    stopSource();
    audio.currentTime = offsetRef.current;
    audio.onended = () => {
      if (stoppingRef.current) return;
      handleNaturalEnd();
    };

    try {
      await audio.play();
    } catch {
      failLoad(trackIdRef.current ?? "");
      return false;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return true;
  }, [failLoad, handleNaturalEnd, stopSource, tick]);

  const play = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, error: null }));
      if (!useMediaElement) {
        await ensureContextRunning();
      }

      if (trackIdRef.current !== id) {
        const loaded = await loadTrack(id);
        if (!loaded) return;
      }

      const started = useMediaElement ? await playMediaElement() : await playBufferNode();
      if (!started) return;

      setState((prev) => ({
        ...prev,
        playingId: id,
        loadingId: null,
        duration: useMediaElement
          ? Number.isFinite(audioRef.current?.duration)
            ? (audioRef.current?.duration ?? prev.duration)
            : prev.duration
          : (bufferRef.current?.duration ?? prev.duration),
      }));
    },
    [ensureContextRunning, loadTrack, playBufferNode, playMediaElement, useMediaElement],
  );

  const pause = useCallback(() => {
    if (useMediaElement) {
      const audio = audioRef.current;
      if (!audio) return;

      offsetRef.current = audio.currentTime;
      stopSource();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setState((prev) => ({
        ...prev,
        playingId: null,
        currentTime: offsetRef.current,
      }));
      return;
    }

    const ctx = ctxRef.current;
    const buffer = bufferRef.current;
    if (!buffer || !sourceRef.current) return;

    if (ctx && ctx.state !== "closed") {
      offsetRef.current = Math.min(buffer.duration, ctx.currentTime - startAtRef.current + offsetRef.current);
    }

    stopSource();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setState((prev) => ({
      ...prev,
      playingId: null,
      currentTime: offsetRef.current,
    }));
  }, [stopSource, useMediaElement]);

  const toggle = useCallback(
    async (id: string) => {
      if (state.playingId === id) {
        pause();
        return;
      }
      try {
        if (!useMediaElement) {
          await ensureContextRunning();
        }
        await play(id);
      } catch {
        /* erro registrado no state */
      }
    },
    [state.playingId, pause, play, ensureContextRunning, useMediaElement],
  );

  const seek = useCallback(
    async (ratio: number) => {
      const clamped = Math.max(0, Math.min(1, ratio));

      if (useMediaElement) {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(audio.duration)) return;

        offsetRef.current = clamped * audio.duration;
        const wasPlaying = trackIdRef.current !== null && !audio.paused;

        audio.pause();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        audio.currentTime = offsetRef.current;

        setState((prev) => ({
          ...prev,
          currentTime: offsetRef.current,
        }));

        if (wasPlaying && trackIdRef.current) {
          await playMediaElement();
          setState((prev) => ({ ...prev, playingId: trackIdRef.current }));
        }
        return;
      }

      const buffer = bufferRef.current;
      if (!buffer) return;

      offsetRef.current = clamped * buffer.duration;
      const wasPlaying = trackIdRef.current !== null && sourceRef.current !== null;

      stopSource();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setState((prev) => ({
        ...prev,
        currentTime: offsetRef.current,
      }));

      if (wasPlaying && trackIdRef.current) {
        await playBufferNode();
        setState((prev) => ({ ...prev, playingId: trackIdRef.current }));
      }
    },
    [playBufferNode, playMediaElement, stopSource, useMediaElement],
  );

  useEffect(() => {
    return () => {
      stopSource();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      revokeObjectUrl();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== "closed") {
        void ctx.close();
      }
      ctxRef.current = null;
    };
  }, [revokeObjectUrl, stopSource]);

  return {
    ...state,
    progress: state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0,
    toggle,
    play,
    pause,
    seek,
  };
}
