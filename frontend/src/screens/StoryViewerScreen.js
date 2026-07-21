import React, { useEffect, useState, useRef } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import api from "../api/api";

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewerScreen({ route, navigation }) {
  const { storyGroup } = route.params;
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const currentStory = storyGroup.stories[index];

  useEffect(() => {
    api.put(`/stories/${currentStory._id}/view`).catch(() => {});

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) goNext();
    });
  }, [index]);

  const goNext = () => {
    if (index < storyGroup.stories.length - 1) {
      setIndex(index + 1);
    } else {
      navigation.goBack();
    }
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {storyGroup.stories.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width:
                    i < index
                      ? "100%"
                      : i === index
                      ? progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                      : "0%",
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.header}>
        <Image source={{ uri: storyGroup.user.avatarUrl || "https://placehold.co/32x32" }} style={styles.avatar} />
        <Text style={styles.name}>{storyGroup.user.name}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: currentStory.mediaUrl }} style={styles.storyImage} resizeMode="contain" />

      <View style={styles.tapZones}>
        <TouchableOpacity style={styles.tapLeft} onPress={goPrev} />
        <TouchableOpacity style={styles.tapRight} onPress={goNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  progressRow: { flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingTop: 50 },
  progressTrack: { flex: 1, height: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: "#333" },
  name: { color: "#fff", fontWeight: "600", flex: 1 },
  closeBtn: { padding: 6 },
  closeText: { color: "#fff", fontSize: 20 },
  storyImage: { flex: 1, width: "100%" },
  tapZones: { position: "absolute", top: 100, bottom: 0, left: 0, right: 0, flexDirection: "row" },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
});
