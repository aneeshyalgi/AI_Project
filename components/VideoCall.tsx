// components/VideoCall.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

interface VideoCallProps {
  roomId: string;   // Unique string to identify this 1:1 call
  isAgent: boolean; // true if this side is the agent; false if user
}

export default function VideoCall({ roomId, isAgent }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConn, setPeerConn] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const signalingUrl =
      process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:4000';
    const sock = io(signalingUrl);
    setSocket(sock);
    console.log('Socket initialized (this side):', sock.id);

    // 1. Get local media (video + audio)
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

    // 2. Create RTCPeerConnection
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN servers here if needed
    ];
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

    // 3. Prepare remote MediaStream and attach to <video>
    const remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    // 4. ICE-candidate handler: send to peer
    const otherPeerIdRef = { current: '' };
    pc.onicecandidate = (event) => {
      if (event.candidate && sock) {
        console.log('Sending ICE candidate to:', otherPeerIdRef.current);
        sock.emit('webrtc-ice-candidate', {
          roomId,
          candidate: event.candidate,
          toPeerId: otherPeerIdRef.current,
        });
      }
    };

    // 5. Socket.io handlers
    sock.on('connect', () => {
      console.log('Socket connected, emitting join-room:', roomId);
      sock.emit('join-room', roomId);
    });

    sock.on('peer-joined', ({ peerId }: { peerId: string }) => {
      console.log('Peer joined this room:', peerId);
      otherPeerIdRef.current = peerId;

      // If this side is the “user” (initiator) and not the agent, create offer
      if (!isAgent) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) => {
            if (otherPeerIdRef.current) {
              console.log('Sending offer to:', otherPeerIdRef.current);
              sock.emit('webrtc-offer', {
                roomId,
                offer,
                toPeerId: otherPeerIdRef.current,
              });
            }
          })
          .catch((err) => console.error('Error creating offer:', err));
      }
    });

    sock.on(
      'webrtc-offer',
      async ({
        fromPeerId,
        offer,
      }: {
        fromPeerId: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        console.log('Received offer from peer:', fromPeerId, offer);
        otherPeerIdRef.current = fromPeerId;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('Sending answer to:', fromPeerId);
          sock.emit('webrtc-answer', {
            roomId,
            answer,
            toPeerId: fromPeerId,
          });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      }
    );

    sock.on(
      'webrtc-answer',
      async ({
        fromPeerId,
        answer,
      }: {
        fromPeerId: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        console.log('Received answer from peer:', fromPeerId, answer);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote description with answer:', err);
        }
      }
    );

    sock.on(
      'webrtc-ice-candidate',
      async ({
        fromPeerId,
        candidate,
      }: {
        fromPeerId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        console.log('Received ICE candidate from peer:', fromPeerId);
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding received ICE candidate:', err);
        }
      }
    );

    sock.on('peer-left', ({ peerId }: { peerId: string }) => {
      console.log('Peer left:', peerId);
      // Optionally clear remote tracks:
      // remoteStream.getTracks().forEach((t) => remoteStream.removeTrack(t));
    });

    // 6. Connection state logging
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
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-80 h-60 bg-black"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold">Remote Video</h2>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-80 h-60 bg-black"
        />
      </div>
    </div>
  );
}
