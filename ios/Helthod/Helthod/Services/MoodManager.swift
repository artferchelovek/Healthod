import Foundation
import SwiftUI
import Combine

enum Mood: String, CaseIterable, Codable {
    case happy = "HAPPY"
    case sad = "SAD"
    case stressed = "STRESSED"
    case tired = "TIRED"
    case calm = "CALM"
    case motivated = "MOTIVATED"

   
    var emoji: String {
        switch self {
        case .happy: return "😁"
        case .sad: return  "😢"
        case .stressed: return "🤯"
        case .tired: return "🥱"
        case .calm: return "😌"
        case .motivated: return"🔥"
        }
    }

    var systemImage: String {
        switch self {
        case .happy: return "face.smiling"
        case .sad: return "cloud.rain"
        case .stressed: return "bolt"
        case .tired: return "moon.zzz"
        case .calm: return "leaf"
        case .motivated: return "flame"
        }
    }

    var title: String {
        switch self {
        case .happy: return "Счастлив"
        case .sad: return "Грустен"
        case .stressed: return "В стрессе"
        case .tired: return "Уставший"
        case .calm: return "Спокоен"
        case .motivated: return "Мотивирован"
        }
    }

    var shortTitle: String {
        switch self {
        case .happy: return "Супер"
        case .sad: return "Грусть"
        case .stressed: return "Стресс"
        case .tired: return "Устал"
        case .calm: return "Спок."
        case .motivated: return "Огонь"
        }
    }

    var color: Color {
        switch self {
        case .happy: return Color(red: 0.95, green: 0.76, blue: 0.26)
        case .sad: return Color(red: 0.45, green: 0.58, blue: 0.82)
        case .stressed: return Color(red: 0.87, green: 0.41, blue: 0.41)
        case .tired: return Color(red: 0.65, green: 0.59, blue: 0.75)
        case .calm: return Color(red: 0.31, green: 0.69, blue: 0.58)
        case .motivated: return Color(red: 0.88, green: 0.47, blue: 0.22)
        }
    }
}

@MainActor
class MoodManager: ObservableObject {
    static let shared = MoodManager()

    @Published var currentMood: Mood? = nil

    private let network = NetworkManager.shared
    private let defaultsKey = "user_mood"

    private init() {
        if let raw = UserDefaults.standard.string(forKey: defaultsKey) {
            currentMood = Mood(rawValue: raw)
        }
    }

    func setMood(_ mood: Mood) async {
        currentMood = mood
        UserDefaults.standard.set(mood.rawValue, forKey: defaultsKey)

        do {
            try await network.sendPost(endpoint: "/mood", body: ["mood": mood.rawValue])
        } catch {
            print("❌ Ошибка сохранения настроения: \(error)")
        }
    }
}
