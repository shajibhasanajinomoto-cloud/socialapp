import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import api from "../api/api";

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a group name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/groups", { name, description, privacy });
      navigation.replace("GroupDetail", { groupId: res.data.group._id, groupName: res.data.group.name });
    } catch (err) {
      Alert.alert("Failed to create group", err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Photography Lovers" />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="What is this group about?"
        multiline
      />

      <Text style={styles.label}>Privacy</Text>
      <View style={styles.privacyRow}>
        <TouchableOpacity
          style={[styles.privacyOption, privacy === "public" && styles.privacyOptionActive]}
          onPress={() => setPrivacy("public")}
        >
          <Text style={privacy === "public" ? styles.privacyTextActive : styles.privacyText}>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.privacyOption, privacy === "private" && styles.privacyOptionActive]}
          onPress={() => setPrivacy("private")}
        >
          <Text style={privacy === "private" ? styles.privacyTextActive : styles.privacyText}>Private</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? "Creating..." : "Create Group"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: { fontWeight: "600", fontSize: 13, color: "#555", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 15 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  privacyRow: { flexDirection: "row", gap: 10 },
  privacyOption: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  privacyOptionActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  privacyText: { color: "#555", fontWeight: "600" },
  privacyTextActive: { color: "#fff", fontWeight: "600" },
  submitBtn: { backgroundColor: "#2563eb", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 30 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
