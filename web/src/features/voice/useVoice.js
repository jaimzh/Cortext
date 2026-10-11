import { useEffect, useRef, useState } from 'react';

const defaults = [
  { name: 'tiny', label: 'Tiny', description: 'fastest', installed: true },
  { name: 'base', label: 'Base', description: 'balanced', installed: true },
  { name: 'small', label: 'Small', description: 'more accurate', installed: true },
  { name: 'medium', label: 'Medium', description: 'slowest', installed: true },
];

export function useVoice(api, report) {
  const [models, setModels] = useState(defaults);
  const [model, setModel] = useState('base');
  const [paste, setPaste] = useState(true);
  const [phase, setPhase] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const phaseRef = useRef('idle');
  const recorder = useRef(null);
  const stream = useRef(null);
  const mounted = useRef(false);

  function updatePhase(next) {
    phaseRef.current = next;
    setPhase(next);
  }

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    api
      .loadModels()
      .then((data) => {
        if (cancelled || !data) return;
        setModels(data.models);
        const installed = data.models.filter((item) => item.installed);
        setModel(
          installed.find((item) => item.name === data.default)?.name || installed[0]?.name || '',
        );
      })
      .catch((error) => {
        if (!cancelled) report('Could not load models.', error.message);
      });
    return () => {
      cancelled = true;
      mounted.current = false;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, [api, report]);

  async function toggleRecording() {
    if (phaseRef.current === 'recording') {
      updatePhase('uploading');
      recorder.current.stop();
      return;
    }
    if (phaseRef.current !== 'idle') return;
    updatePhase('requesting');
    let input;
    try {
      input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        input.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = input;
      const chunks = [];
      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : undefined;
      const recording = new MediaRecorder(input, options);
      recorder.current = recording;
      recording.addEventListener('dataavailable', (event) => {
        if (event.data.size) chunks.push(event.data);
      });
      recording.addEventListener('stop', async () => {
        input.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        updatePhase('uploading');
        report('Uploading and transcribing...');
        try {
          const blob = new Blob(chunks, { type: recording.mimeType || 'audio/webm' });
          const data = await api.uploadAudio(blob, { paste, model });
          if (mounted.current) {
            setTranscript(typeof data.text === 'string' ? data.text : '');
            report(data.message || 'Done', data.text || '');
          }
        } catch (error) {
          if (mounted.current) report('Something went wrong.', error.message);
        } finally {
          if (mounted.current) updatePhase('idle');
        }
      });
      recording.start();
      updatePhase('recording');
      report('Recording...');
    } catch (error) {
      input?.getTracks().forEach((track) => track.stop());
      if (mounted.current) {
        updatePhase('idle');
        report('Microphone access failed.', error.message);
      }
    }
  }

  return { models, model, setModel, paste, setPaste, phase, transcript, toggleRecording };
}
