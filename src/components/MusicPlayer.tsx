"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PlayerState = "playing" | "paused" | "loading";

const TRACKS = [
  {
    title: "Late Night Drive",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    title: "Neon Lights",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    title: "City Skyline",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    title: "Midnight Pulse",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    title: "Starlit Avenue",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    title: "Afterglow",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    title: "Neon Horizon",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    title: "Skyline Drift",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    title: "Violet Nights",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
];

const containerVariants = {
  playing: {
    backgroundColor: "var(--color-playing)",
    boxShadow: "0 0 40px 0 rgba(139, 92, 246, 0.3)",
  },
  paused: {
    backgroundColor: "var(--color-card)",
    boxShadow:
      "0 20px 50px color-mix(in srgb, var(--color-black) 55%, transparent)",
  },
  loading: {
    backgroundColor: "var(--color-card)",
    boxShadow:
      "0 16px 40px color-mix(in srgb, var(--color-black) 50%, transparent)",
  },
};

const equalizerVariants = {
  playing: (index: number) => ({
    height: ["20%", "100%"],
    opacity: 1,
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut",
      delay: index * 0.1,
    },
  }),
  paused: {
    height: "20%",
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  loading: {
    height: "50%",
    opacity: 0.5,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const getRandomIndex = (current: number, total: number) => {
  if (total <= 1) return current;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * total);
  }
  return next;
};

const formatTime = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toggleTimeoutRef = useRef<number | null>(null);
  const trackHistoryRef = useRef<number[]>([]);
  const playerStateRef = useRef<PlayerState>("paused");
  const toastTimeoutRef = useRef<number | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>("paused");
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isVolumeHover, setIsVolumeHover] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentTrack = TRACKS[trackIndex] ?? TRACKS[0];
  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";

  const progressScale = useMemo(() => {
    if (!duration) return 0;
    return Math.min(currentTime / duration, 1);
  }, [currentTime, duration]);

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  }, [currentTime, duration]);

  const progressColor =
    playerState === "playing"
      ? "var(--color-primary-200)"
      : playerState === "loading"
        ? "var(--color-neutral-600)"
        : "var(--color-neutral-500)";

  const playButtonColor =
    playerState === "loading"
      ? "var(--color-neutral-600)"
      : "var(--color-primary-300)";

  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  const handleNextTrack = useCallback(() => {
    setTrackIndex((prevIndex) => {
      const nextIndex = isShuffle
        ? getRandomIndex(prevIndex, TRACKS.length)
        : (prevIndex + 1) % TRACKS.length;
      if (isShuffle) {
        trackHistoryRef.current.push(prevIndex);
      }
      return nextIndex;
    });
  }, [isShuffle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => setCurrentTime(audio.currentTime);
    const handleMetadata = () => setDuration(audio.duration || 0);
    const handleError = () => {
      handleNextTrack();
    };
    const handleEnded = () => {
      if (isRepeat) return;
      audio.currentTime = 0;
      setCurrentTime(0);
      handleNextTrack();
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [isRepeat, handleNextTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = isRepeat;
  }, [isRepeat]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playerState === "playing") {
      audio.play().catch(() => {});
    }
    if (playerState === "paused") {
      audio.pause();
    }
  }, [playerState]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    if (playerStateRef.current === "playing") {
      audio.play().catch(() => {});
    }
  }, [trackIndex]);

  useEffect(() => {
    return () => {
      if (toggleTimeoutRef.current) {
        window.clearTimeout(toggleTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayToggle = () => {
    if (isLoading) return;
    const nextState: PlayerState = isPlaying ? "paused" : "playing";
    setPlayerState("loading");
    toggleTimeoutRef.current = window.setTimeout(() => {
      setPlayerState(nextState);
    }, 500);
  };

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 1400);
  };

  const handlePrevTrack = useCallback(() => {
    if (isShuffle && trackHistoryRef.current.length > 0) {
      const previousIndex = trackHistoryRef.current.pop();
      if (previousIndex !== undefined) {
        setTrackIndex(previousIndex);
        return;
      }
    }
    setTrackIndex(
      (prevIndex) => (prevIndex - 1 + TRACKS.length) % TRACKS.length,
    );
  }, [isShuffle]);

  const handleShuffleToggle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next) {
        trackHistoryRef.current = [];
      }
      showToast(
        next
          ? "Shuffle aktif — lagu akan diputar secara acak."
          : "Shuffle nonaktif.",
      );
      return next;
    });
  };

  const handleRepeatToggle = () => {
    setIsRepeat((prev) => {
      const next = !prev;
      showToast(
        next
          ? "Repeat aktif — lagu akan diputar berulang."
          : "Repeat nonaktif.",
      );
      return next;
    });
  };

  const handleSeek = (value: number) => {
    if (!duration) return;
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Math.min((value / 100) * duration, duration);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="w-full max-w-125">
      <motion.div
        className="relative overflow-hidden rounded-[28px]   p-4 flex flex-col"
        variants={containerVariants}
        animate={playerState}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <AnimatePresence>
          {toastMessage ? (
            <motion.div
              key={toastMessage}
              className="pointer-events-none absolute left-1/2 top-1.5 -translate-x-1/2 rounded-[10px] border border-[color-mix(in_srgb,var(--color-white)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-neutral-950)_85%,transparent)] px-3.5 py-2 text-[12px] text-neutral-100 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-black)_45%,transparent)] z-50 text-center font-semibold"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {toastMessage}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="flex items-center gap-6">
          <motion.div
            id="album-art-div"
            className="flex h-30 w-30 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,var(--color-primary-200),var(--color-pink-600))] shadow-[0_12px_24px_color-mix(in_srgb,var(--color-black)_40%,transparent)]"
            animate={{
              scale:
                playerState === "playing"
                  ? 1
                  : playerState === "paused"
                    ? 0.95
                    : 0.9,
              rotate: playerState === "playing" ? 360 : 0,
              filter:
                playerState === "loading"
                  ? "brightness(0.65)"
                  : "brightness(1)",
            }}
            transition={{
              scale: { type: "spring", stiffness: 200, damping: 18 },
              rotate:
                playerState === "playing"
                  ? { duration: 20, repeat: Infinity, ease: "linear" }
                  : { duration: 0.3, ease: "easeOut" },
              filter: { duration: 0.3, ease: "easeOut" },
            }}
          >
            <Image
              src="/album-art.png"
              alt="Music icon"
              width={48}
              height={60}
            />
          </motion.div>

          <div className="flex flex-1 flex-col gap-1.25 justify-center">
            <h3 className="text-lg font-semibold text-neutral-100 leading-8">
              {currentTrack.title}
            </h3>
            <p className="text-sm leading-7 -tracking-[-0.03em] text-neutral-400 font-normal">
              {currentTrack.artist}
            </p>
          </div>
        </div>
        <div className="px-36 flex h-[32px] items-end gap-[4px]">
          {Array.from({ length: 5 }).map((_, index) => (
            <motion.span
              key={`bar-${index}`}
              className={`w-[8px] h-[6px] bg-[var(--color-primary-200)] ${
                isPlaying ? "rounded-full" : ""
              }`}
              variants={equalizerVariants}
              animate={playerState}
              custom={index}
              initial={false}
            />
          ))}
        </div>

        <div className="flex flex-col gap-5 mt-[20px]">
          <div className=" flex flex-col gap-5">
            <div className="relative h-[8px] w-full overflow-hidden rounded-full bg-[var(--color-neutral-800)]">
              <motion.div
                className="absolute inset-0 origin-left rounded-full"
                animate={{
                  scaleX: progressScale,
                  backgroundColor: progressColor,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progressPercent}
                onChange={(event) => handleSeek(Number(event.target.value))}
                aria-label="Seek"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className=" flex flex-row items-center justify-center gap-4">
            <button
              type="button"
              aria-pressed={isShuffle}
              onClick={handleShuffleToggle}
              className={`group flex h-[36px] w-[36px] cursor-pointer items-center justify-center transition duration-200 ease-out active:scale-95 ${
                isShuffle
                  ? "rounded-[8px] bg-[var(--color-neutral-800)]"
                  : "rounded-full"
              }`}
            >
              <Image
                src="/shuffle-button.svg"
                alt="Shuffle"
                width={36}
                height={36}
                className={`transition duration-200 ${
                  isShuffle ? "brightness-200" : "group-hover:brightness-200"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={handlePrevTrack}
              className="group flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full transition duration-200 ease-out active:scale-95"
            >
              <Image
                src="/previous-button.svg"
                alt="Previous"
                width={36}
                height={36}
                className="transition duration-200 group-hover:brightness-200"
              />
            </button>

            <motion.button
              type="button"
              aria-pressed={isPlaying}
              aria-busy={isLoading}
              onClick={handlePlayToggle}
              disabled={isLoading}
              className="flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-full transition duration-200 ease-out disabled:cursor-not-allowed"
              animate={{ backgroundColor: playButtonColor }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              whileHover={!isLoading ? { scale: 1.05 } : undefined}
              whileTap={!isLoading ? { scale: 0.95 } : undefined}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isPlaying ? (
                  <motion.span
                    key="pause-icon"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Image
                      src="/pause-button.svg"
                      alt="Pause"
                      width={24}
                      height={24}
                      className={isLoading ? "opacity-60" : "opacity-100"}
                    />
                  </motion.span>
                ) : (
                  <motion.span
                    key="play-icon"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Image
                      src="/play-button.svg"
                      alt="Play"
                      width={24}
                      height={24}
                      className={isLoading ? "opacity-60" : "opacity-100"}
                    />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              type="button"
              onClick={handleNextTrack}
              className="group flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full transition duration-200 ease-out active:scale-95"
            >
              <Image
                src="/next-button.svg"
                alt="Next"
                width={36}
                height={36}
                className="transition duration-200 group-hover:brightness-200"
              />
            </button>

            <button
              type="button"
              aria-pressed={isRepeat}
              onClick={handleRepeatToggle}
              className={`group flex h-[36px] w-[36px] cursor-pointer items-center justify-center transition duration-200 ease-out active:scale-95 ${
                isRepeat
                  ? "rounded-[8px] bg-[var(--color-neutral-800)]"
                  : "rounded-full"
              }`}
            >
              <Image
                src="/repeat-button.svg"
                alt="Repeat"
                width={36}
                height={36}
                className={`transition duration-200 ${
                  isRepeat ? "brightness-200" : "group-hover:brightness-200"
                }`}
              />
            </button>
          </div>

          <div className=" flex items-center gap-2">
            <Image
              src="/volume-icon.svg"
              alt="Volume"
              width={16}
              height={16}
              className="opacity-80"
            />
            <div
              className="relative h-[4px] flex-1 overflow-hidden rounded-full bg-[var(--color-neutral-800)]"
              onMouseEnter={() => setIsVolumeHover(true)}
              onMouseLeave={() => setIsVolumeHover(false)}
            >
              <motion.div
                className="absolute inset-0 origin-left rounded-full"
                animate={{
                  scaleX: volume,
                  backgroundColor: isVolumeHover
                    ? "var(--color-primary-200)"
                    : "var(--color-neutral-500)",
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Volume"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </div>
        </div>

        <audio ref={audioRef} src={currentTrack.src} preload="metadata" />
      </motion.div>
    </div>
  );
}
