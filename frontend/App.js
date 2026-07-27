import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import AppNavigator, { navigationRef } from "./src/navigation/AppNavigator";
import IncomingCallBanner from "./src/components/IncomingCallBanner";
import { registerForPushNotifications } from "./src/utils/pushNotifications";

// Small bridge so SocketProvider can access the logged-in user from AuthContext
function AppContent() {
  const { user } = useAuth();
  const responseListener = useRef();

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    // Handles the user tapping a push notification (from the notification tray,
    // including when the app was fully closed) and routes them to the right screen.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (!data || !navigationRef.current) return;

      if (data.type === "call") {
        // We don't have the SDP offer here (that only arrives live via socket),
        // so just bring the user into the app; the in-app incoming-call banner
        // will still catch it if the call is still ringing when the socket reconnects.
        navigationRef.current.navigate("Main", { screen: "Chats" });
      } else if (data.type === "message") {
        navigationRef.current.navigate("Chat", { otherUserId: data.senderId });
      } else if (data.type === "friend_request" || data.type === "friend_accept") {
        navigationRef.current.navigate("Friends");
      } else if (data.type === "like" || data.type === "comment") {
        navigationRef.current.navigate("Comments", { postId: data.postId });
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <SocketProvider user={user}>
      <AppNavigator />
      <IncomingCallBanner navigationRef={navigationRef} />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppContent />
    </AuthProvider>
  );
}
