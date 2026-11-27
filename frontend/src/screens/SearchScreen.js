import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { colors } from "../theme";

// Contacts tab: find people on Dearly and start a chat.
export default function SearchScreen({ navigation }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const requestId = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const runSearch = async (text) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(text)}`);
      if (id !== requestId.current) return; // an older request, ignore
      // Never offer yourself - you can't message yourself
      setUsers((res.data.users || []).filter((u) => u._id !== user.id));
      setSearched(true);
    } catch (e) {
      if (id !== requestId.current) return;
      setUsers([]);
      setSearched(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const handleChange = (text) => {
    setQuery(text);
    clearTimeout(timer.current);
    if (!text.trim()) {
      requestId.current++;
      setUsers([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    timer.current = setTimeout(() => runSearch(text.trim()), 300);
  };

  const openChat = (u) => navigation.navigate("Chat", { otherUserId: u._id, otherUserName: u.name });

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => openChat(item)}>
      <Avatar name={item.name} uri={item.avatarUrl} size={48} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {!!item.bio && (
          <Text style={styles.sub} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => navigation.navigate("UserProfile", { userId: item._id })}
      >
        <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      <View style={styles.chatBtn}>
        <Ionicons name="chatbubble-outline" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search people by name"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 14, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name={searched ? "person-outline" : "search"} size={34} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{searched ? "No users found" : "Find people on Dearly"}</Text>
            <Text style={styles.emptySub}>
              {searched
                ? "Try a different name or spelling."
                : "Type a name to find someone and start a conversation."}
            </Text>
          </View>
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
    margin: 14,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 12, paddingLeft: 10, fontSize: 15, color: colors.textPrimary },

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
  middle: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15.5, fontWeight: "700", color: colors.textPrimary },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  iconBtn: { padding: 8, marginRight: 4 },
  chatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 36 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginTop: 16 },
  emptySub: { color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
});
