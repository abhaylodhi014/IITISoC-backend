import { mediaCodecs } from "./mediasoup-config.js";
import { createRoom, getRoom, addPeer, getPeer, getPeerName, cleanupPeer } from "./rooms.js";

export default async function handleWebSocketConnection(ws, worker) {
  let currentPeerId = null;
  let roomId = null;

  ws.on("message", async (message) => {
    const msg = JSON.parse(message);
    const { type, data } = msg;
    const peerId = data?.peerId;

    console.log("Received message:", type, data);
    if (!peerId && type !== "createRoom") return; // Require peerId for all except createRoom
    currentPeerId = peerId || currentPeerId;

    if (type === "emotion_update") {

      if (!roomId) return;

      const room = getRoom(roomId);
      if (!room) return;

      const { emotion, confidence, landmarks, isOverlayOn } = data;
      for (const [otherId, otherPeer] of room.peers) {
        if (otherId !== peerId && otherPeer.ws.readyState === ws.OPEN) {
          otherPeer.ws.send(JSON.stringify({
            type: "emotion_update",
            data: {
              userId: peerId,
              emotion,
              confidence,
              landmarks,
              isOverlayOn
            },
          }));
        }
      }
    }

    if (type === "createRoom") {
      const router = await worker.createRouter({ mediaCodecs });
      roomId = createRoom(router);
      ws.send(JSON.stringify({ type: "roomCreated", data: { roomId } }));
    }

    if (type === "joinRoom") {
      roomId = data.roomId;
      console.log(`👥 Peer ${data.peerName} joined room ${roomId}`);
      const room = getRoom(roomId);
      if (!room) return ws.send(JSON.stringify({ type: "error", data: "Room not found" }));

      addPeer(roomId, peerId, { ws }, data.peerName);

      const existingProducers = [];
      for (const [otherId, otherPeer] of room.peers) {
        if (otherId !== peerId && otherPeer.producers) {
          for (const p of otherPeer.producers) {
            existingProducers.push({ producerId: p.id, peerId: otherId });
          }
        }
      }

      ws.send(JSON.stringify({
        type: "joinedRoom",
        data: {
          rtpCapabilities: room.router.rtpCapabilities,
          producers: existingProducers,
        },
      }));
    }

    if (type === "leaveRoom") {
      cleanupPeer(roomId, peerId);
    }

    if (type === "createSendTransport") {
      const room = getRoom(roomId);
      const transport = await room.router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: "127.0.0.1" }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });
      transport.on("dtlsstatechange", (state) => state === "closed" && transport.close());
      getPeer(roomId, peerId).sendTransport = transport;
      ws.send(
        JSON.stringify({
          type: "sendTransportCreated",
          data: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        })
      );
    }

    if (type === "connectSendTransport") {
      await getPeer(roomId, peerId).sendTransport.connect({ dtlsParameters: data.dtlsParameters });
    }

    if (type === "produce") {
      const { kind, rtpParameters } = data;
      const peer = getPeer(roomId, peerId);
      const producer = await peer.sendTransport.produce({ kind, rtpParameters });

      peer.producers = peer.producers || [];
      peer.producers.push(producer);

      ws.send(JSON.stringify({ type: "produced", data: { id: producer.id } }));

      const room = getRoom(roomId);
      for (const [otherId, otherPeer] of room.peers) {
        if (otherId !== peerId) {
          otherPeer.ws.send(JSON.stringify({
            type: "newProducer",
            data: { producerId: producer.id, peerId },
          }));
        }
      }
      console.log(`📡 Notifying peers of new producer ${producer.id} from ${peerId}`);
    }

    if (type === "producerClosed") {
      const { producerId } = data;
      const room = getRoom(roomId);
      const peer = getPeer(roomId, peerId);
      if (!room || !peer || !peer.producers) return;

      const producer = peer.producers.find((p) => p.id === producerId);
      if (producer) {
        producer.close(); 
        peer.producers = peer.producers.filter((p) => p.id !== producerId);

        console.log(`🧹 Manually closed producer ${producerId} from ${peerId}`);

        for (const [otherId, otherPeer] of room.peers) {
          if (otherId !== peerId && otherPeer.ws.readyState === ws.OPEN) {
            otherPeer.ws.send(
              JSON.stringify({
                type: "producerClosed",
                data: {
                  producerId,
                  peerId,
                },
              })
            );
          }
        }
      }
    }

    if (type === "createRecvTransport") {
      const room = getRoom(roomId);
      const transport = await room.router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: "127.0.0.1" }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });
      getPeer(roomId, peerId).recvTransport = transport;
      ws.send(
        JSON.stringify({
          type: "recvTransportCreated",
          data: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        })
      );
    }

    if (type === "connectRecvTransport") {
      await getPeer(roomId, peerId).recvTransport.connect({ dtlsParameters: data.dtlsParameters });
    }

    if (type === "consume") {
      const { rtpCapabilities, producerId } = data;
      console.log(`👂 Peer ${peerId} requesting to consume producer ${producerId}`);
      const room = getRoom(roomId);
      const peer = getPeer(roomId, peerId);
      const consumers = [];
      if (!room || !peer || !peer.recvTransport) return;

      const allProducers = [];
      for (const [id, otherPeer] of room.peers) {
        if (id !== peerId && otherPeer.producers) {
          allProducers.push(...otherPeer.producers.map((p) => ({ producer: p, peerId: id, producerPeerName: getPeerName(peerId) })));
        }
      }

      const targetProducers = producerId
        ? allProducers.filter(({ producer }) => producer.id === producerId)
        : allProducers;

      for (const { producer, peerId: producerPeerId, producerPeerName } of targetProducers) {
        try {
          const consumer = await peer.recvTransport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: false,
          });

          peer.consumers = peer.consumers || [];
          peer.consumers.push(consumer);

          consumers.push({
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            peerId: producerPeerId,
            peerName: producerPeerName
          });
        } catch (err) {
          console.error("Failed to consume:", err);
        }
      }
      console.log(`✅ Consumers created for ${peerId}:`, consumers.map(c => c.id));
      ws.send(JSON.stringify({ type: "consumersCreated", data: consumers }));
    }

  });

  ws.on("close", () => cleanupPeer(roomId, currentPeerId));
}