import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useSocket } from "../context/SocketContext";

export default function IncomingCallBanner({ navigationRef }) {
  const { socket, incomingCall, setIncomingCall } = useSocket();

  if (!incomingCall) return null;

  const handleAccept = () => {
    const { callerId, offer, callType } = incomingCall;
    setIncomingCall(null);
    navigationRef.current?.navigate("Call", {
      otherUserId: callerId,
      otherUserName: "Caller", // resolved name isn't known here; CallScreen can be enhanced to fetch it
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
            Incoming {incomingCall.callType === "video" ? "Video" : "Voice"} Call
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
  declineBtn: { backgroundColor: "#dc2626", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  acceptBtn: { backgroundColor: "#16a34a", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
