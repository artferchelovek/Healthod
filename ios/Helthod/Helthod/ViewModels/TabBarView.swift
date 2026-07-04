import SwiftUI

enum AppTab: Hashable {
    case home
    case train
    case message
    case foodRate
    case profile
    
    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .foodRate: return "fork.knife"
        case .message: return "message.fill"
        case .train: return "figure.highintensity.intervaltraining"
        case .profile:   return "person.fill"
        }
    }
    
    var title: String {
        switch self {
        case .home: return "Главная"
        case .message: return "Сообщения"
        case .foodRate: return "Питание"
        case .train: return "Тренировки"
        case .profile:   return "Профиль"
        }
    }
}

struct MainTabView: View {
    @Environment(\.horizontalSizeClass) var sizeClass
    @State private var selection: AppTab = .home
    @State private var browseTabPath: [AppTab] = []
    
    var body: some View {
        TabView(selection: $selection) {
            Tab("Главная", systemImage: "house.fill", value: .home) {
                MainView()
            }
            
            Tab("Тренировки", systemImage: "figure.highintensity.intervaltraining", value: .train) {
                TrainView()
            }
            Tab("Сообщения", systemImage: "message.fill", value: .message) {
                NavigationStack {
                    ChatListView()
                }
            }
            Tab("Питание", systemImage: "fork.knife", value: .foodRate) {
                FoodView()
            }
            
            Tab("Профиль", systemImage: "person.fill", value: .profile) {
                ProfileView()
            }
            
            
        }.tabViewStyle(.sidebarAdaptable)
    }
}

