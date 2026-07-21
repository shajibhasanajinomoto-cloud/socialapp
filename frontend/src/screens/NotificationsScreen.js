import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";

const NOTIFICATION_TEXT = {
  like: "reacted to your post",
  comment: "commented on your post",
  message: "sent you a message",
  friend_request: "sent you a friend request",
  friend_accept: "accepted your friend request",
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    const res = await api.get("/notifications");
    setNotifications(res.data.notifications);
    api.put("/notifications/read-all").catch(() => {});
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const handlePress = (notification) => {
    if (notification.type === "friend_request") {
      navigation.navigate("Friends");
    } else if (notification.type === "message") {
      navigation.navigate("Chat", { otherUserId: notification.sender._id });
    } else if (notification.postId) {
      navigation.navigate("Comments", { postId: notification.postId._id });
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.read && styles.unread]}
            onPress={() => handlePress(item)}
          >
            <Image
              source={{ uri: item.sender?.avatarUrl || "https://placehold.co/40x40" }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>
                <Text style={styles.name}>{item.sender?.name}</Text> {NOTIFICATION_TEXT[item.type]}
              </Text>
              <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  unread: { backgroundColor: "#eff6ff" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#eee" },
  text: { fontSize: 14, color: "#333" },
  name: { fontWeight: "700" },
  time: { fontSize: 12, color: "#999", marginTop: 2 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
