import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients } from "../theme";

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
          <LinearGradient
            colors={gradients.story}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ring}
          >
            <Image
              source={{ uri: group.user.avatarUrl || "https://placehold.co/60x60" }}
              style={styles.avatar}
            />
          </LinearGradient>
          <Text style={styles.label} numberOfLines={1}>{group.user.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  storyItem: { alignItems: "center", width: 72, marginHorizontal: 6 },
  ring: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  addRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.border, borderWidth: 2, borderColor: colors.surface },
  plusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.accent,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  plusText: { color: "#fff", fontWeight: "700", fontSize: 13, lineHeight: 15 },
  label: { fontSize: 11, marginTop: 5, textAlign: "center", color: colors.textPrimary, fontWeight: "500" },
});
