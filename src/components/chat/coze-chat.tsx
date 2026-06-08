"use client";

import Script from "next/script";

declare global {
  interface Window {
    CozeWebSDK?: {
      WebChatClient: new (config: Record<string, unknown>) => void;
    };
  }
}

export default function CozeChat() {
  const botId = process.env.NEXT_PUBLIC_COZE_BOT_ID || "";
  const pat = process.env.NEXT_PUBLIC_COZE_PAT || "";

  if (!botId || !pat) return null;

  return (
    <Script
      src="https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined" && window.CozeWebSDK) {
          new window.CozeWebSDK.WebChatClient({
            config: {
              bot_id: botId,
            },
            componentProps: {
              title: "圆锥曲线答疑",
            },
            auth: {
              type: "token",
              token: pat,
              onRefreshToken: () => pat,
            },
          });
        }
      }}
    />
  );
}
