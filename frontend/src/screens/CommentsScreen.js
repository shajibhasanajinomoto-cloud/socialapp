import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import api from "../api/api";

export default function CommentsScreen({ route }) {
  const { postId } = route.params;
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    const res = await api.get(`/posts/${postId}/comments`);
    setComments(res.data.comments);
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <Text style={styles.commentAuthor}>{item.userId?.name || "Unknown"}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet. Be the first!</Text>}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  commentRow: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingBottom: 10 },
  commentAuthor: { fontWeight: "600", marginBottom: 2 },
  commentText: { color: "#333" },
  empty: { textAlign: "center", marginTop: 30, color: "#999" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendText: { color: "#fff", fontWeight: "600" },
});
