"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const { data: session, status } = useSession();

  // Depend on the id string, NOT the session object. useSession() returns a
  // fresh object on every refetch (periodic, and on window focus), so a
  // `session` dependency tore down and reopened the socket over and over for
  // the whole time a user had the app open.
  const userId = session?.user?.id;

  useEffect(() => {
    if (status === "loading") return;

    // Connect only when we have a userId to identify the socket with
    const token = userId;
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
    const s = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [userId, status]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}