import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import api from "../api/api";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friendStatus, setFriendStatus] = useState("none"); // none | pending | accepted
  const [friendshipId, setFriendshipId] = useState(null);
  const [isRequester, setIsRequester] = useState(false);

  const loadData = async () => {
    const [postsRes, statusRes] = await Promise.all([
      api.get(`/posts/user/${userId}`),
      api.get(`/friends/status/${userId}`),
    ]);
    setPosts(postsRes.data.posts);
    if (postsRes.data.posts.length > 0) setProfileUser(postsRes.data.posts[0].userId);
    setFriendStatus(statusRes.data.status);
    setFriendshipId(statusRes.data.friendshipId);
    setIsRequester(statusRes.data.requester === currentUser.id);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleAddFriend = async () => {
    await api.post(`/friends/request/${userId}`);
    loadData();
  };

  const handleReact = async (postId, type) => {
    await api.put(`/posts/${postId}/react`, { type });
    loadData();
  };

  const renderFriendButton = () => {
    if (friendStatus === "accepted") {
      return (
        <View style={[styles.friendBtn, styles.friendsBtn]}>
          <Text style={styles.friendsBtnText}>✓ Friends</Text>
        </View>
      );
    }
    if (friendStatus === "pending") {
      return (
        <View style={[styles.friendBtn, styles.pendingBtn]}>
          <Text style={styles.pendingBtnText}>{isRequester ? "Request Sent" : "Respond in Friends tab"}</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity style={[styles.friendBtn, styles.addBtn]} onPress={handleAddFriend}>
        <Text style={styles.addBtnText}>+ Add Friend</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: profileUser?.avatarUrl || "https://placehold.co/80x80" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profileUser?.name || "User"}</Text>
        {renderFriendButton()}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={currentUser?.id}
            onReact={handleReact}
            onOpenComments={(postId) => navigation.navigate("Comments", { postId })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { alignItems: "center", backgroundColor: "#fff", padding: 24, borderBottomWidth: 1, borderBottomColor: "#eee" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#eee", marginBottom: 10 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  friendBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  addBtn: { backgroundColor: "#2563eb" },
  addBtnText: { color: "#fff", fontWeight: "600" },
  friendsBtn: { backgroundColor: "#dcfce7" },
  friendsBtnText: { color: "#16a34a", fontWeight: "600" },
  pendingBtn: { backgroundColor: "#f3f4f6" },
  pendingBtnText: { color: "#555", fontWeight: "600", fontSize: 12 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
