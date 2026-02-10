"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PlayerState = "playing" | "paused" | "loading";

const TRACKS = [
  {
    title: "Awesome Song Title",
    artist: "Amazing Artist",
    src: "/music/background-music.mp3",
  },
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
    backgroundColor: "var(--color-neutral-900)",
    boxShadow:
      "0 25px 60px color-mix(in srgb, var(--color-primary-300) 45%, transparent)",
  },
  paused: {
    backgroundColor: "var(--color-neutral-900)",
    boxShadow:
      "0 20px 50px color-mix(in srgb, var(--color-black) 55%, transparent)",
  },
  loading: {
    backgroundColor: "var(--color-neutral-900)",
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

  const [playerState, setPlayerState] = useState<PlayerState>("paused");
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isVolumeHover, setIsVolumeHover] = useState(false);

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
        ? "var(--color-neutral-500)"
        : "var(--color-neutral-600)";

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
    <div className="w-full max-w-[500px]">
      <motion.div
        className="relative overflow-hidden rounded-[28px] border border-[var(--color-neutral-800)] p-[28px]"
        variants={containerVariants}
        animate={playerState}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-start gap-[20px]">
          <motion.div
            className="flex h-[88px] w-[88px] items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,var(--color-primary-200),var(--color-pink-600))] shadow-[0_12px_24px_color-mix(in_srgb,var(--color-black)_40%,transparent)]"
            animate={{
              scale:
                playerState === "playing"
                  ? 1
                  : playerState === "paused"
                    ? 0.95
                    : 0.9,
              rotate: playerState === "playing" ? 360 : 0,
            }}
            transition={{
              scale: { type: "spring", stiffness: 200, damping: 18 },
              rotate:
                playerState === "playing"
                  ? { duration: 20, repeat: Infinity, ease: "linear" }
                  : { duration: 0.3, ease: "easeOut" },
            }}
          >
            <Image
              src="/album-art.png"
              alt="Music icon"
              width={40}
              height={40}
              className="opacity-80"
            />
          </motion.div>

          <div className="flex flex-1 flex-col gap-[6px]">
            <div className="space-y-[4px]">
              <h3 className="text-[18px] font-semibold text-[var(--color-neutral-25)]">
                {currentTrack.title}
              </h3>
              <p className="text-[14px] text-[var(--color-neutral-400)]">
                {currentTrack.artist}
              </p>
            </div>

            <div className="mt-[8px] flex h-[28px] items-end gap-[6px]">
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.span
                  key={`bar-${index}`}
                  className={`w-[6px] bg-[var(--color-primary-200)] ${
                    isPlaying ? "rounded-full" : "rounded-[2px]"
                  }`}
                  variants={equalizerVariants}
                  animate={playerState}
                  custom={index}
                  initial={false}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[20px] space-y-[10px]">
          <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-[var(--color-neutral-800)]">
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
          <div className="flex items-center justify-between text-[12px] text-[var(--color-neutral-500)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-[18px] flex items-center justify-center gap-[18px]">
          <button
            type="button"
            aria-pressed={isShuffle}
            onClick={handleShuffleToggle}
            className={`group flex h-[56px] w-[56px] cursor-pointer items-center justify-center transition duration-200 ease-out active:scale-95 ${
              isShuffle
                ? "rounded-[8px] bg-[var(--color-neutral-800)]"
                : "rounded-full"
            }`}
          >
            <Image
              src="/shuffle-button.svg"
              alt="Shuffle"
              width={28}
              height={28}
              className={`transition duration-200 ${
                isShuffle ? "brightness-200" : "group-hover:brightness-200"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handlePrevTrack}
            className="group flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-full transition duration-200 ease-out active:scale-95"
          >
            <Image
              src="/previous-button.svg"
              alt="Previous"
              width={28}
              height={28}
              className="transition duration-200 group-hover:brightness-200"
            />
          </button>

          <motion.button
            type="button"
            aria-pressed={isPlaying}
            aria-busy={isLoading}
            onClick={handlePlayToggle}
            disabled={isLoading}
            className="flex h-[68px] w-[68px] cursor-pointer items-center justify-center rounded-full transition duration-200 ease-out disabled:cursor-not-allowed"
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
            className="group flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-full transition duration-200 ease-out active:scale-95"
          >
            <Image
              src="/next-button.svg"
              alt="Next"
              width={28}
              height={28}
              className="transition duration-200 group-hover:brightness-200"
            />
          </button>

          <button
            type="button"
            aria-pressed={isRepeat}
            onClick={() => setIsRepeat((prev) => !prev)}
            className={`group flex h-[56px] w-[56px] cursor-pointer items-center justify-center transition duration-200 ease-out active:scale-95 ${
              isRepeat
                ? "rounded-[8px] bg-[var(--color-neutral-800)]"
                : "rounded-full"
            }`}
          >
            <Image
              src="/repeat-button.svg"
              alt="Repeat"
              width={28}
              height={28}
              className={`transition duration-200 ${
                isRepeat ? "brightness-200" : "group-hover:brightness-200"
              }`}
            />
          </button>
        </div>

        <div className="mt-[18px] flex items-center gap-[12px]">
          <Image
            src="/volume-icon.svg"
            alt="Volume"
            width={18}
            height={18}
            className="opacity-80"
          />
          <div
            className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--color-neutral-800)]"
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

        <audio ref={audioRef} src={currentTrack.src} preload="metadata" />
      </motion.div>
    </div>
  );
}
