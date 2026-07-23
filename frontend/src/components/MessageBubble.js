import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";

export default function MessageBubble({ message, isOwn }) {
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const handlePlayVoice = async () => {
    if (sound) {
      if (playing) {
        await sound.pauseAsync();
        setPlaying(false);
      } else {
        await sound.playAsync();
        setPlaying(true);
      }
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: message.mediaUrl },
      { shouldPlay: true }
    );
    setSound(newSound);
    setPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setPlaying(false);
        newSound.setPositionAsync(0);
      }
    });
  };

  const renderContent = () => {
    if (message.mediaType === "image" && message.mediaUrl) {
      return <Image source={{ uri: message.mediaUrl }} style={styles.image} />;
    }
    if (message.mediaType === "voice" && message.mediaUrl) {
      return (
        <TouchableOpacity style={styles.voiceRow} onPress={handlePlayVoice}>
          <Text style={isOwn ? styles.voiceIconOwn : styles.voiceIconOther}>
            {playing ? "⏸" : "▶️"}
          </Text>
          <View style={[styles.voiceBar, isOwn ? styles.voiceBarOwn : styles.voiceBarOther]} />
          <Text style={isOwn ? styles.voiceLabelOwn : styles.voiceLabelOther}>Voice</Text>
        </TouchableOpacity>
      );
    }
    return <Text style={isOwn ? styles.textOwn : styles.textOther}>{message.content}</Text>;
  };

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {renderContent()}
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
  image: { width: 200, height: 200, borderRadius: 10 },
  voiceRow: { flexDirection: "row", alignItems: "center", minWidth: 140 },
  voiceIconOwn: { fontSize: 16, marginRight: 8 },
  voiceIconOther: { fontSize: 16, marginRight: 8 },
  voiceBar: { flex: 1, height: 3, borderRadius: 2, marginRight: 8 },
  voiceBarOwn: { backgroundColor: "rgba(255,255,255,0.5)" },
  voiceBarOther: { backgroundColor: "rgba(0,0,0,0.2)" },
  voiceLabelOwn: { color: "#fff", fontSize: 12 },
  voiceLabelOther: { color: "#333", fontSize: 12 },
  status: { fontSize: 11, color: "#999", marginTop: 2, marginRight: 4 },
});
