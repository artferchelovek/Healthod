import SwiftUI

struct ChatListView: View {
    @StateObject private var manager = ChatManager.shared
    @State private var isLoading = false

    var body: some View {
        Group {
            if manager.chats.isEmpty && !manager.isLoading {
                VStack(spacing: 12) {
                    Image(systemName: "message")
                        .font(.system(size: 40))
                        .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                    Text("Нет сообщений")
                        .font(.headline)
                        .foregroundColor(.gray)
                    Text("Начните общение с другими пользователями")
                        .font(.subheadline)
                        .foregroundColor(.gray)

                    NavigationLink(destination: JoinGroupView()) {
                        Label("Присоединиться по коду", systemImage: "person.badge.plus")
                            .font(.subheadline)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color(red: 0.31, green: 0.40, blue: 0.33))
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(manager.chats) { chat in
                        NavigationLink(value: chat) {
                            ChatRow(chat: chat)
                        }
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    await manager.fetchChats()
                }
            }
        }
        .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
        .navigationTitle("Сообщения")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Chat.self) { chat in
            ChatDetailView(chat: chat)
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    NavigationLink(destination: CreateGroupView()) {
                        Label("Создать группу", systemImage: "person.3")
                    }
                    NavigationLink(destination: JoinGroupView()) {
                        Label("Присоединиться по коду", systemImage: "person.badge.plus")
                    }
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .semibold))
                }
            }
        }
        .task { await manager.fetchChats() }
    }
}

struct ChatRow: View {
    let chat: Chat

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [
                        Color(red: 0.85, green: 0.89, blue: 0.83),
                        Color(red: 0.96, green: 0.87, blue: 0.81)
                    ], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 48, height: 48)
                Image(systemName: chat.isGroup ? "person.2.fill" : "person.fill")
                    .font(.system(size: 18))
                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(chat.displayName)
                        .font(.system(size: 16, weight: .semibold))
                    if chat.isGroup, let count = chat.participants?.count {
                        Text("\(count)")
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.gray.opacity(0.15))
                            .cornerRadius(8)
                    }
                }

                if let last = chat.lastMessage {
                    Text(last.content)
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                } else {
                    Text("Нет сообщений")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                }
            }

            Spacer()

            if let last = chat.lastMessage {
                Text(last.relativeTime)
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 4)
    }
}
