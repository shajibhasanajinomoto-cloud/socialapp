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
} from "react-native";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageBubble from "../components/MessageBubble";

export default function ChatScreen({ route }) {
  const { otherUserId } = route.params;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const flatListRef = useRef(null);

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

      <View style={styles.inputRow}>
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendText: { color: "#fff", fontWeight: "600" },
});
