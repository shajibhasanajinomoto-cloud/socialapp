import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import AppNavigator from "./src/navigation/AppNavigator";

// Small bridge so SocketProvider can access the logged-in user from AuthContext
function AppContent() {
  const { user } = useAuth();
  return (
    <SocketProvider user={user}>
      <AppNavigator />
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
