import Foundation
import Combine

extension Notification.Name {
    static let newMessage = Notification.Name("newMessage")
}

struct ChatUser: Codable, Identifiable, Hashable {
    let id: String
    let username: String
    let avatarUrl: String?
}

struct ChatParticipant: Codable, Identifiable, Hashable {
    let userId: String
    let chatId: String
    let joinedAt: String?
    let user: ChatUser

    var id: String { userId }
}

struct Chat: Codable, Identifiable, Hashable {
    let id: String
    let name: String?
    let type: String
    let communityId: String?
    let createdAt: String?
    let participants: [ChatParticipant]?
    let lastMessage: Message?

    var displayName: String {
        if let name = name, !name.isEmpty { return name }
        if type == "COMMUNITY" { return name ?? "Сообщество" }
        return participants?.first { $0.userId != AuthManager.shared.currentUserId }?.user.username ?? "Чат"
    }

    var isGroup: Bool {
        type == "GROUP" || type == "COMMUNITY"
    }
}

struct Message: Codable, Identifiable, Hashable {
    let id: String
    let chatId: String
    let senderId: String
    let content: String
    let createdAt: String?
    let sender: ChatUser?

    var isMine: Bool {
        senderId == AuthManager.shared.currentUserId
    }

    var relativeTime: String {
        guard let createdAt = createdAt else { return "" }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: createdAt) else { return createdAt }
        let interval = Date().timeIntervalSince(date)
        switch interval {
        case 0..<60: return "сейчас"
        case 60..<3600: return "\(Int(interval / 60))м"
        case 3600..<86400: return "\(Int(interval / 3600))ч"
        default: return "\(Int(interval / 86400))д"
        }
    }
}

struct MessagesResponse: Codable {
    let messages: [Message]
    let total: Int
    let hasMore: Bool
}

struct CreateMessageRequest: Codable {
    let content: String
}

struct CreateGroupRequest: Codable {
    let name: String
    let participantIds: [String]
}

struct InviteRequest: Codable {
    let userIds: [String]
}

@MainActor
class ChatManager: ObservableObject {
    static let shared = ChatManager()

    @Published var chats: [Chat] = []
    @Published var isLoading = false

    private let network = NetworkManager.shared
    private var pollingTasks: [String: Task<Void, Never>] = [:]

    private init() {}

    func fetchChats() async {
        isLoading = true
        do {
            let chats: [Chat] = try await network.fetch(endpoint: "/chats")
            self.chats = chats
        } catch {
            print("Ошибка загрузки чатов: \(error)")
        }
        isLoading = false
    }

    func createChat(participantId: String) async -> Chat? {
        do {
            let body = ["participantId": participantId]
            let chat: Chat = try await network.post(endpoint: "/chats", body: body)
            if !chats.contains(where: { $0.id == chat.id }) {
                chats.insert(chat, at: 0)
            }
            return chat
        } catch {
            print("Ошибка создания чата: \(error)")
            return nil
        }
    }

    func fetchMessages(chatId: String, offset: Int = 0, limit: Int = 50) async -> MessagesResponse? {
        do {
            return try await network.fetch(endpoint: "/chats/\(chatId)/messages?offset=\(offset)&limit=\(limit)")
        } catch {
            print("Ошибка загрузки сообщений: \(error)")
            return nil
        }
    }

    func sendMessage(chatId: String, content: String) async -> Message? {
        do {
            let body = CreateMessageRequest(content: content)
            let message: Message = try await network.post(endpoint: "/chats/\(chatId)/messages", body: body)
            return message
        } catch {
            print("Ошибка отправки сообщения: \(error)")
            return nil
        }
    }

    func createGroupChat(name: String, participantIds: [String]) async -> Chat? {
        do {
            struct Community: Decodable { let id: String }
            let community: Community = try await network.post(endpoint: "/communities", body: CreateGroupRequest(name: name, participantIds: []))
            if !participantIds.isEmpty {
                let _: [String: String] = try await network.post(endpoint: "/communities/\(community.id)/invite", body: InviteRequest(userIds: participantIds))
            }
            try? await Task.sleep(nanoseconds: 500_000_000)
            let allChats: [Chat] = try await network.fetch(endpoint: "/chats")
            if let groupChat = allChats.first(where: { $0.communityId == community.id }) {
                if !chats.contains(where: { $0.id == groupChat.id }) {
                    chats.insert(groupChat, at: 0)
                }
                return groupChat
            }
            return nil
        } catch {
            print("Ошибка создания группы: \(error)")
            return nil
        }
    }

    func searchUsers(query: String) async -> [ChatUser] {
        do {
            return try await network.fetch(endpoint: "/profile/search?q=\(query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query)")
        } catch {
            print("Ошибка поиска пользователей: \(error)")
            return []
        }
    }

    func deleteMessage(chatId: String, messageId: String) async -> Bool {
        do {
            let _: [String: String] = try await network.delete(endpoint: "/chats/\(chatId)/messages/\(messageId)")
            return true
        } catch {
            print("Ошибка удаления сообщения: \(error)")
            return false
        }
    }

    func startPolling(chatId: String, onMessages: @escaping ([Message]) -> Void) {
        stopPolling(chatId: chatId)
        pollingTasks[chatId] = Task { [weak self] in
            while !Task.isCancelled {
                if let response = await self?.fetchMessages(chatId: chatId, offset: 0, limit: 50) {
                    await MainActor.run { onMessages(response.messages) }
                }
                try? await Task.sleep(nanoseconds: 3_000_000_000)
            }
        }
    }

    func stopPolling(chatId: String) {
        pollingTasks[chatId]?.cancel()
        pollingTasks.removeValue(forKey: chatId)
    }
}
