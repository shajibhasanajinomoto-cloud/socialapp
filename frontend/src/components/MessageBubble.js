import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MessageBubble({ message, isOwn }) {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={isOwn ? styles.textOwn : styles.textOther}>{message.content}</Text>
      </View>
      {isOwn && message.status && (
        <Text style={styles.status}>{message.status === "read" ? "Seen" : message.status}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 4, paddingHorizontal: 12 },
  rowOwn: { alignItems: "flex-end" },
  rowOther: { alignItems: "flex-start" },
  bubble: { maxWidth: "75%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn: { backgroundColor: "#2563eb", borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: "#e5e5ea", borderBottomLeftRadius: 4 },
  textOwn: { color: "#fff", fontSize: 15 },
  textOther: { color: "#000", fontSize: 15 },
  status: { fontSize: 11, color: "#999", marginTop: 2, marginRight: 4 },
});
