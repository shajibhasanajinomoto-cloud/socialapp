import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import ProfileHeader from "../components/ProfileHeader";

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUserLocal } = useAuth();
  const [posts, setPosts] = useState([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    const [postsRes, meRes, friendsRes] = await Promise.all([
      api.get(`/posts/user/${user.id}`),
      api.get("/auth/me"),
      api.get("/friends"),
    ]);
    setPosts(postsRes.data.posts);
    updateUserLocal(meRes.data.user);
    setFriendsCount(friendsRes.data.friends.length);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const handleReact = async (postId, type) => {
    await api.put(`/posts/${postId}/react`, { type });
    loadData();
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
      loadData(); // refresh feed-visible posts too, since a new "updated photo" post was created
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <ProfileHeader
              user={user}
              friendsCount={friendsCount}
              isOwnProfile
              onEditCover={handleChangeCover}
              onEditAvatar={handleChangeAvatar}
              uploadingCover={uploadingCover}
              uploadingAvatar={uploadingAvatar}
              onEditPersonalDetails={() => navigation.navigate("EditProfile")}
              onPressFamilyMember={(userId) => userId && navigation.navigate("UserProfile", { userId })}
              actions={
                <>
                  <TouchableOpacity
                    style={styles.editProfileBtn}
                    onPress={() => navigation.navigate("EditProfile")}
                  >
                    <Text style={styles.editProfileText}>✏️ Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                  </TouchableOpacity>
                </>
              }
            />
          </>
        }
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
  editProfileBtn: { backgroundColor: "#eff6ff", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  editProfileText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  logoutButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#fee2e2" },
  logoutText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
