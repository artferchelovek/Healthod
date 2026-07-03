
import SwiftUI
import Foundation
import Combine




struct Author: Codable {
    let id: String
    let username: String
    let avatarUrl: String? 
}

struct Post: Identifiable, Codable {
    let id: String
    let authorId: String
    let communityId: String?
    let type: String
    let title: String
    let content: String
    let imageUrl: String?
    let likesCount: Int
    let commentsCount: Int
    let createdAt: String
    let author: Author
    let isLiked: Bool

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        authorId = try container.decode(String.self, forKey: .authorId)
        communityId = try container.decodeIfPresent(String.self, forKey: .communityId)
        type = try container.decode(String.self, forKey: .type)
        title = try container.decode(String.self, forKey: .title)
        content = try container.decode(String.self, forKey: .content)
        imageUrl = try container.decodeIfPresent(String.self, forKey: .imageUrl)
        likesCount = try container.decode(Int.self, forKey: .likesCount)
        commentsCount = try container.decode(Int.self, forKey: .commentsCount)
        createdAt = try container.decode(String.self, forKey: .createdAt)
        author = try container.decode(Author.self, forKey: .author)
        isLiked = try container.decodeIfPresent(Bool.self, forKey: .isLiked) ?? false
    }
}

extension Post {
    var imageFullURL: URL? {
        guard let path = imageUrl, !path.isEmpty else { return nil }
        if path.hasPrefix("http") { return URL(string: path) }
        let clean = path.hasPrefix("/") ? String(path.dropFirst()) : path
        return URL(string: "https://api.health.lilv2dim.ru/\(clean)")
    }
    
    var relativeDate: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let date = formatter.date(from: createdAt) else {
            return createdAt
        }
        
        let interval = Date().timeIntervalSince(date)
        
        switch interval {
        case 0..<60: return "только что"
        case 60..<3600:
            let minutes = Int(interval / 60)
            let word = minutes == 1 ? "минуту" : minutes < 5 ? "минуты" : "минут"
            return "\(minutes) \(word) назад"
        case 3600..<86400:
            let hours = Int(interval / 3600)
            let word = hours == 1 ? "час" : hours < 5 ? "часа" : "часов"
            return "\(hours) \(word) назад"
        case 86400..<172800: return "вчера"
        case 172800..<259200: return "позавчера"
        default:
            let days = Int(interval / 86400)
            return "\(days) дней назад"
        }
    }
}

struct CreatePostRequest: Codable {
    let title: String
    let content: String
    let type: String
    let imageUrl: String?
}

struct Comment: Identifiable, Codable {
    let id: String
    let content: String
    let author: Author
    let createdAt: String

    var relativeDate: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: createdAt) else { return createdAt }
        let interval = Date().timeIntervalSince(date)
        switch interval {
        case 0..<60: return "только что"
        case 60..<3600:
            let m = Int(interval / 60)
            let w = m == 1 ? "минуту" : m < 5 ? "минуты" : "минут"
            return "\(m) \(w) назад"
        case 3600..<86400:
            let h = Int(interval / 3600)
            let w = h == 1 ? "час" : h < 5 ? "часа" : "часов"
            return "\(h) \(w) назад"
        case 86400..<172800: return "вчера"
        default:
            let d = Int(interval / 86400)
            return "\(d) дней назад"
        }
    }
}

struct CreateCommentRequest: Codable {
    let content: String
}

@MainActor
class PostManager: ObservableObject {
    static let shared = PostManager()

    @Published var posts: [Post] = []
    @Published var isLoading = false

    private let networkManager = NetworkManager.shared

    private init() {}

    func fetchPosts() async {
        isLoading = true
        do {
            let fetchedPosts: [Post] = try await networkManager.fetch(endpoint: "/posts")
            self.posts = fetchedPosts
            print("Успешно загружено постов: \(fetchedPosts.count)")
        } catch {
            print("Ошибка парсинга или загрузки постов: \(error)")
        }
        isLoading = false
    }

    func createPost(title: String, content: String, imageUrl: String? = nil) async -> Bool {
        let body = CreatePostRequest(title: title, content: content, type: "TEXT", imageUrl: imageUrl)
        do {
            try await networkManager.sendPost(endpoint: "/posts", body: body)
            await fetchPosts()
            return true
        } catch {
            print(error)
            return false
        }
    }

    func fetchComments(postId: String) async -> [Comment] {
        do {
            return try await networkManager.fetch(endpoint: "/posts/\(postId)/comments")
        } catch {
            print("❌ Ошибка загрузки комментариев: \(error)")
            return []
        }
    }

    func addComment(postId: String, content: String) async -> Bool {
        let body = CreateCommentRequest(content: content)
        do {
            try await networkManager.sendPost(endpoint: "/posts/\(postId)/comments", body: body)
            return true
        } catch {
            print("❌ Ошибка добавления комментария: \(error)")
            return false
        }
    }

    func deletePost(id: String) async -> Bool {
        do {
            let _: [String: String] = try await networkManager.delete(endpoint: "/posts/\(id)", body: ["": ""])
            posts.removeAll { $0.id == id }
            return true
        } catch {
            print("❌ Ошибка удаления поста: \(error)")
            return false
        }
    }
}

