import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import AppNavigator, { navigationRef } from "./src/navigation/AppNavigator";
import IncomingCallBanner from "./src/components/IncomingCallBanner";

// Small bridge so SocketProvider can access the logged-in user from AuthContext
function AppContent() {
  const { user } = useAuth();
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
