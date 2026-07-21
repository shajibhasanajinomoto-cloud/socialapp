import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../api/api";
import PostCard from "../components/PostCard";
import StoryBar from "../components/StoryBar";
import { useAuth } from "../context/AuthContext";

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [posting, setPosting] = useState(false);

  const fetchFeed = async (pageNum = 1, replace = false) => {
    const res = await api.get(`/posts?page=${pageNum}&limit=10`);
    setPosts((prev) => (replace ? res.data.posts : [...prev, ...res.data.posts]));
    setHasMore(res.data.hasMore);
    setPage(pageNum);
  };

  const fetchStories = async () => {
    const res = await api.get("/stories");
    setStoryGroups(res.data.storyGroups);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(1, true), fetchStories()]);
    setRefreshing(false);
  }, []);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchFeed(page + 1);
    setLoadingMore(false);
  };

  React.useEffect(() => {
    fetchFeed(1, true);
    fetchStories();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setNewImage(result.assets[0]);
  };

  const handlePost = async () => {
    if (!newContent && !newImage) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", newContent);
      if (newImage) {
        formData.append("image", {
          uri: newImage.uri,
          name: "post.jpg",
          type: "image/jpeg",
        });
      }

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewContent("");
      setNewImage(null);
      await fetchFeed(1, true);
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (postId, type) => {
    // Optimistic update: apply/replace/remove the current user's reaction locally first
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const existing = p.reactions?.find((r) => r.userId === user.id || r.userId?._id === user.id);
        let updatedReactions;
        if (existing && existing.type === type) {
          updatedReactions = p.reactions.filter((r) => r !== existing);
        } else if (existing) {
          updatedReactions = p.reactions.map((r) => (r === existing ? { ...r, type } : r));
        } else {
          updatedReactions = [...(p.reactions || []), { userId: user.id, type }];
        }
        return { ...p, reactions: updatedReactions };
      })
    );
    try {
      await api.put(`/posts/${postId}/react`, { type });
    } catch (err) {
      await fetchFeed(1, true); // revert on failure
    }
  };

  const handleAddStory = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: result.assets[0].uri,
        name: "story.jpg",
        type: "image/jpeg",
      });
      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchStories();
    } catch (err) {
      Alert.alert("Failed to post story", err.response?.data?.message || "Something went wrong");
    }
  };

  const handleViewStory = (storyGroup) => {
    navigation.navigate("StoryViewer", { storyGroup });
  };

  return (
    <View style={styles.container}>
      <StoryBar
        storyGroups={storyGroups}
        currentUser={user}
        onAddStory={handleAddStory}
        onViewStory={handleViewStory}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="What's on your mind?"
          value={newContent}
          onChangeText={setNewContent}
          multiline
        />
        {newImage && <Image source={{ uri: newImage.uri }} style={styles.previewImage} />}
        <View style={styles.composerActions}>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.pickImageText}>📷 Add photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={posting}>
            <Text style={styles.postButtonText}>{posting ? "Posting..." : "Post"}</Text>
          </TouchableOpacity>
        </View>
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  composer: { backgroundColor: "#fff", padding: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  composerInput: { fontSize: 15, minHeight: 44, textAlignVertical: "top" },
  previewImage: { width: "100%", height: 160, borderRadius: 8, marginTop: 8 },
  composerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  pickImageText: { color: "#2563eb", fontSize: 14 },
  postButton: { backgroundColor: "#2563eb", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  postButtonText: { color: "#fff", fontWeight: "600" },
});
