import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function EditFamilyScreen() {
  const { user, updateUserLocal } = useAuth();
  const [friends, setFriends] = useState([]);
  const [members, setMembers] = useState([]); // [{ userId, relation, name, avatarUrl }]
  const [saving, setSaving] = useState(false);
  const [pickerOpenFor, setPickerOpenFor] = useState(false);

  const loadData = async () => {
    const [friendsRes, meRes] = await Promise.all([api.get("/friends"), api.get("/auth/me")]);
    setFriends(friendsRes.data.friends);
    const existing = (meRes.data.user.familyMembers || []).map((m) => ({
      userId: m.user?._id,
      relation: m.relation,
      name: m.user?.name,
      avatarUrl: m.user?.avatarUrl,
    }));
    setMembers(existing);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const addMember = (friend) => {
    setPickerOpenFor(false);
    if (members.some((m) => m.userId === friend._id)) return;
    setMembers((prev) => [...prev, { userId: friend._id, name: friend.name, avatarUrl: friend.avatarUrl, relation: "" }]);
  };

  const updateRelation = (userId, relation) => {
    setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, relation } : m)));
  };

  const removeMember = (userId) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleSave = async () => {
    const missingRelation = members.some((m) => !m.relation.trim());
    if (missingRelation) {
      Alert.alert("Add a relation", "Please fill in how each person is related to you.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/users/me/family", {
        familyMembers: members.map((m) => ({ userId: m.userId, relation: m.relation })),
      });
      await updateUserLocal({ familyMembers: res.data.user.familyMembers });
    } catch (err) {
      Alert.alert("Failed to save", err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const availableFriends = friends.filter((f) => !members.some((m) => m.userId === f._id));

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Family members</Text>
            <Text style={styles.subheading}>Add friends and label how you're related to them.</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <Image source={{ uri: item.avatarUrl || "https://placehold.co/44x44" }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{item.name}</Text>
              <TextInput
                style={styles.relationInput}
                value={item.relation}
                onChangeText={(text) => updateRelation(item.userId, text)}
                placeholder="e.g. Brother, Mother, Spouse"
              />
            </View>
            <TouchableOpacity onPress={() => removeMember(item.userId)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No family members added yet.</Text>}
        ListFooterComponent={
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setPickerOpenFor(true)}>
              <Text style={styles.addBtnText}>+ Add family member</Text>
            </TouchableOpacity>

            {pickerOpenFor && (
              <View style={styles.picker}>
                <Text style={styles.pickerHeading}>Choose a friend</Text>
                {availableFriends.length === 0 ? (
                  <Text style={styles.empty}>All your friends are already added.</Text>
                ) : (
                  availableFriends.map((friend) => (
                    <TouchableOpacity key={friend._id} style={styles.pickerRow} onPress={() => addMember(friend)}>
                      <Image source={{ uri: friend.avatarUrl || "https://placehold.co/36x36" }} style={styles.pickerAvatar} />
                      <Text style={styles.pickerName}>{friend.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subheading: { fontSize: 13, color: "#777", marginBottom: 16 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: "#eee" },
  memberName: { fontSize: 14, fontWeight: "600" },
  relationInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, marginTop: 4 },
  removeText: { color: "#dc2626", fontWeight: "600", fontSize: 12, marginLeft: 10 },
  empty: { textAlign: "center", color: "#999", marginVertical: 16 },
  addBtn: { marginTop: 16, paddingVertical: 12, alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 10 },
  addBtnText: { color: "#2563eb", fontWeight: "700", fontSize: 14 },
  picker: { marginTop: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 10 },
  pickerHeading: { fontWeight: "700", fontSize: 13, marginBottom: 8, color: "#555" },
  pickerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  pickerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: "#eee" },
  pickerName: { fontSize: 14, fontWeight: "600" },
  saveBtn: { backgroundColor: "#2563eb", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 24, marginBottom: 40 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
