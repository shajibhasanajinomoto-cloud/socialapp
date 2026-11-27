import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, RTCView, mediaDevices } from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

// Set to true only when you need to debug call connection problems.
const SHOW_DEBUG = false;

// iceTransportPolicy: "relay" forces ALL call traffic through a TURN relay
// server instead of attempting a direct connection first. This trades a
// small amount of latency for maximum reliability — it removes any
// dependency on the two phones' networks/firewalls being able to reach each
// other directly, which is the most common reason mobile calls silently
// fail to deliver audio/video despite "connecting" successfully.
const ICE_SERVERS = {
  iceTransportPolicy: "relay",
  iceServers: [
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function CallScreen({ route, navigation }) {
  const { otherUserId, otherUserName, callType, mode, incomingOffer } = route.params;
  const { socket } = useSocket();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(mode === "incoming" ? "Incoming call..." : "Calling...");
  const [debugLog, setDebugLog] = useState([]);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  const pcRef = useRef(null);
  const pendingCandidates = useRef([]);
  const remoteDescriptionSet = useRef(false);

  const log = (msg) => {
    console.log("[CALL DEBUG]", msg);
    setDebugLog((prev) => [...prev.slice(-7), msg]);
  };

  useEffect(() => {
    setupCall();
    return () => cleanup();
  }, []);

  const setupCall = async () => {
    try {
      log("Socket: " + (socket && socket.connected ? "connected " + socket.id : "NOT CONNECTED"));
      if (!socket || !socket.connected) {
        Alert.alert("Connection issue", "Not connected to server. Check your internet and try again.");
      }

      InCallManager.start({ media: callType === "video" ? "video" : "audio", auto: true });
      InCallManager.setForceSpeakerphoneOn(true);
      log("InCallManager started (auto mode, speaker forced ON)");

      // Some Android devices ignore the speaker request made before the audio
      // session is fully live; re-asserting it a moment later is a commonly
      // needed workaround for calls that connect but stay silent.
      setTimeout(() => {
        InCallManager.setForceSpeakerphoneOn(true);
        log("Re-asserted speaker ON (delayed)");
      }, 1500);

      log("Requesting camera/mic...");
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video" ? { facingMode: "user" } : false,
      });
      log("Got local stream: " + stream.getTracks().map((t) => t.kind + ":" + t.enabled).join(", "));
      setLocalStream(stream);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      log("PeerConnection created (relay-only mode)");

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      log("Local tracks added to connection");

      pc.ontrack = (event) => {
        const t = event.track;
        log(">>> REMOTE " + t.kind + " arrived | enabled:" + t.enabled + " muted:" + t.muted + " readyState:" + t.readyState);
        setRemoteStream(event.streams[0]);
        setCallStatus("Connected");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          log("Sending candidate: " + event.candidate.type);
          socket.emit("ice_candidate", { targetId: otherUserId, candidate: event.candidate });
        } else {
          log("ICE gathering finished");
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        log("ICE state -> " + state);
        if (state === "checking") setCallStatus("Connecting...");
        if (state === "connected" || state === "completed") setCallStatus("Connected");
        if (state === "failed") {
          setCallStatus("Connection failed");
          Alert.alert(
            "Call failed",
            "Could not connect the call. Please check your internet and try again."
          );
        }
        if (state === "disconnected") setCallStatus("Reconnecting...");
      };

      const flushPendingCandidates = async () => {
        remoteDescriptionSet.current = true;
        log("Flushing " + pendingCandidates.current.length + " queued candidates");
        for (const candidate of pendingCandidates.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            log("Failed adding queued candidate: " + e.message);
          }
        }
        pendingCandidates.current = [];
      };

      if (mode === "outgoing") {
        log("Creating offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        log("Offer sent to " + otherUserId);
        socket.emit("call_user", { receiverId: otherUserId, offer, callType });

        socket.once("call_failed", ({ reason }) => {
          log("call_failed event: " + reason);
          Alert.alert("Call failed", reason || "The other person appears to be offline.");
        });
      } else {
        log("Setting remote description...");
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        log("Remote description set");
        await flushPendingCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        log("Answer sent back to caller");
        socket.emit("answer_call", { callerId: otherUserId, answer });
      }

      socket.on("call_answered", async ({ answer }) => {
        log("Received answer from callee");
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates();
        } catch (e) {
          log("Failed to set remote description: " + e.message);
        }
      });

      socket.on("ice_candidate", async ({ candidate }) => {
        if (!remoteDescriptionSet.current) {
          log("Queueing early candidate");
          pendingCandidates.current.push(candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          log("Failed to add candidate: " + e.message);
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
    } catch (err) {
      log("FATAL ERROR: " + err.message);
      Alert.alert(
        "Call setup failed",
        err.message || "Unknown error — likely camera/mic permission denied.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  };

  const cleanup = () => {
    InCallManager.stop();
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    socket?.off("call_answered");
    socket?.off("ice_candidate");
    socket?.off("call_rejected");
    socket?.off("call_ended");
    socket?.off("call_failed");
  };

  const handleHangup = () => {
    socket?.emit("end_call", { targetId: otherUserId });
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

  const toggleSpeaker = () => {
    InCallManager.setForceSpeakerphoneOn(!speakerOn);
    setSpeakerOn(!speakerOn);
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

      {SHOW_DEBUG && (
        <View style={styles.debugPanel}>
          {debugLog.map((line, i) => (
            <Text key={i} style={styles.debugText} numberOfLines={1}>{line}</Text>
          ))}
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
          <Text style={styles.controlIcon}>{muted ? "🔇" : "🎤"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={toggleSpeaker}>
          <Text style={styles.controlIcon}>{speakerOn ? "🔊" : "🔈"}</Text>
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
    backgroundColor: colors.primary,
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
  debugPanel: {
    position: "absolute",
    bottom: 140,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 8,
    padding: 8,
  },
  debugText: { color: "#0f0", fontSize: 10, fontFamily: "monospace" },
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
