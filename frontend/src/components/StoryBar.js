import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

export default function StoryBar({ storyGroups, currentUser, onAddStory, onViewStory }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bar}>
      <TouchableOpacity style={styles.storyItem} onPress={onAddStory}>
        <View style={styles.addRing}>
          <Image
            source={{ uri: currentUser?.avatarUrl || "https://placehold.co/60x60" }}
            style={styles.avatar}
          />
          <View style={styles.plusBadge}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </View>
        <Text style={styles.label} numberOfLines={1}>Your Story</Text>
      </TouchableOpacity>

      {storyGroups.map((group) => (
        <TouchableOpacity
          key={group.user._id}
          style={styles.storyItem}
          onPress={() => onViewStory(group)}
        >
          <View style={styles.ring}>
            <Image
              source={{ uri: group.user.avatarUrl || "https://placehold.co/60x60" }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.label} numberOfLines={1}>{group.user.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: "#fff", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  storyItem: { alignItems: "center", width: 72, marginHorizontal: 6 },
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#2563eb",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#eee" },
  plusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#2563eb",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  plusText: { color: "#fff", fontWeight: "700", fontSize: 12, lineHeight: 14 },
  label: { fontSize: 11, marginTop: 4, textAlign: "center", color: "#333" },
});
