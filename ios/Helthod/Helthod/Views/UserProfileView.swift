import SwiftUI

struct UserProfileView: View {
    let userId: String
    @State private var user: UserProfile?
    @State private var isLoading = true
    @State private var isFollowing = false
    @State private var isFollowLoading = false
    @Environment(\.dismiss) private var dismiss

    private let currentUserId = AuthManager.shared.currentUserId
    private let network = NetworkManager.shared

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Загрузка профиля")
            } else if let user = user {
                ScrollView {
                    VStack(spacing: 20) {
                        VStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [
                                        Color(red: 0.85, green: 0.89, blue: 0.83),
                                        Color(red: 0.96, green: 0.87, blue: 0.81)
                                    ], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 80, height: 80)
                                Image(systemName: "person.fill")
                                    .font(.system(size: 32))
                                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                            }

                            Text(user.username)
                                .font(.title2).fontWeight(.bold)

                            if userId != currentUserId {
                                Button(action: toggleFollow) {
                                    HStack(spacing: 6) {
                                        Image(systemName: isFollowing ? "person.badge.minus" : "person.badge.plus")
                                        Text(isFollowing ? "Отписаться" : "Подписаться")
                                    }
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 24)
                                    .padding(.vertical, 9)
                                    .background(isFollowing
                                        ? Color(red: 0.55, green: 0.52, blue: 0.44)
                                        : Color(red: 0.31, green: 0.40, blue: 0.33))
                                    .cornerRadius(10)
                                }
                                .disabled(isFollowLoading)
                            }
                        }
                        .padding(.top, 20)
                    }
                    .padding(.horizontal, 20)
                }
                .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
                .navigationTitle(user.username)
                .navigationBarTitleDisplayMode(.inline)
            } else {
                VStack(spacing: 12) {
                    Text("Не удалось загрузить профиль")
                        .foregroundColor(.gray)
                    Button("Повторить") { Task { await load() } }
                        .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        user = await ProfileViewModel().fetchUser(id: userId)
        if let token = AuthManager.shared.getToken() {
            _ = token
        }
        isLoading = false
    }

    private func toggleFollow() {
        isFollowLoading = true
        Task {
            let success = await ProfileViewModel().followUser(id: userId)
            if success {
                isFollowing.toggle()
            }
            isFollowLoading = false
        }
    }
}
