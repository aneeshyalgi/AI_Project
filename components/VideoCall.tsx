'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

interface VideoCallProps {
  roomId: string;
  isAgent: boolean;
}

export default function VideoCall({ roomId, isAgent }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConn, setPeerConn] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || 'https://swisscom-genai-server.onrender.com';
    const sock = io(signalingUrl);
    setSocket(sock);
    console.log('Socket initialized (this side):', sock.id);

    // Getting local media
    async function getLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        return stream;
      } catch (err) {
        console.error('Error getting user media:', err);
        return null;
      }
    }

    // RTCPeerConnection setup
    const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    const pc = new RTCPeerConnection({ iceServers });
    setPeerConn(pc);

    let localStream: MediaStream | null = null;
    getLocalStream().then((stream) => {
      if (stream) {
        localStream = stream;
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }
    });

    // --- Remote Stream Handling ---
    const remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // Prevent duplicate tracks
    const trackIds = new Set<string>();
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (!trackIds.has(track.id)) {
          remoteStream.addTrack(track);
          trackIds.add(track.id);
        }
      });
    };

    // ICE candidate handling
    const otherPeerIdRef = { current: '' };
    pc.onicecandidate = (event) => {
      if (event.candidate && sock && otherPeerIdRef.current) {
        sock.emit('webrtc-ice-candidate', {
          roomId,
          candidate: event.candidate,
          toPeerId: otherPeerIdRef.current,
        });
      }
    };

    // --- Enhanced Peer Discovery Logic ---
    let hasInitiatedOffer = false;

    sock.on('connect', () => {
      sock.emit('join-room', roomId);
      // Ask for current peers in the room
      sock.emit('get-peers-in-room', { roomId });
    });

    // Listen for the list of peers in the room
    sock.on('peers-in-room', ({ peers }: { peers: string[] }) => {
      // Remove self from the list
      const otherPeers = peers.filter((id) => id !== sock.id);
      if (otherPeers.length > 0) {
        // There is already a peer in the room, initiate offer
        otherPeerIdRef.current = otherPeers[0];
        if (!hasInitiatedOffer) {
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer).then(() => offer))
            .then((offer) => {
              sock.emit('webrtc-offer', { roomId, offer, toPeerId: otherPeerIdRef.current });
              hasInitiatedOffer = true;
            })
            .catch((err) => console.error('Error creating offer:', err));
        }
      }
    });

    sock.on('peer-joined', ({ peerId }: { peerId: string }) => {
      otherPeerIdRef.current = peerId;
      // If you are the second peer, you will have already received the peer list and initiated the offer
    });

    sock.on('webrtc-offer', async ({ fromPeerId, offer }) => {
      otherPeerIdRef.current = fromPeerId;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sock.emit('webrtc-answer', { roomId, answer, toPeerId: fromPeerId });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    sock.on('webrtc-answer', async ({ fromPeerId, answer }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error setting remote description with answer:', err);
      }
    });

    sock.on('webrtc-ice-candidate', async ({ fromPeerId, candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    sock.on('peer-left', ({ peerId }) => {
      console.log('Peer left:', peerId);
    });

    pc.onconnectionstatechange = () => {
      console.log('PeerConnection state:', pc.connectionState);
    };

    return () => {
      pc.close();
      sock.disconnect();
    };
  }, [roomId, isAgent]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Local Video</h2>
        <video ref={localVideoRef} autoPlay muted playsInline className="w-80 h-60 bg-black" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Remote Video</h2>
        <video ref={remoteVideoRef} autoPlay playsInline className="w-80 h-60 bg-black" />
      </div>
    </div>
  );
}
