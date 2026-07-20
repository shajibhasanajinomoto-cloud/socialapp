import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadChats = async () => {
    const res = await api.get("/messages");
    setChats(res.data.chats);
    setLoading(false);
  };

  // Refresh whenever the screen regains focus (e.g. after sending a message)
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  const getOtherUserId = (chat) => {
    const { senderId, receiverId } = chat.lastMessage;
    return senderId === user.id ? receiverId : senderId;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate("Chat", { otherUserId: getOtherUserId(item) })
            }
          >
            <View style={styles.avatarPlaceholder} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{getOtherUserId(item)}</Text>
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
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eee", marginRight: 12 },
  name: { fontWeight: "600", fontSize: 15 },
  preview: { color: "#777", marginTop: 2 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
