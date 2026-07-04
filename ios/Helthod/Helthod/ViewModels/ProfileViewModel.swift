import Foundation
import SwiftUI
import Combine
struct UserProfile: Decodable {
    let id: String
    let email: String?
    let username: String
    let age: Int?
    let weight: Double?
    let height: Double?
    let goal: String?
    let createdAt: String?
    let isFollowing: Bool?
    let followersCount: Int?

    static let goals = ["LOSE_WEIGHT", "GAIN_MUSCLE", "MAINTAIN"]

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decodeIfPresent(String.self, forKey: .id)
            ?? container.decode(String.self, forKey: ._id)
        email = try container.decodeIfPresent(String.self, forKey: .email)
        username = try container.decode(String.self, forKey: .username)
        age = try container.decodeIfPresent(Int.self, forKey: .age)
        weight = try container.decodeIfPresent(Double.self, forKey: .weight)
        height = try container.decodeIfPresent(Double.self, forKey: .height)
        goal = try container.decodeIfPresent(String.self, forKey: .goal)
        createdAt = try container.decodeIfPresent(String.self, forKey: .createdAt)
        isFollowing = try container.decodeIfPresent(Bool.self, forKey: .isFollowing)
        followersCount = try container.decodeIfPresent(Int.self, forKey: .followersCount)
    }

    enum CodingKeys: String, CodingKey {
        case id, _id, email, username, age, weight, height, goal, createdAt, isFollowing, followersCount
    }

    var goalDisplay: String {
        switch goal {
        case "LOSE_WEIGHT": return "Сбросить вес"
        case "GAIN_MUSCLE": return "Набрать массу"
        case "MAINTAIN": return "Поддерживать форму"
        default: return goal ?? ""
        }
    }

    var relativeDate: String {
        guard let createdAt = createdAt else { return "" }
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

struct ProfileResponse: Decodable {
    let user: UserProfile
    let posts: [Post]
}

struct UpdateProfileRequest: Encodable {
    let username: String
    let age: Int
    let weight: Double
    let height: Double
    let goal: String
}

struct FollowResponse: Decodable {
    let isFollowing: Bool?
}

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var error: String?
    @Published var saveError: String?
    @Published var showingSettings = false

    private let network = NetworkManager.shared

    func fetchProfile() async {
        isLoading = true
        error = nil
        do {
            let profile: UserProfile = try await network.fetch(endpoint: "/auth/me")
            self.profile = profile
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func updateProfile(username: String, age: Int, weight: Double, height: Double, goal: String) async -> Bool {
        isSaving = true
        saveError = nil
        let body = UpdateProfileRequest(username: username, age: age, weight: weight, height: height, goal: goal)
        do {
            try await network.sendPatch(endpoint: "/profile", body: body)
            await fetchProfile()
            isSaving = false
            return true
        } catch {
            saveError = error.localizedDescription
            isSaving = false
            return false
        }
    }

    func fetchUser(id: String) async -> (user: UserProfile, posts: [Post], isFollowing: Bool)? {
        do {
            let response: ProfileResponse = try await network.fetch(endpoint: "/profile/\(id)")
            return (response.user, response.posts, response.user.isFollowing ?? false)
        } catch {
            print(" Ошибка загрузки профиля пользователя: \(error)")
            return nil
        }
    }

    func followUser(id: String) async -> Bool {
        do {
            let response: FollowResponse = try await network.post(endpoint: "/profile/\(id)/follow", body: ["": ""])
            return response.isFollowing ?? true
        } catch {
            print("Ошибка подписки: \(error)")
            return false
        }
    }

    func unfollowUser(id: String) async -> Bool {
        do {
            let response: FollowResponse = try await network.delete(endpoint: "/profile/\(id)/follow")
            return response.isFollowing ?? false
        } catch {
            print(" Ошибка отписки: \(error)")
            return false
        }
    }

    func logout() {
        AuthManager.shared.logout()
    }
}
