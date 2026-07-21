import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function GroupsScreen({ navigation }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);

  const loadGroups = async () => {
    const res = await api.get("/groups");
    setGroups(res.data.groups);
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [])
  );

  const handleJoin = async (groupId) => {
    await api.put(`/groups/${groupId}/join`);
    loadGroups();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate("CreateGroup")}>
        <Text style={styles.createBtnText}>+ Create Group</Text>
      </TouchableOpacity>

      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isMember = item.members.includes(user.id);
          return (
            <TouchableOpacity
              style={styles.groupCard}
              onPress={() => navigation.navigate("GroupDetail", { groupId: item._id, groupName: item.name })}
            >
              <View style={styles.groupCover}>
                <Text style={styles.groupInitial}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMeta}>{item.members.length} members · {item.privacy}</Text>
              </View>
              {!isMember && (
                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(item._id)}>
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No groups yet. Create the first one!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  createBtn: { backgroundColor: "#2563eb", margin: 14, padding: 12, borderRadius: 10, alignItems: "center" },
  createBtnText: { color: "#fff", fontWeight: "700" },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
  },
  groupCover: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  groupInitial: { fontSize: 20, fontWeight: "700", color: "#2563eb" },
  groupName: { fontWeight: "700", fontSize: 15 },
  groupMeta: { color: "#777", fontSize: 12, marginTop: 2 },
  joinBtn: { backgroundColor: "#eff6ff", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  joinBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 12 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
