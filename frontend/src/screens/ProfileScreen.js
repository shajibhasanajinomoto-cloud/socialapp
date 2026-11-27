import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { colors, gradients } from "../theme";
import appConfig from "../../app.json";

// Dearly profile: photo, name, email, edit profile, privacy, version, log out.
export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUserLocal } = useAuth();
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      api
        .get("/auth/me")
        .then((res) => updateUserLocal(res.data.user))
        .catch(() => {});
    }, [user?.id])
  );

  const handleChangeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: result.assets[0].uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });
      const res = await api.put("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUserLocal({ avatarUrl: res.data.user.avatarUrl });
    } catch (err) {
      Alert.alert("Could not update photo", err.response?.data?.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Log out?", "You will need to sign in again to use Dearly.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "Not added"}</Text>
      </View>
    </View>
  );

  const ActionRow = ({ icon, label, onPress, right, danger }) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      <Text style={[styles.actionLabel, danger && { color: colors.danger }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <LinearGradient colors={gradients.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
          <Avatar name={user?.name} uri={user?.avatarUrl} size={104} />
          <View style={styles.cameraBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.heroName}>{user?.name}</Text>
        <Text style={styles.heroSub}>{user?.email}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.card}>
          <InfoRow icon="person-outline" label="Full name" value={user?.name} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          {!!user?.bio && <InfoRow icon="information-circle-outline" label="Bio" value={user?.bio} />}
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile")}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editBtnText}>Edit profile</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <ActionRow
            icon="lock-closed-outline"
            label="Privacy settings"
            onPress={() => Alert.alert("Coming soon", "Privacy settings will be available in a future update.")}
            right={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="information-circle-outline"
            label="App version"
            right={<Text style={styles.versionText}>{appConfig.expo.version}</Text>}
          />
          <View style={styles.divider} />
          <ActionRow icon="log-out-outline" label="Log out" onPress={confirmLogout} danger />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 34,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarWrap: { padding: 4, backgroundColor: "#fff", borderRadius: 60 },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 14 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 3 },

  body: { padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoLabel: { color: colors.textSecondary, fontSize: 12.5 },
  infoValue: { color: colors.textPrimary, fontSize: 15, fontWeight: "600", marginTop: 2 },

  editBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: 16,
  },
  editBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  actionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  actionLabel: { flex: 1, marginLeft: 14, fontSize: 15.5, color: colors.textPrimary, fontWeight: "500" },
  versionText: { color: colors.textSecondary, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
});
