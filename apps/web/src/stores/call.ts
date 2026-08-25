import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import SimplePeer from 'simple-peer';
import type { Instance as PeerInstance, SignalData } from 'simple-peer';
import {
  WS_EVENTS,
  type CallInvitePayload,
  type CallActionPayload,
  type CallSignalPayload,
  type CallPhase,
} from '@arazchat/shared';
import { getSocket, connectSocket } from '@/lib/socket';

type PeerCtor = typeof SimplePeer;
const Peer = SimplePeer as PeerCtor;

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useCallStore = defineStore('call', () => {
  const phase = ref<CallPhase>('idle');
  const callId = ref<string | null>(null);
  const chatId = ref<string | null>(null);
  const peerName = ref('');
  const peerUserId = ref<string | null>(null);
  const muted = ref(false);
  const error = ref<string | null>(null);
  const startedAt = ref<number | null>(null);

  const peer = shallowRef<PeerInstance | null>(null);
  const localStream = shallowRef<MediaStream | null>(null);
  const remoteStream = shallowRef<MediaStream | null>(null);
  const pendingSignals = ref<unknown[]>([]);
  let listening = false;

  const isOpen = computed(() => phase.value !== 'idle' && phase.value !== 'ended');

  function reset() {
    peer.value?.destroy();
    peer.value = null;
    localStream.value?.getTracks().forEach((t) => t.stop());
    localStream.value = null;
    remoteStream.value = null;
    pendingSignals.value = [];
    callId.value = null;
    chatId.value = null;
    peerName.value = '';
    peerUserId.value = null;
    muted.value = false;
    error.value = null;
    startedAt.value = null;
    phase.value = 'idle';
  }

  async function getMic(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
    localStream.value = stream;
    return stream;
  }

  function createPeer(initiator: boolean, stream: MediaStream) {
    const p = new Peer({
      initiator,
      trickle: true,
      stream,
      config: ICE_CONFIG,
    });

    p.on('signal', (data) => {
      if (!callId.value) return;
      getSocket().emit(WS_EVENTS.CALL_SIGNAL, {
        callId: callId.value,
        signal: data,
      });
    });

    p.on('stream', (streamRemote) => {
      remoteStream.value = streamRemote;
      phase.value = 'active';
      startedAt.value = Date.now();
    });

    p.on('connect', () => {
      phase.value = 'active';
      startedAt.value ??= Date.now();
    });

    p.on('error', (err) => {
      hangup(false);
      error.value = err.message || 'Call error';
    });

    p.on('close', () => {
      if (phase.value !== 'idle') hangup(false);
    });

    peer.value = p;
    for (const sig of pendingSignals.value) {
      try {
        p.signal(sig as SignalData);
      } catch {
        /* ignore stale */
      }
    }
    pendingSignals.value = [];
  }

  function applySignal(signal: unknown) {
    if (peer.value) {
      try {
        peer.value.signal(signal as SignalData);
      } catch {
        /* ignore */
      }
    } else {
      pendingSignals.value.push(signal);
    }
  }

  async function startOutgoing(targetChatId: string, name: string) {
    if (phase.value !== 'idle') return;
    error.value = null;
    try {
      await getMic();
    } catch {
      error.value = 'mic';
      return;
    }

    const id = crypto.randomUUID();
    callId.value = id;
    chatId.value = targetChatId;
    peerName.value = name;
    phase.value = 'outgoing';

    connectSocket();
    getSocket().emit(WS_EVENTS.CALL_INVITE, { callId: id, chatId: targetChatId });
  }

  async function accept() {
    if (phase.value !== 'incoming' || !callId.value) return;
    try {
      const stream = localStream.value ?? (await getMic());
      phase.value = 'connecting';
      getSocket().emit(WS_EVENTS.CALL_ACCEPT, { callId: callId.value });
      createPeer(false, stream);
    } catch {
      error.value = 'mic';
      reject();
    }
  }

  function reject() {
    if (!callId.value) {
      reset();
      return;
    }
    getSocket().emit(WS_EVENTS.CALL_REJECT, { callId: callId.value });
    reset();
  }

  function hangup(notify = true) {
    if (notify && callId.value && phase.value !== 'idle') {
      getSocket().emit(WS_EVENTS.CALL_END, { callId: callId.value });
    }
    reset();
  }

  function toggleMute() {
    muted.value = !muted.value;
    localStream.value?.getAudioTracks().forEach((t) => {
      t.enabled = !muted.value;
    });
  }

  function bindSocket() {
    if (listening) return;
    listening = true;
    const s = connectSocket();

    s.on(WS_EVENTS.CALL_INVITE, (payload: CallInvitePayload) => {
      if (phase.value !== 'idle') {
        s.emit(WS_EVENTS.CALL_REJECT, { callId: payload.callId });
        return;
      }
      callId.value = payload.callId;
      chatId.value = payload.chatId;
      peerUserId.value = payload.fromUserId;
      peerName.value = payload.fromDisplayName;
      phase.value = 'incoming';
    });

    s.on(WS_EVENTS.CALL_ACCEPT, async (payload: CallActionPayload) => {
      if (payload.callId !== callId.value || phase.value !== 'outgoing') return;
      phase.value = 'connecting';
      try {
        const stream = localStream.value ?? (await getMic());
        createPeer(true, stream);
      } catch {
        error.value = 'mic';
        hangup();
      }
    });

    s.on(WS_EVENTS.CALL_REJECT, (payload: CallActionPayload) => {
      if (payload.callId !== callId.value) return;
      reset();
      error.value = 'rejected';
    });

    s.on(WS_EVENTS.CALL_END, (payload: CallActionPayload) => {
      if (payload.callId !== callId.value) return;
      reset();
    });

    s.on(WS_EVENTS.CALL_BUSY, () => {
      reset();
      error.value = 'busy';
    });

    s.on(WS_EVENTS.CALL_SIGNAL, (payload: CallSignalPayload) => {
      if (payload.callId !== callId.value) return;
      applySignal(payload.signal);
    });
  }

  return {
    phase,
    callId,
    chatId,
    peerName,
    peerUserId,
    muted,
    error,
    startedAt,
    remoteStream,
    isOpen,
    startOutgoing,
    accept,
    reject,
    hangup,
    toggleMute,
    bindSocket,
    reset,
  };
});
