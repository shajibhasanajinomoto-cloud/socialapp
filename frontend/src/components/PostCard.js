import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function PostCard({ post, currentUserId, onLike, onOpenComments }) {
  const liked = post.likes?.includes(currentUserId);

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

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onLike(post._id)} style={styles.actionBtn}>
          <Text style={liked ? styles.likedText : styles.actionText}>
            {liked ? "♥ Liked" : "♡ Like"} ({post.likes?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onOpenComments(post._id)} style={styles.actionBtn}>
          <Text style={styles.actionText}>💬 {post.commentsCount || 0} Comments</Text>
        </TouchableOpacity>
      </View>
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
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  actionBtn: { paddingVertical: 4 },
  actionText: { color: "#555", fontSize: 14 },
  likedText: { color: "#e0245e", fontSize: 14, fontWeight: "600" },
});
