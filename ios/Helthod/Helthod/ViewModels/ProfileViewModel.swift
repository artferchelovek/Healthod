import Foundation
import SwiftUI
import Combine
struct UserProfile: Codable {
    let id: String
    let email: String
    let username: String
    let age: Int
    let weight: Double
    let height: Double
    let goal: String
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

    var goalDisplay: String {
        switch goal {
        case "LOSE_WEIGHT": return "Сбросить вес"
        case "GAIN_MUSCLE": return "Набрать массу"
        case "MAINTAIN": return "Поддерживать форму"
        default: return goal
        }
    }
}

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var isLoading = false
    @Published var error: String?
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

    func logout() {
        AuthManager.shared.logout()
    }
}
