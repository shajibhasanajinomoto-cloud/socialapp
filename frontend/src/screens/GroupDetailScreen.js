import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);

  const loadData = async () => {
    const [groupRes, postsRes] = await Promise.all([
      api.get(`/groups/${groupId}`),
      api.get(`/groups/${groupId}/posts`),
    ]);
    setGroup(groupRes.data.group);
    setPosts(postsRes.data.posts);
  };

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: groupName });
      loadData();
    }, [])
  );

  const isMember = group?.members?.some((m) => m._id === user.id);

  const handleJoinLeave = async () => {
    if (isMember) {
      await api.put(`/groups/${groupId}/leave`);
    } else {
      await api.put(`/groups/${groupId}/join`);
    }
    loadData();
  };

  const handlePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    try {
      await api.post("/posts", { content: newContent, groupId });
      setNewContent("");
      loadData();
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (postId, type) => {
    await api.put(`/posts/${postId}/react`, { type });
    loadData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupName}>{group?.name}</Text>
        <Text style={styles.groupMeta}>{group?.members?.length || 0} members</Text>
        <TouchableOpacity
          style={[styles.joinBtn, isMember && styles.leaveBtn]}
          onPress={handleJoinLeave}
        >
          <Text style={isMember ? styles.leaveBtnText : styles.joinBtnText}>
            {isMember ? "Leave Group" : "Join Group"}
          </Text>
        </TouchableOpacity>
      </View>

      {isMember && (
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Share something with the group..."
            value={newContent}
            onChangeText={setNewContent}
            multiline
          />
          <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={posting}>
            <Text style={styles.postBtnText}>{posting ? "Posting..." : "Post"}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.id}
            onReact={handleReact}
            onOpenComments={(postId) => navigation.navigate("Comments", { postId })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No posts in this group yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF6F2" },
  header: { backgroundColor: "#fff", padding: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F0E6DE" },
  groupName: { fontSize: 20, fontWeight: "700" },
  groupMeta: { color: "#777", marginTop: 4, marginBottom: 12 },
  joinBtn: { backgroundColor: "#FF6B4A", paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  joinBtnText: { color: "#fff", fontWeight: "600" },
  leaveBtn: { backgroundColor: "#FDE7E7" },
  leaveBtnText: { color: "#E5484D", fontWeight: "600" },
  composer: { backgroundColor: "#fff", padding: 12, borderBottomWidth: 1, borderBottomColor: "#F0E6DE" },
  composerInput: { fontSize: 14, minHeight: 40 },
  postBtn: { backgroundColor: "#FF6B4A", alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  postBtnText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
