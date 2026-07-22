import React, { useState, useCallback } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const getOtherUserId = (chat) => {
    const { senderId, receiverId } = chat.lastMessage;
    return senderId === user.id ? receiverId : senderId;
  };

  const loadChats = async () => {
    const res = await api.get("/messages");

    // Resolve each conversation's other-user name/avatar for display
    const enriched = await Promise.all(
      res.data.chats.map(async (chat) => {
        const otherUserId = getOtherUserId(chat);
        try {
          const userRes = await api.get(`/users/${otherUserId}`);
          return { ...chat, otherUser: userRes.data.user };
        } catch (e) {
          return { ...chat, otherUser: { name: "Unknown User" } };
        }
      })
    );

    setChats(enriched);
    setLoading(false);
  };

  // Refresh whenever the screen regains focus (e.g. after sending a message)
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate("Chat", {
                otherUserId: getOtherUserId(item),
                otherUserName: item.otherUser?.name,
              })
            }
          >
            <Image
              source={{ uri: item.otherUser?.avatarUrl || "https://placehold.co/44x44" }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.otherUser?.name || "User"}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage.content}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>No conversations yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: "#eee" },
  name: { fontWeight: "600", fontSize: 15 },
  preview: { color: "#777", marginTop: 2 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
