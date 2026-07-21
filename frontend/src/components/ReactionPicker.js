import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😡", label: "Angry" },
];

export function getReactionEmoji(type) {
  const found = REACTIONS.find((r) => r.type === type);
  return found ? found.emoji : "👍";
}

export default function ReactionPicker({ visible, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.picker}>
          {REACTIONS.map((r) => (
            <TouchableOpacity
              key={r.type}
              style={styles.reactionBtn}
              onPress={() => {
                onSelect(r.type);
                onClose();
              }}
            >
              <Text style={styles.emoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" },
  picker: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  reactionBtn: { paddingHorizontal: 8 },
  emoji: { fontSize: 30 },
});
