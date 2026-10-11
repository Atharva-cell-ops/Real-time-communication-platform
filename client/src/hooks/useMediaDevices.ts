import { useState, useEffect, useCallback } from 'react';

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export const useMediaDevices = () => {
  const [audioInputs, setAudioInputs] = useState<DeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<DeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');

  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;

      const devices = await navigator.mediaDevices.enumerateDevices();

      const aInputs: DeviceInfo[] = [];
      const vInputs: DeviceInfo[] = [];
      const aOutputs: DeviceInfo[] = [];

      devices.forEach((device) => {
        const item: DeviceInfo = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} (${device.deviceId.slice(0, 5)})`,
          kind: device.kind,
        };

        if (device.kind === 'audioinput') aInputs.push(item);
        else if (device.kind === 'videoinput') vInputs.push(item);
        else if (device.kind === 'audiooutput') aOutputs.push(item);
      });

      setAudioInputs(aInputs);
      setVideoInputs(vInputs);
      setAudioOutputs(aOutputs);

      if (aInputs.length > 0 && !selectedAudioInput) setSelectedAudioInput(aInputs[0].deviceId);
      if (vInputs.length > 0 && !selectedVideoInput) setSelectedVideoInput(vInputs[0].deviceId);
      if (aOutputs.length > 0 && !selectedAudioOutput) setSelectedAudioOutput(aOutputs[0].deviceId);
    } catch (err) {
      console.warn('[enumerateDevices Error]:', err);
    }
  }, [selectedAudioInput, selectedVideoInput, selectedAudioOutput]);

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices);

    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices);
    };
  }, [enumerateDevices]);

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    setSelectedAudioOutput,
    refreshDevices: enumerateDevices,
  };
};
