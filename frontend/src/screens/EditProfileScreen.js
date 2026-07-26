import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function EditProfileScreen({ navigation }) {
  const { user, updateUserLocal } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [work, setWork] = useState(user?.work || "");
  const [education, setEducation] = useState(user?.education || "");
  const [location, setLocation] = useState(user?.location || "");
  const [hometown, setHometown] = useState(user?.hometown || "");
  const [relationshipStatus, setRelationshipStatus] = useState(user?.relationshipStatus || "");
  const [relationshipSince, setRelationshipSince] = useState(
    user?.relationshipSince ? new Date(user.relationshipSince).toISOString().split("T")[0] : ""
  );
  const [birthday, setBirthday] = useState(
    user?.birthday ? new Date(user.birthday).toISOString().split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  const RELATIONSHIP_OPTIONS = [
    "Single",
    "In a relationship",
    "Engaged",
    "Married",
    "It's complicated",
    "Separated",
    "Divorced",
    "Widowed",
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/users/me", {
        bio,
        work,
        education,
        location,
        hometown,
        relationshipStatus,
        relationshipSince: relationshipStatus ? relationshipSince || null : null,
        birthday: birthday || null,
      });
      await updateUserLocal(res.data.user);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Failed to save", err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people about yourself"
        multiline
      />

      <Text style={styles.label}>Work</Text>
      <TextInput
        style={styles.input}
        value={work}
        onChangeText={setWork}
        placeholder="e.g. Software Engineer at Acme Corp"
      />

      <Text style={styles.label}>Education</Text>
      <TextInput
        style={styles.input}
        value={education}
        onChangeText={setEducation}
        placeholder="e.g. University of Dhaka"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. Dhaka, Bangladesh"
      />

      <Text style={styles.label}>Hometown</Text>
      <TextInput
        style={styles.input}
        value={hometown}
        onChangeText={setHometown}
        placeholder="e.g. Haluaghat Upazila"
      />

      <Text style={styles.label}>Relationship status</Text>
      <View style={styles.chipRow}>
        {RELATIONSHIP_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, relationshipStatus === option && styles.chipActive]}
            onPress={() => setRelationshipStatus(relationshipStatus === option ? "" : option)}
          >
            <Text style={[styles.chipText, relationshipStatus === option && styles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!!relationshipStatus && (
        <>
          <Text style={styles.label}>Since (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={relationshipSince}
            onChangeText={setRelationshipSince}
            placeholder="e.g. 2025-08-07"
          />
        </>
      )}

      <Text style={styles.label}>Birthday (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={birthday}
        onChangeText={setBirthday}
        placeholder="e.g. 1995-11-11"
      />

      <TouchableOpacity style={styles.familyLink} onPress={() => navigation.navigate("EditFamily")}>
        <Text style={styles.familyLinkText}>🌳 Manage family members</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Profile"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  label: { fontWeight: "600", fontSize: 13, color: "#555", marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 15 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#FF6B4A", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 30 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: "#FF6B4A", borderColor: "#FF6B4A" },
  chipText: { fontSize: 13, color: "#444", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  familyLink: { marginTop: 24, paddingVertical: 12, alignItems: "center", backgroundColor: "#FFE7E0", borderRadius: 10 },
  familyLinkText: { color: "#FF6B4A", fontWeight: "700", fontSize: 14 },
});
