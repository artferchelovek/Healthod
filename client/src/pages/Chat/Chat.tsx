import styles from "./Chat.module.css";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Message {
  id: string;
  sender: "user" | "other" | "ai";
  text: string;
  time: string;
}

interface ChatItem {
  id: string;
  name: string;
  avatarColor: string;
  isAi: boolean;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
}

const INITIAL_CHATS: ChatItem[] = [
  {
    id: "ai-assistant",
    name: "Healthod AI (Ваш тренер)",
    avatarColor: "var(--mustard)",
    isAi: true,
    lastMessage: "Привет! Я твой ИИ-тренер. Спроси меня о тренировках или питании!",
    time: "12:45",
    unreadCount: 0,
    online: true,
  },
  {
    id: "artem",
    name: "Шутов Артём",
    avatarColor: "#D9E3D4",
    isAi: false,
    lastMessage: "Поешь ещё вкусных овощей.. Идём гулять?",
    time: "12:32",
    unreadCount: 2,
    online: true,
  },
  {
    id: "marina",
    name: "Марина Волкова",
    avatarColor: "#F5DDCE",
    isAi: false,
    lastMessage: "Скинь план тренировок на неделю",
    time: "вчера",
    unreadCount: 0,
    online: false,
  },
  {
    id: "yoga",
    name: "Йога-клуб",
    avatarColor: "#ECE5D3",
    isAi: false,
    lastMessage: "Аня: жду всех в субботу в 9:00",
    time: "вчера",
    unreadCount: 0,
    online: false,
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "ai-assistant": [
    {
      id: "ai-1",
      sender: "ai",
      text: "Привет! Рад знакомству. Я персональный ассистент Healthod. Я могу помочь составить программу тренировок, рассчитать БЖУ блюда или дать совет по питанию. О чем бы ты хотел узнать?",
      time: "12:00",
    },
  ],
  artem: [
    {
      id: "artem-1",
      sender: "other",
      text: "Привет! Как успехи сегодня в зале?",
      time: "12:30",
    },
    {
      id: "artem-2",
      sender: "other",
      text: "Поешь ещё вкусных овощей.. Идём гулять?",
      time: "12:32",
    },
  ],
  marina: [
    {
      id: "marina-1",
      sender: "other",
      text: "Привет! Скинь план тренировок на неделю",
      time: "Вчера",
    },
  ],
  yoga: [
    {
      id: "yoga-1",
      sender: "other",
      text: "Аня: жду всех в субботу в 9:00. Возьмите с собой коврики и воду!",
      time: "Вчера",
    },
  ],
};

export default function Chat() {
  const [activeTab, setActiveTab] = useState<"personal" | "community">("personal");
  const [chats, setChats] = useState<ChatItem[]>(INITIAL_CHATS);
  
  const navigate = useNavigate();
  const { id: selectedChatId } = useParams<{ id: string }>();

  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedAiHistory = localStorage.getItem("healthod_ai_chat_history");
    if (savedAiHistory) {
      try {
        const parsed = JSON.parse(savedAiHistory);
        setMessages((prev) => ({
          ...prev,
          "ai-assistant": parsed,
        }));
        
        if (parsed.length > 0) {
          const lastMsg = parsed[parsed.length - 1];
          setChats((prevChats) =>
            prevChats.map((c) =>
              c.id === "ai-assistant"
                ? { ...c, lastMessage: lastMsg.text, time: lastMsg.time }
                : c
            )
          );
        }
      } catch (e) {
        console.error("Не удалось подгрузить историю чата из localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  const handleSelectChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const askGemini = async (userMsg: string, chatHistory: Message[]): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return "Режим оффлайн: Я вижу твой вопрос! К сожалению, ключ VITE_GEMINI_API_KEY не задан в .env файле фронтенда, поэтому я отвечаю в демонстрационном режиме. Как только ты добавишь ключ и включишь VPN, мы сможем общаться в полноценном режиме ИИ-диалога!";
    }

    try {
      const formattedContents = chatHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      formattedContents.push({
        role: "user",
        parts: [{ text: userMsg }],
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              parts: [
                {
                  text: "Ты — умный фитнес-тренер и спортивный диетолог в приложении Healthod. Отвечай кратко, профессионально и дружелюбно на русском языке. Давай полезные советы по тренировкам, упражнениям и питанию.",
                },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API response status: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return aiText || "Хм, я не смог сформулировать ответ. Попробуй спросить по-другому!";
    } catch (err) {
      console.error("Ошибка Gemini API в чате:", err);
      return "Ошибка подключения к ИИ. Пожалуйста, убедитесь, что ваш VPN включен и в настройках указан верный API-ключ.";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    const currentText = inputText.trim();
    setInputText("");

    const now = new Date();
    const timeString = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: currentText,
      time: timeString,
    };

    const updatedChatMessages = [...(messages[selectedChatId] || []), userMessage];
    setMessages((prev) => ({
      ...prev,
      [selectedChatId]: updatedChatMessages,
    }));

    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === selectedChatId ? { ...c, lastMessage: currentText, time: timeString } : c
      )
    );

    if (selectedChatId === "ai-assistant") {
      setLoading(true);
      try {
        const aiResponseText = await askGemini(currentText, messages["ai-assistant"] || []);
        
        const aiMessage: Message = {
          id: `msg-ai-${Date.now()}`,
          sender: "ai",
          text: aiResponseText,
          time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        };

        const finalMessages = [...updatedChatMessages, aiMessage];
        setMessages((prev) => ({
          ...prev,
          "ai-assistant": finalMessages,
        }));

        localStorage.setItem("healthod_ai_chat_history", JSON.stringify(finalMessages));

        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === "ai-assistant"
              ? { ...c, lastMessage: aiResponseText, time: aiMessage.time }
              : c
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      setTimeout(() => {
        const replyText =
          selectedChatId === "artem"
            ? "Отлично! Я сейчас немного занят на тренировке, отвечу чуть позже. 👍"
            : "Хорошо, договорились!";

        const replyMessage: Message = {
          id: `msg-reply-${Date.now()}`,
          sender: "other",
          text: replyText,
          time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => ({
          ...prev,
          [selectedChatId]: [...(prev[selectedChatId] || []), replyMessage],
        }));

        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === selectedChatId
              ? { ...c, lastMessage: replyText, time: replyMessage.time }
              : c
          )
        );
        setLoading(false);
      }, 1000);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "personal") {
      return matchesSearch && chat.id !== "yoga";
    } else {
      return matchesSearch && chat.id === "yoga";
    }
  });

  const activeChat = chats.find((c) => c.id === selectedChatId);
  const activeChatMessages = selectedChatId ? messages[selectedChatId] || [] : [];

  return (
    <div className={styles.container}>
      {!selectedChatId ? (
        <div className={styles.listView}>
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--inf-soft)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.tabsRow}>
            <button
              className={`${styles.tabBtn} ${activeTab === "personal" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              Личные
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "community" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("community")}
            >
              Сообщества
            </button>
          </div>

          <div className={styles.chatsList}>
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`${styles.chatCard} ${chat.isAi ? styles.aiCardSpecial : ""}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className={styles.avatarWrapper}>
                    <div 
                      className={styles.avatar} 
                      style={{ backgroundColor: chat.avatarColor }}
                    >
                      {chat.isAi ? (
                        <svg className="aiSparkIcon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        </svg>
                      ) : (
                        chat.name.charAt(0)
                      )}
                    </div>
                    {chat.online && <div className={styles.onlineIndicator}></div>}
                  </div>
                  
                  <div className={styles.chatDetails}>
                    <div className={styles.chatMeta}>
                      <span className={`${styles.chatName} ${chat.isAi ? styles.aiNameText : ""}`}>
                        {chat.name}
                      </span>
                      <span className={styles.chatTime}>{chat.time}</span>
                    </div>
                    <div className={styles.chatMessagePreview}>
                      {chat.lastMessage}
                    </div>
                  </div>

                  {chat.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>{chat.unreadCount}</div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>Чаты не найдены</div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.chatRoomView}>
          <div className={styles.chatRoomHeader}>
            <button className={styles.backBtn} onClick={() => navigate("/chat")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            
            <div className={styles.chatHeaderInfo}>
              <div 
                className={styles.chatHeaderAvatar}
                style={{ backgroundColor: activeChat?.avatarColor }}
              >
                {activeChat?.isAi ? (
                  <svg className="aiSparkIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                ) : (
                  activeChat?.name.charAt(0)
                )}
              </div>
              <div>
                <div className={styles.chatHeaderName}>{activeChat?.name}</div>
                <div className={styles.chatHeaderStatus}>
                  {activeChat?.online ? "в сети" : ""}
                </div>
              </div>
            </div>

            <div className={styles.headerSpacer}></div>
          </div>

          <div className={styles.messagesContainer}>
            {activeChatMessages.map((msg) => {
              const isUser = msg.sender === "user";
              const isAi = msg.sender === "ai";

              return (
                <div
                  key={msg.id}
                  className={`${styles.messageWrapper} ${
                    isUser ? styles.userWrapper : styles.otherWrapper
                  }`}
                >
                  <div
                    className={`${styles.messageBubble} ${
                      isUser
                        ? styles.userBubble
                        : isAi
                        ? styles.aiBubble
                        : styles.otherBubble
                    }`}
                  >
                    <p className={styles.messageText}>{msg.text}</p>
                    <span className={styles.messageTime}>{msg.time}</span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className={styles.messageWrapper + " " + styles.otherWrapper}>
                <div className={`${styles.messageBubble} ${styles.aiBubble} ${styles.typingBubble}`}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={styles.chatInputForm}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Cообщение..."
              className={styles.chatInputField}
              disabled={loading}
              required
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={loading || !inputText.trim()}
              aria-label="Отправить"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
