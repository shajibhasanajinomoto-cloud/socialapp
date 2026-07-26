import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useSocket } from "../context/SocketContext";
import api from "../api/api";

export default function IncomingCallBanner({ navigationRef }) {
  const { socket, incomingCall, setIncomingCall } = useSocket();
  const [callerName, setCallerName] = useState("Someone");

  useEffect(() => {
    if (!incomingCall) return;
    setCallerName("Someone");
    api
      .get(`/users/${incomingCall.callerId}`)
      .then((res) => setCallerName(res.data.user.name))
      .catch(() => {});
  }, [incomingCall]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    const { callerId, offer, callType } = incomingCall;
    setIncomingCall(null);
    navigationRef.current?.navigate("Call", {
      otherUserId: callerId,
      otherUserName: callerName,
      callType,
      mode: "incoming",
      incomingOffer: offer,
    });
  };

  const handleDecline = () => {
    socket.emit("reject_call", { callerId: incomingCall.callerId });
    setIncomingCall(null);
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {callerName} is calling ({incomingCall.callType === "video" ? "Video" : "Voice"})
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  card: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  buttonRow: { flexDirection: "row", justifyContent: "space-around" },
  declineBtn: { backgroundColor: "#E5484D", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  acceptBtn: { backgroundColor: "#2FAF8A", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
