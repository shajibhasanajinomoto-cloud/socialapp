import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors, gradients, radius } from "../theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert("Login failed", err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradients.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          {/* Dearly logo: heart inside a speech bubble, on a mint tile */}
          <View style={styles.logoTile}>
            <Ionicons name="chatbubble-outline" size={50} color={colors.primary} />
            <Ionicons name="heart-outline" size={20} color={colors.primary} style={styles.logoHeart} />
          </View>
          <Text style={styles.heroTitle}>Dearly</Text>
          <Text style={styles.heroSubtitle}>Connect with the people you care about.</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome back</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log In"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  hero: {
    paddingTop: 90,
    paddingBottom: 50,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoTile: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoHeart: { position: "absolute", top: 29 },
  heroTitle: { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  heroSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 6, textAlign: "center", paddingHorizontal: 30 },
  form: { flex: 1, paddingHorizontal: 28, paddingTop: 36 },
  formTitle: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 24 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 15,
    marginBottom: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", marginTop: 22, color: colors.textSecondary, fontSize: 13 },
  linkBold: { color: colors.accent, fontWeight: "700" },
});
