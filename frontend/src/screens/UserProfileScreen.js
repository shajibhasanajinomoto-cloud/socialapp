import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import api from "../api/api";
import PostCard from "../components/PostCard";
import ProfileHeader from "../components/ProfileHeader";
import { useAuth } from "../context/AuthContext";

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [friendStatus, setFriendStatus] = useState("none"); // none | pending | accepted
  const [isRequester, setIsRequester] = useState(false);

  const loadData = async () => {
    const [userRes, postsRes, statusRes] = await Promise.all([
      api.get(`/users/${userId}`),
      api.get(`/posts/user/${userId}`),
      api.get(`/friends/status/${userId}`),
    ]);
    setProfileUser(userRes.data.user);
    setFriendsCount(userRes.data.friendsCount);
    setPosts(postsRes.data.posts);
    setFriendStatus(statusRes.data.status);
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

  const goToChat = () => {
    navigation.navigate("Chat", { otherUserId: userId, otherUserName: profileUser?.name });
  };

  const goToCall = (callType) => {
    navigation.navigate("Call", {
      otherUserId: userId,
      otherUserName: profileUser?.name || "User",
      callType,
      mode: "outgoing",
    });
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <ProfileHeader
            user={profileUser}
            friendsCount={friendsCount}
            isOwnProfile={false}
            onPressFamilyMember={(memberId) => memberId && navigation.push("UserProfile", { userId: memberId })}
            actions={
              <>
                {renderFriendButton()}
                <TouchableOpacity style={styles.actionBtn} onPress={goToChat}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionLabel}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => goToCall("audio")}>
                  <Text style={styles.actionIcon}>📞</Text>
                  <Text style={styles.actionLabel}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => goToCall("video")}>
                  <Text style={styles.actionIcon}>🎥</Text>
                  <Text style={styles.actionLabel}>Video</Text>
                </TouchableOpacity>
              </>
            }
          />
        }
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
  friendBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  addBtn: { backgroundColor: "#2563eb" },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  friendsBtn: { backgroundColor: "#dcfce7" },
  friendsBtnText: { color: "#16a34a", fontWeight: "600", fontSize: 13 },
  pendingBtn: { backgroundColor: "#f3f4f6" },
  pendingBtnText: { color: "#555", fontWeight: "600", fontSize: 11 },
  actionBtn: { alignItems: "center" },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 10, color: "#555", marginTop: 2 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
