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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageBubble from "../components/MessageBubble";

export default function ChatScreen({ route, navigation }) {
  const { otherUserId, otherUserName } = route.params;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUserName || "Chat",
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => startCall("audio")} style={{ marginRight: 18 }}>
            <Text style={{ fontSize: 20 }}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => startCall("video")} style={{ marginRight: 14 }}>
            <Text style={{ fontSize: 20 }}>🎥</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, otherUserName]);

  useEffect(() => {
    api.get(`/messages/${otherUserId}`).then((res) => setMessages(res.data.messages));
  }, [otherUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message) => {
      if (message.senderId === otherUserId || message.receiverId === otherUserId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleSent = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("receive_message", handleReceive);
    socket.on("message_sent", handleSent);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("message_sent", handleSent);
    };
  }, [socket, otherUserId]);

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

  // ----- Image sharing -----
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: result.assets[0].uri,
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
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user.id} />
        )}
        onContentSizeChange={scrollToEnd}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {uploading && (
        <View style={styles.uploadingRow}>
          <ActivityIndicator size="small" color="#2563eb" />
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
            <Text style={styles.sendVoiceText}>Send ✓</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handlePickImage} style={styles.iconBtn}>
            <Text style={styles.iconText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startRecording} style={styles.iconBtn}>
            <Text style={styles.iconText}>🎙️</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  iconText: { fontSize: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
  },
  sendButton: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendText: { color: "#fff", fontWeight: "600" },
  uploadingRow: { flexDirection: "row", alignItems: "center", padding: 8, paddingLeft: 16 },
  uploadingText: { marginLeft: 8, color: "#777", fontSize: 12 },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fef2f2",
  },
  recordingText: { flex: 1, color: "#dc2626", fontWeight: "600", fontSize: 13 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 6 },
  cancelText: { color: "#777", fontWeight: "600" },
  sendVoiceBtn: { backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  sendVoiceText: { color: "#fff", fontWeight: "600" },
});
