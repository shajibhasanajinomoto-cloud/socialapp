import React, { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Avatar from "../components/Avatar";
import { colors } from "../theme";
import { formatChatListTime } from "../utils/time";

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [onlineMap, setOnlineMap] = useState({});

  const getOtherUserId = (chat) => {
    const { senderId, receiverId } = chat.lastMessage;
    return senderId === user.id ? receiverId : senderId;
  };

  const loadChats = async () => {
    try {
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
    } catch (e) {
      // keep whatever we already have on screen
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh whenever the screen regains focus (e.g. after sending a message)
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  // Keep the list live when messages come in or go out
  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadChats();
    socket.on("receive_message", refresh);
    socket.on("message_sent", refresh);
    return () => {
      socket.off("receive_message", refresh);
      socket.off("message_sent", refresh);
    };
  }, [socket]);

  // Online dots (needs the updated socketHandler.js on the server)
  useEffect(() => {
    if (!socket) return;
    const goOnline = ({ userId }) => setOnlineMap((m) => ({ ...m, [userId]: true }));
    const goOffline = ({ userId }) => setOnlineMap((m) => ({ ...m, [userId]: false }));
    socket.on("user_online", goOnline);
    socket.on("user_offline", goOffline);
    return () => {
      socket.off("user_online", goOnline);
      socket.off("user_offline", goOffline);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || chats.length === 0) return;
    chats.forEach((c) => {
      const id = getOtherUserId(c);
      socket.emit("check_online", { userId: id }, (isOnline) =>
        setOnlineMap((m) => ({ ...m, [id]: !!isOnline }))
      );
    });
  }, [socket, chats.length]);

  const previewText = (last) => {
    const mine = last.senderId === user.id ? "You: " : "";
    if (last.mediaType === "image") return `${mine}📷 Photo`;
    if (last.mediaType === "voice") return `${mine}🎙️ Voice note`;
    return `${mine}${last.content || ""}`;
  };

  const visible = chats.filter((c) => {
    if (!filter.trim()) return true;
    return (c.otherUser?.name || "").toLowerCase().includes(filter.trim().toLowerCase());
  });

  const renderItem = ({ item }) => {
    const otherId = getOtherUserId(item);
    const last = item.lastMessage;
    const unreadCount = item.unreadCount || 0;
    const isUnread = unreadCount > 0 || (last.receiverId === user.id && last.status !== "read");

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("Chat", {
            otherUserId: otherId,
            otherUserName: item.otherUser?.name,
          })
        }
      >
        <Avatar
          name={item.otherUser?.name}
          uri={item.otherUser?.avatarUrl}
          size={52}
          online={!!onlineMap[otherId]}
        />
        <View style={styles.middle}>
          <Text style={styles.name} numberOfLines={1}>
            {item.otherUser?.name || "User"}
          </Text>
          <Text style={[styles.preview, isUnread && styles.previewUnread]} numberOfLines={1}>
            {previewText(last)}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.time, isUnread && styles.timeUnread]}>
            {formatChatListTime(last.timestamp)}
          </Text>
          {isUnread ? (
            <View style={styles.badge}>
              {unreadCount > 0 ? (
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              ) : null}
            </View>
          ) : (
            <View style={{ height: 26 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations"
          placeholderTextColor={colors.textMuted}
          value={filter}
          onChangeText={setFilter}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadChats();
            }}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={38} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter.trim() ? "No matching chats" : "No conversations yet"}
              </Text>
              <Text style={styles.emptySub}>
                {filter.trim()
                  ? "Try a different name."
                  : "Find someone on Dearly and say hello. Your chats will show up here."}
              </Text>
              {!filter.trim() && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("Contacts")}>
                  <Text style={styles.emptyBtnText}>Find people</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingLeft: 10, fontSize: 15, color: colors.textPrimary },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  middle: { flex: 1, marginLeft: 12, marginRight: 8 },
  name: { fontWeight: "700", fontSize: 15.5, color: colors.textPrimary },
  preview: { color: colors.textSecondary, marginTop: 3, fontSize: 14 },
  previewUnread: { color: colors.textPrimary, fontWeight: "600" },
  right: { alignItems: "flex-end" },
  time: { fontSize: 12, color: colors.textSecondary },
  timeUnread: { color: colors.accent, fontWeight: "600" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    marginTop: 6,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11.5, fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingTop: 70, paddingHorizontal: 36 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginTop: 18 },
  emptySub: { color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
  emptyBtn: { marginTop: 20, backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
});
