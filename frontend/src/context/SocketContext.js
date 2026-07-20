import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { BASE_URL } from "../api/api";

// BASE_URL already ends in /api — socket connects to the server root
const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

const SocketContext = createContext();

export const SocketProvider = ({ children, user }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token || !user) return;

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("connect", () => isMounted && setConnected(true));
      socket.on("disconnect", () => isMounted && setConnected(false));

      socketRef.current = socket;
    };

    connect();

    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
