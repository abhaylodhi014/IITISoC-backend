import { v4 as uuid } from "uuid";

const rooms = new Map();
const peers = new Map();

export function createRoom(router) {
  const id = uuid();
  rooms.set(id, { router, peers: new Map() });
  
  return id;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function addPeer(roomId, peerId, peerInfo, peerName) {
  const room = getRoom(roomId);
  peers.set(peerId,peerName);
  room.peers.set(peerId, peerInfo);
}

export function getPeer(roomId, peerId) {
  return getRoom(roomId)?.peers.get(peerId);
}
export function getPeerName(peerId) {
  return peers.get(peerId);
}

export function cleanupPeer(roomId, peerId) {
  const room = getRoom(roomId);
  if (!room) return;

  const peer = getPeer(roomId, peerId);
  if (!peer) return;

  // Cleanup
  peer.producers?.forEach((p) => p.close());
  peer.consumers?.forEach((c) => c.close());
  peer.sendTransport?.close();
  peer.recvTransport?.close();

  room.peers.delete(peerId);

  for (const [otherId, otherPeer] of room.peers) {
    otherPeer.ws.send(JSON.stringify({
      type: "peerLeft",
      data: { peerId },
    }));
  }

  console.log(`Peer ${peerId} left and cleaned up from room ${roomId}`);

  // if (room.peers.size === 0) {
  //   deleteRoom(roomId);
  // }
  
}


export function deleteRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  // Close router
  room.router.close();

  rooms.delete(roomId);
  console.log(`🧹 Room ${roomId} deleted`);
}