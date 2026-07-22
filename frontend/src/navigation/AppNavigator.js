import React from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, TouchableOpacity } from "react-native";

import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import FeedScreen from "../screens/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";
import CommentsScreen from "../screens/CommentsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SearchScreen from "../screens/SearchScreen";
import FriendsScreen from "../screens/FriendsScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import GroupsScreen from "../screens/GroupsScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import StoryViewerScreen from "../screens/StoryViewerScreen";
import CallScreen from "../screens/CallScreen";

export const navigationRef = createNavigationContainerRef();

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function FeedHeaderRight({ navigation }) {
  return (
    <>
      <TouchableOpacity onPress={() => navigation.navigate("Friends")} style={{ marginRight: 14 }}>
        <Text style={{ fontSize: 18 }}>🧑‍🤝‍🧑</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Search")} style={{ marginRight: 14 }}>
        <Text style={{ fontSize: 18 }}>🔍</Text>
      </TouchableOpacity>
    </>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={({ navigation }) => ({
          tabBarIcon: () => <Text>🏠</Text>,
          headerRight: () => <FeedHeaderRight navigation={navigation} />,
        })}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{ tabBarIcon: () => <Text>👥</Text> }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarIcon: () => <Text>🔔</Text> }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{ tabBarIcon: () => <Text>💬</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <Text>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // could show a splash/loading spinner here

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? (
        <RootStack.Navigator>
          <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <RootStack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
          <RootStack.Screen
            name="Comments"
            component={CommentsScreen}
            options={{ title: "Comments" }}
          />
          <RootStack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
          <RootStack.Screen name="Friends" component={FriendsScreen} options={{ title: "Friends" }} />
          <RootStack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ title: "Profile" }}
          />
          <RootStack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{ title: "Create Group" }}
          />
          <RootStack.Screen
            name="GroupDetail"
            component={GroupDetailScreen}
            options={{ title: "Group" }}
          />
          <RootStack.Screen
            name="StoryViewer"
            component={StoryViewerScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <RootStack.Screen
            name="Call"
            component={CallScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
        </RootStack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
