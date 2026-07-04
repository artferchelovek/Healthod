import styles from "./Chat.module.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/logic/api";
import { getUserIdFromToken } from "@/logic/utils";
import { connectSocket, onNewMessage, joinChat, leaveChat } from "@/logic/socket";
import { getMyChats, getChatMessages, createChat, sendMessage } from "@/logic/chat";
import type { Chat as ChatType, ChatMessage, ChatUser } from "@/logic/chat";

const AI_CHAT_ID = "ai-assistant";

export default function Chat() {
  const { id: selectedChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [chats, setChats] = useState<ChatType[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [foundUsers, setFoundUsers] = useState<(ChatUser & { isFollowing: boolean })[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const userId = getUserIdFromToken();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = selectedChatId && selectedChatId !== AI_CHAT_ID
    ? chats.find((c) => c.id === selectedChatId)
    : null;

  const otherParticipant = currentChat
    ? currentChat.participants.find((p) => p.userId !== userId)?.user
    : null;

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await getMyChats();
        setChats(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    connectSocket();
  }, []);

  useEffect(() => {
    if (!selectedChatId || selectedChatId === AI_CHAT_ID) return;

    const loadMessages = async () => {
      try {
        const data = await getChatMessages(selectedChatId);
        setMessages(data.messages);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error(err);
      }
    };
    loadMessages();

    joinChat(selectedChatId);
    return () => {
      leaveChat(selectedChatId);
    };
  }, [selectedChatId]);

  useEffect(() => {
    const unsub = onNewMessage((msg: ChatMessage) => {
      if (selectedChatId && msg.chatId === selectedChatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      setChats((prev) => prev.map((c) => (c.id === msg.chatId ? { ...c, lastMessage: msg } : c)));
    });

    return unsub;
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      if (selectedChatId === AI_CHAT_ID) {
        const userMsg = { id: `msg-${Date.now()}`, chatId: AI_CHAT_ID, senderId: userId || "", content: text, createdAt: new Date().toISOString(), sender: { id: "", username: "Вы", avatarUrl: null } };
        setMessages((prev) => [...prev, userMsg]);

        const aiText = await askGemini(text);
        const aiMsg = { id: `msg-ai-${Date.now()}`, chatId: AI_CHAT_ID, senderId: "ai", content: aiText, createdAt: new Date().toISOString(), sender: { id: "ai", username: "Healthod AI", avatarUrl: null } };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const msg = await sendMessage(selectedChatId, text);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setChats((prev) => prev.map((c) => c.id === selectedChatId ? { ...c, lastMessage: msg } : c));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const askGemini = async (userMsg: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 1500));
      return "Режим оффлайн: Я вижу твой вопрос! К сожалению, ключ VITE_GEMINI_API_KEY не задан в .env файле фронтенда, поэтому я отвечаю в демонстрационном режиме. Как только ты добавишь ключ и включишь VPN, мы сможем общаться в полноценном режиме ИИ-диалога!";
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userMsg }] }],
            systemInstruction: { parts: [{ text: "Ты — умный фитнес-тренер и спортивный диетолог в приложении Healthod. Отвечай кратко, профессионально и дружелюбно на русском языке." }] },
          }),
        }
      );
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Не смог сформулировать ответ.";
    } catch {
      return "Ошибка подключения к ИИ. Проверь API-ключ и VPN.";
    }
  };

  const handleSearchUsers = async (q: string) => {
    setUserQuery(q);
    if (!q.trim()) { setFoundUsers([]); return; }
    try {
      const res = await api.get(`/profile/search?q=${encodeURIComponent(q)}`);
      setFoundUsers(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleStartChat = async (participantId: string) => {
    try {
      const chat = await createChat(participantId);
      setChats((prev) => {
        if (prev.some((c) => c.id === chat.id)) return prev;
        return [chat, ...prev];
      });
      setShowNewChat(false);
      navigate(`/chat/${chat.id}`);
    } catch (err) { console.error(err); }
  };

  const loadMore = async () => {
    if (!selectedChatId || selectedChatId === AI_CHAT_ID) return;
    try {
      const data = await getChatMessages(selectedChatId, messages.length);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } catch (err) { console.error(err); }
  };

  const chatList = [
    { id: AI_CHAT_ID, name: "Healthod AI", avatarUrl: null, online: true, lastMsg: "Спроси меня о тренировках!" },
    ...chats.map((c) => {
      const other = c.participants.find((p) => p.userId !== userId)?.user;
      return { id: c.id, name: other?.username || "Чат", avatarUrl: other?.avatarUrl || null, online: false, lastMsg: c.lastMessage?.content || "" };
    }),
  ];

  if (!selectedChatId) {
    return (
      <div className={styles.container}>
        <div className={styles.listView}>
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--inf-soft)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Поиск" className={styles.searchInput} />
            </div>
            <button className={styles.newChatBtn} onClick={() => setShowNewChat(!showNewChat)}>
              <span className="msym" style={{ fontSize: 20 }}>edit</span>
            </button>
          </div>

          {showNewChat && (
            <div className={styles.newChatPanel}>
              <input type="text" placeholder="Поиск пользователей..." value={userQuery} onChange={(e) => handleSearchUsers(e.target.value)} className={styles.searchInput} autoFocus />
              {foundUsers.map((u) => (
                <div key={u.id} className={styles.userRow} onClick={() => handleStartChat(u.id)}>
                  <div className={styles.avatarSmall}>{u.username.charAt(0).toUpperCase()}</div>
                  <span>{u.username}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.chatsList}>
            {chatList.map((chat) => (
              <div key={chat.id} className={`${styles.chatCard} ${chat.id === AI_CHAT_ID ? styles.aiCardSpecial : ""}`} onClick={() => handleSelectChat(chat.id)}>
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatar} style={{ backgroundColor: chat.id === AI_CHAT_ID ? "var(--mustard)" : "var(--green-soft)" }}>
                    {chat.id === AI_CHAT_ID ? (
                      <svg className="aiSparkIcon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                    ) : chat.avatarUrl ? (
                      <img src={chat.avatarUrl} alt="" className={styles.avatarImg} />
                    ) : (
                      chat.name.charAt(0)
                    )}
                  </div>
                </div>
                <div className={styles.chatDetails}>
                  <div className={styles.chatMeta}>
                    <span className={`${styles.chatName} ${chat.id === AI_CHAT_ID ? styles.aiNameText : ""}`}>{chat.name}</span>
                  </div>
                  <div className={styles.chatMessagePreview}>{chat.lastMsg}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.chatRoomView}>
        <div className={styles.chatRoomHeader}>
          <button className={styles.backBtn} onClick={() => navigate("/chat")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <div className={styles.chatHeaderInfo}>
            <div className={styles.chatHeaderAvatar} style={{ backgroundColor: selectedChatId === AI_CHAT_ID ? "var(--mustard)" : "var(--green-soft)" }}>
              {selectedChatId === AI_CHAT_ID ? (
                <svg className="aiSparkIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
              ) : (
                otherParticipant?.username?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
            <div>
              <div className={styles.chatHeaderName}>{selectedChatId === AI_CHAT_ID ? "Healthod AI" : otherParticipant?.username || "Чат"}</div>
            </div>
          </div>
        </div>

        <div className={styles.messagesContainer}>
          {selectedChatId !== AI_CHAT_ID && hasMore && (
            <button className={styles.loadMoreBtn} onClick={loadMore}>Загрузить ещё</button>
          )}
          {messages.map((msg) => {
            const isUser = msg.senderId === userId;
            return (
              <div key={msg.id} className={`${styles.messageWrapper} ${isUser ? styles.userWrapper : styles.otherWrapper}`}>
                <div className={`${styles.messageBubble} ${isUser ? styles.userBubble : selectedChatId === AI_CHAT_ID ? styles.aiBubble : styles.otherBubble}`}>
                  <p className={styles.messageText}>{msg.content}</p>
                  <span className={styles.messageTime}>{new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
          {sending && (
            <div className={`${styles.messageWrapper} ${styles.otherWrapper}`}>
              <div className={`${styles.messageBubble} ${styles.aiBubble} ${styles.typingBubble}`}>
                <div className={styles.typingIndicator}><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className={styles.chatInputForm}>
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Сообщение..." className={styles.chatInputField} disabled={sending} required />
          <button type="submit" className={styles.sendBtn} disabled={sending || !inputText.trim()} aria-label="Отправить">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
