import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (user?.id) {
      api.get(`/posts/user/${user.id}`).then((res) => setPosts(res.data.posts));
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user?.avatarUrl || "https://placehold.co/80x80" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.id}
            onLike={() => {}}
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
  name: { fontSize: 20, fontWeight: "700" },
  email: { color: "#777", marginTop: 2 },
  logoutButton: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, backgroundColor: "#fee2e2" },
  logoutText: { color: "#dc2626", fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
