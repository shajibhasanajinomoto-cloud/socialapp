import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import ReactionPicker, { getReactionEmoji } from "./ReactionPicker";

export default function PostCard({ post, currentUserId, onReact, onOpenComments }) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const myReaction = post.reactions?.find((r) => r.userId === currentUserId || r.userId?._id === currentUserId);

  // Build a summary like top emojis + total count from the reactions array
  const counts = {};
  for (const r of post.reactions || []) counts[r.type] = (counts[r.type] || 0) + 1;
  const topTypes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
  const totalReactions = post.reactions?.length || 0;

  const handleQuickTap = () => {
    // Quick tap toggles "like"; long-press opens the full emoji picker
    onReact(post._id, myReaction ? myReaction.type : "like");
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{ uri: post.userId?.avatarUrl || "https://placehold.co/40x40" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{post.userId?.name || "Unknown"}</Text>
      </View>

      {!!post.content && <Text style={styles.content}>{post.content}</Text>}

      {!!post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.image} />}

      {totalReactions > 0 && (
        <View style={styles.reactionSummary}>
          <Text style={styles.reactionEmojis}>
            {topTypes.map((t) => getReactionEmoji(t)).join("")}
          </Text>
          <Text style={styles.reactionCount}>{totalReactions}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleQuickTap}
          onLongPress={() => setPickerVisible(true)}
          style={styles.actionBtn}
        >
          <Text style={myReaction ? styles.reactedText : styles.actionText}>
            {myReaction ? `${getReactionEmoji(myReaction.type)} ${myReaction.type}` : "👍 Like"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onOpenComments(post._id)} style={styles.actionBtn}>
          <Text style={styles.actionText}>💬 {post.commentsCount || 0} Comments</Text>
        </TouchableOpacity>
      </View>

      <ReactionPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(type) => onReact(post._id, type)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#eee" },
  name: { fontWeight: "600", fontSize: 15 },
  content: { fontSize: 15, marginBottom: 8, lineHeight: 20 },
  image: { width: "100%", height: 220, borderRadius: 10, marginBottom: 8, backgroundColor: "#f2f2f2" },
  reactionSummary: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  reactionEmojis: { fontSize: 14, marginRight: 6 },
  reactionCount: { fontSize: 13, color: "#777" },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingTop: 8 },
  actionBtn: { paddingVertical: 4 },
  actionText: { color: "#555", fontSize: 14 },
  reactedText: { color: "#2563eb", fontSize: 14, fontWeight: "600" },
});
