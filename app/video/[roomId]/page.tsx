// app/video/[roomId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import VideoCall from '@/components/VideoCall';

export default function UserVideoPage() {
  const params = useParams();
  const roomId = params?.roomId as string | undefined;

  if (!roomId) {
    return <p>Loading…</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        User Video Call (Room: {roomId})
      </h1>
      <VideoCall roomId={roomId} isAgent={false} />
    </div>
  );
}
