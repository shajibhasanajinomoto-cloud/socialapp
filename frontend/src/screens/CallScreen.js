import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices } from "react-native-webrtc";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

// Free public STUN server for NAT traversal (works for most home/mobile networks;
// for production reliability across restrictive NATs, a TURN server would also be needed)
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function CallScreen({ route, navigation }) {
  // mode: "outgoing" (I'm calling) or "incoming" (I'm answering)
  const { otherUserId, otherUserName, callType, mode, incomingOffer } = route.params;
  const { socket } = useSocket();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(mode === "incoming" ? "Incoming call..." : "Calling...");
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const pcRef = useRef(null);

  useEffect(() => {
    setupCall();
    return () => cleanup();
  }, []);

  const setupCall = async () => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video" ? { facingMode: "user" } : false,
    });
    setLocalStream(stream);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setCallStatus("Connected");
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice_candidate", { targetId: otherUserId, candidate: event.candidate });
      }
    };

    if (mode === "outgoing") {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call_user", { receiverId: otherUserId, offer, callType });
    } else {
      await pc.setRemoteDescription(incomingOffer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer_call", { callerId: otherUserId, answer });
    }

    // Signaling event listeners
    socket.on("call_answered", async ({ answer }) => {
      await pc.setRemoteDescription(answer);
    });

    socket.on("ice_candidate", async ({ candidate }) => {
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        // Candidate arrived before remote description was set; safe to ignore occasionally
      }
    });

    socket.on("call_rejected", () => {
      setCallStatus("Call declined");
      setTimeout(() => navigation.goBack(), 1500);
    });

    socket.on("call_ended", () => {
      setCallStatus("Call ended");
      setTimeout(() => navigation.goBack(), 1000);
    });
  };

  const cleanup = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    socket.off("call_answered");
    socket.off("ice_candidate");
    socket.off("call_rejected");
    socket.off("call_ended");
  };

  const handleHangup = () => {
    socket.emit("end_call", { targetId: otherUserId });
    navigation.goBack();
  };

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = videoOff));
    setVideoOff(!videoOff);
  };

  return (
    <SafeAreaView style={styles.container}>
      {callType === "video" && remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
      ) : (
        <View style={styles.audioCallCenter}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{otherUserName?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.callerName}>{otherUserName}</Text>
          <Text style={styles.status}>{callStatus}</Text>
        </View>
      )}

      {callType === "video" && localStream && (
        <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" mirror />
      )}

      {callType === "video" && (
        <View style={styles.topOverlay}>
          <Text style={styles.callerNameSmall}>{otherUserName}</Text>
          <Text style={styles.statusSmall}>{callStatus}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
          <Text style={styles.controlIcon}>{muted ? "🔇" : "🎤"}</Text>
        </TouchableOpacity>

        {callType === "video" && (
          <TouchableOpacity style={styles.controlBtn} onPress={toggleVideo}>
            <Text style={styles.controlIcon}>{videoOff ? "📷🚫" : "📷"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.hangupBtn} onPress={handleHangup}>
          <Text style={styles.hangupIcon}>📞</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  audioCallCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatarInitial: { color: "#fff", fontSize: 48, fontWeight: "700" },
  callerName: { color: "#fff", fontSize: 22, fontWeight: "600" },
  status: { color: "#aaa", fontSize: 15, marginTop: 8 },
  remoteVideo: { flex: 1 },
  localVideo: {
    position: "absolute",
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  topOverlay: { position: "absolute", top: 60, left: 16 },
  callerNameSmall: { color: "#fff", fontSize: 16, fontWeight: "600" },
  statusSmall: { color: "#ddd", fontSize: 13 },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 16,
    gap: 24,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlIcon: { fontSize: 24 },
  hangupBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "135deg" }],
  },
  hangupIcon: { fontSize: 28 },
});
