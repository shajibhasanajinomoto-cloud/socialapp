import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("friends"); // "friends" | "requests"

  const loadData = async () => {
    const [friendsRes, requestsRes] = await Promise.all([
      api.get("/friends"),
      api.get("/friends/requests"),
    ]);
    setFriends(friendsRes.data.friends);
    setRequests(requestsRes.data.requests);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleAccept = async (requestId) => {
    await api.put(`/friends/accept/${requestId}`);
    loadData();
  };

  const handleReject = async (requestId) => {
    await api.put(`/friends/reject/${requestId}`);
    loadData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setTab("friends")} style={[styles.tab, tab === "friends" && styles.tabActive]}>
          <Text style={tab === "friends" ? styles.tabTextActive : styles.tabText}>Friends ({friends.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("requests")} style={[styles.tab, tab === "requests" && styles.tabActive]}>
          <Text style={tab === "requests" ? styles.tabTextActive : styles.tabText}>Requests ({requests.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === "friends" ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("UserProfile", { userId: item._id })}
            >
              <Image source={{ uri: item.avatarUrl || "https://placehold.co/44x44" }} style={styles.avatar} />
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No friends yet. Try searching for people!</Text>}
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image
                source={{ uri: item.requester?.avatarUrl || "https://placehold.co/44x44" }}
                style={styles.avatar}
              />
              <Text style={[styles.name, { flex: 1 }]}>{item.requester?.name}</Text>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item._id)}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No pending requests.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#2563eb" },
  tabText: { color: "#777", fontWeight: "600" },
  tabTextActive: { color: "#2563eb", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: "#eee" },
  name: { fontSize: 15, fontWeight: "600" },
  acceptBtn: { backgroundColor: "#2563eb", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  acceptText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  rejectBtn: { backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rejectText: { color: "#555", fontWeight: "600", fontSize: 12 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
