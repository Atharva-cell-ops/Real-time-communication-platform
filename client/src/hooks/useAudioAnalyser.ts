import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const useAudioAnalyser = (stream: MediaStream | null, isMuted: boolean) => {
  const { socket } = useSocket();
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!stream || isMuted) {
      setAudioLevel(0);
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        socket?.emit('presence:speaking', { isSpeaking: false });
      }
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setAudioLevel(0);
      return;
    }

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      microphone = audioCtx.createMediaStreamSource(stream);
      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (!analyser) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);

        const speakingNow = normalized > 15;
        if (speakingNow !== isSpeakingRef.current) {
          isSpeakingRef.current = speakingNow;
          setIsSpeaking(speakingNow);
          socket?.emit('presence:speaking', { isSpeaking: speakingNow });
        }

        animationFrameId = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (err) {
      console.warn('[AudioAnalyser] AudioContext initialization skipped:', err);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (microphone) microphone.disconnect();
      if (analyser) analyser.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();

      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        socket?.emit('presence:speaking', { isSpeaking: false });
      }
    };
  }, [stream, isMuted, socket]);

  return { audioLevel, isSpeaking };
};
