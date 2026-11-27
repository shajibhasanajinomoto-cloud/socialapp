import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageBubble from "../components/MessageBubble";
import { colors } from "../theme";

export default function ChatScreen({ route, navigation }) {
  const { otherUserId, otherUserName } = route.params;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [online, setOnline] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const flatListRef = useRef(null);

  const conversationId = [String(user.id), String(otherUserId)].sort().join("_");

  // Header: name + Online/Offline, call buttons
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={styles.headerName}>{otherUserName || "Chat"}</Text>
          <Text style={[styles.headerStatus, online && styles.headerStatusOnline]}>
            {online ? "Online" : "Offline"}
          </Text>
        </View>
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => startCall("audio")} style={{ marginRight: 18 }}>
            <Ionicons name="call-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => startCall("video")} style={{ marginRight: 6 }}>
            <Ionicons name="videocam-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, otherUserName, online]);

  // Load history
  useEffect(() => {
    api.get(`/messages/${otherUserId}`).then((res) => setMessages(res.data.messages));
  }, [otherUserId]);

  // Presence (needs the updated socketHandler.js on the server)
  useEffect(() => {
    if (!socket) return;

    socket.emit("check_online", { userId: otherUserId }, (isOnline) => setOnline(!!isOnline));

    const handleOnline = ({ userId }) => userId === otherUserId && setOnline(true);
    const handleOffline = ({ userId }) => userId === otherUserId && setOnline(false);
    socket.on("user_online", handleOnline);
    socket.on("user_offline", handleOffline);

    return () => {
      socket.off("user_online", handleOnline);
      socket.off("user_offline", handleOffline);
    };
  }, [socket, otherUserId]);

  // Live messages + read receipts
  useEffect(() => {
    if (!socket) return;

    // Tell the server we have seen everything in this chat
    socket.emit("mark_read", { conversationId });

    const handleReceive = (message) => {
      if (message.senderId === otherUserId) {
        setMessages((prev) => [...prev, message]);
        socket.emit("mark_read", { conversationId });
      }
    };

    const handleSent = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    // The other person opened the chat -> our messages become "read"
    const handleRead = (data) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderId === user.id ? { ...m, status: "read" } : m))
      );
    };

    socket.on("receive_message", handleReceive);
    socket.on("message_sent", handleSent);
    socket.on("messages_read", handleRead);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("message_sent", handleSent);
      socket.off("messages_read", handleRead);
    };
  }, [socket, otherUserId, conversationId]);

  const handleSend = () => {
    if (!text.trim() || !socket) return;
    socket.emit("send_message", { receiverId: otherUserId, content: text.trim() });
    setText("");
  };

  const startCall = (callType) => {
    navigation.navigate("Call", {
      otherUserId,
      otherUserName: otherUserName || "User",
      callType,
      mode: "outgoing",
    });
  };

  // ----- Image sharing (with preview before sending) -----
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (result.canceled) return;
    setPreviewUri(result.assets[0].uri);
  };

  const confirmSendImage = async () => {
    const uri = previewUri;
    setPreviewUri(null);
    if (!uri) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "chat-image.jpg",
        type: "image/jpeg",
      });
      formData.append("mediaType", "image");

      const res = await api.post("/messages/upload-media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      socket.emit("send_message", {
        receiverId: otherUserId,
        mediaUrl: res.data.mediaUrl,
        mediaType: "image",
      });
    } catch (err) {
      Alert.alert("Failed to send image", err.response?.data?.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  // ----- Voice notes -----
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Microphone access is required to record voice notes.");
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert("Recording failed", "Could not start recording.");
    }
  };

  const stopAndSendRecording = async () => {
    if (!recording) return;
    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      setUploading(true);
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "voice-note.m4a",
        type: "audio/m4a",
      });
      formData.append("mediaType", "voice");

      const res = await api.post("/messages/upload-media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      socket.emit("send_message", {
        receiverId: otherUserId,
        mediaUrl: res.data.mediaUrl,
        mediaType: "voice",
      });
    } catch (err) {
      Alert.alert("Failed to send voice note", err.response?.data?.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {
      // already stopped
    }
    setRecording(null);
  };

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const canSend = text.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={({ item }) => <MessageBubble message={item} isOwn={item.senderId === user.id} />}
        onContentSizeChange={scrollToEnd}
        contentContainerStyle={{ paddingVertical: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={46} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Say hello</Text>
            <Text style={styles.emptySub}>Send your first message to {otherUserName || "them"}.</Text>
          </View>
        }
      />

      {uploading && (
        <View style={styles.uploadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.uploadingText}>Sending...</Text>
        </View>
      )}

      {isRecording ? (
        <View style={styles.recordingRow}>
          <Text style={styles.recordingText}>🔴 Recording voice note...</Text>
          <TouchableOpacity onPress={cancelRecording} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={stopAndSendRecording} style={styles.sendVoiceBtn}>
            <Text style={styles.sendVoiceText}>Send</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handlePickImage} style={styles.iconBtn}>
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={startRecording} style={styles.iconBtn}>
            <Ionicons name="mic-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Photo preview before sending */}
      <Modal visible={!!previewUri} animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.previewWrap}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.previewBar}>
            <TouchableOpacity style={styles.previewCancel} onPress={() => setPreviewUri(null)}>
              <Text style={styles.previewCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewSend} onPress={confirmSendImage}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.previewSendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "700" },
  headerStatus: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  headerStatusOnline: { color: "#9BF2C6" },

  emptyWrap: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginTop: 12 },
  emptySub: { color: colors.textSecondary, textAlign: "center", marginTop: 6 },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconBtn: { paddingHorizontal: 5, paddingVertical: 10 },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.45 },

  uploadingRow: { flexDirection: "row", alignItems: "center", padding: 8, paddingLeft: 16 },
  uploadingText: { marginLeft: 8, color: colors.textSecondary, fontSize: 12 },

  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.dangerSoft,
  },
  recordingText: { flex: 1, color: colors.danger, fontWeight: "600", fontSize: 13 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 6 },
  cancelText: { color: colors.textSecondary, fontWeight: "600" },
  sendVoiceBtn: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  sendVoiceText: { color: "#fff", fontWeight: "700" },

  previewWrap: { flex: 1, backgroundColor: "#000" },
  previewImage: { flex: 1 },
  previewBar: { flexDirection: "row", padding: 16, paddingBottom: 30, gap: 12 },
  previewCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  previewCancelText: { color: "#fff", fontWeight: "600" },
  previewSend: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  previewSendText: { color: "#fff", fontWeight: "700" },
});
