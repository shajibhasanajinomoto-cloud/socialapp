import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUserLocal } = useAuth();
  const [posts, setPosts] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const loadPosts = async () => {
    if (user?.id) {
      const res = await api.get(`/posts/user/${user.id}`);
      setPosts(res.data.posts);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  const handleReact = async (postId, type) => {
    await api.put(`/posts/${postId}/react`, { type });
    loadPosts();
  };

  const pickAndUpload = async (endpoint, setLoading, onSuccess) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: result.assets[0].uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });

      const res = await api.put(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess(res.data.user);
      loadPosts(); // refresh feed-visible posts too, since a new "updated photo" post was created
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = () =>
    pickAndUpload("/users/me/avatar", setUploadingAvatar, (updatedUser) =>
      updateUserLocal({ avatarUrl: updatedUser.avatarUrl })
    );

  const handleChangeCover = () =>
    pickAndUpload("/users/me/cover", setUploadingCover, (updatedUser) =>
      updateUserLocal({ coverImageUrl: updatedUser.coverImageUrl })
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleChangeCover} style={styles.coverWrapper}>
          {user?.coverImageUrl ? (
            <Image source={{ uri: user.coverImageUrl }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={styles.coverEditBadge}>
            {uploadingCover ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.editIcon}>📷 Edit Cover</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleChangeAvatar} style={styles.avatarWrapper}>
          <Image
            source={{ uri: user?.avatarUrl || "https://placehold.co/80x80" }}
            style={styles.avatar}
          />
          <View style={styles.avatarEditBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.avatarEditIcon}>📷</Text>
            )}
          </View>
        </TouchableOpacity>

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
  header: { alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 20 },
  coverWrapper: { width: "100%", height: 140, marginBottom: -40 },
  cover: { width: "100%", height: 140, backgroundColor: "#dbeafe" },
  coverPlaceholder: { width: "100%", height: 140, backgroundColor: "#dbeafe" },
  coverEditBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  editIcon: { color: "#fff", fontSize: 11, fontWeight: "600" },
  avatarWrapper: { marginTop: 40, marginBottom: 10 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#eee", borderWidth: 3, borderColor: "#fff" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563eb",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarEditIcon: { fontSize: 12 },
  name: { fontSize: 20, fontWeight: "700" },
  email: { color: "#777", marginTop: 2 },
  logoutButton: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, backgroundColor: "#fee2e2" },
  logoutText: { color: "#dc2626", fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
