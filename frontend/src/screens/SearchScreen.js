import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import api from "../api/api";

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setUsers([]);
      setPosts([]);
      setSearched(false);
      return;
    }
    const res = await api.get(`/search?q=${encodeURIComponent(text)}`);
    setUsers(res.data.users);
    setPosts(res.data.posts);
    setSearched(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search people or posts..."
        value={query}
        onChangeText={handleSearch}
        autoFocus
      />

      {searched && users.length === 0 && posts.length === 0 && (
        <Text style={styles.empty}>No results found.</Text>
      )}

      {users.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>People</Text>
          {users.map((u) => (
            <TouchableOpacity
              key={u._id}
              style={styles.userRow}
              onPress={() => navigation.navigate("UserProfile", { userId: u._id })}
            >
              <Image source={{ uri: u.avatarUrl || "https://placehold.co/40x40" }} style={styles.avatar} />
              <Text style={styles.userName}>{u.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {posts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Posts</Text>
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.postRow}
                onPress={() => navigation.navigate("Comments", { postId: item._id })}
              >
                <Text style={styles.postAuthor}>{item.userId?.name}</Text>
                <Text numberOfLines={2} style={styles.postContent}>{item.content}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 14 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, marginBottom: 14 },
  empty: { textAlign: "center", color: "#999", marginTop: 30 },
  sectionTitle: { fontWeight: "700", fontSize: 14, color: "#555", marginTop: 10, marginBottom: 6 },
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#eee" },
  userName: { fontSize: 15, fontWeight: "600" },
  postRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  postAuthor: { fontWeight: "600", fontSize: 13, marginBottom: 2 },
  postContent: { color: "#555", fontSize: 14 },
});
