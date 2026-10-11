import React, { useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { Mic, Video, Volume2, CheckCircle2 } from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';

export interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    setSelectedAudioOutput,
  } = useMediaDevices();

  const { initMedia, localStream } = useWebRTC();
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen]);

  const handleApplyChanges = async () => {
    await initMedia(selectedAudioInput, selectedVideoInput);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audio & Video Settings" maxWidth="lg">
      <div className="space-y-6">
        {/* Camera Preview */}
        <div className="w-full aspect-video rounded-xl bg-dark-950 border border-dark-800 overflow-hidden relative flex items-center justify-center">
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute bottom-2 left-2 bg-dark-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-300 border border-white/10">
            Camera Preview
          </div>
        </div>

        {/* Device Selectors */}
        <div className="space-y-4">
          {/* Microphone Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Mic className="w-4 h-4 text-brand-400" />
              Microphone
            </label>
            <select
              value={selectedAudioInput}
              onChange={(e) => setSelectedAudioInput(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Video className="w-4 h-4 text-brand-400" />
              Camera
            </label>
            <select
              value={selectedVideoInput}
              onChange={(e) => setSelectedVideoInput(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera (${d.deviceId.slice(0, 5)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Speakers Selector (if supported) */}
          {audioOutputs.length > 0 && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Volume2 className="w-4 h-4 text-brand-400" />
                Speakers / Output
              </label>
              <select
                value={selectedAudioOutput}
                onChange={(e) => setSelectedAudioOutput(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {audioOutputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Speaker (${d.deviceId.slice(0, 5)})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApplyChanges} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
