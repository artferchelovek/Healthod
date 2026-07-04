import SwiftUI

struct UserProfileView: View {
    let userId: String
    @State private var user: UserProfile?
    @State private var posts: [Post] = []
    @State private var isLoading = true
    @State private var isFollowing = false
    @State private var isFollowLoading = false
    @State private var chatToOpen: Chat?
    @Environment(\.dismiss) private var dismiss

    private let currentUserId = AuthManager.shared.currentUserId

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Загрузка профиля")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            } else if let user = user {
                ScrollView {
                    VStack(spacing: 0) {
                        VStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [
                                        Color(red: 0.85, green: 0.89, blue: 0.83),
                                        Color(red: 0.96, green: 0.87, blue: 0.81)
                                    ], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 88, height: 88)
                                Image(systemName: "person.fill")
                                    .font(.system(size: 36))
                                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                            }

                            Text(user.username)
                                .font(.title2).fontWeight(.bold)

                            if !user.relativeDate.isEmpty {
                                Text("В Healthod с \(user.relativeDate)")
                                    .font(.subheadline)
                                    .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                                    .multilineTextAlignment(.center)
                            }

                            if userId != currentUserId {
                                HStack(spacing: 10) {
                                    Button(action: toggleFollow) {
                                        HStack(spacing: 6) {
                                            if isFollowLoading {
                                                ProgressView()
                                                    .tint(.white)
                                            } else {
                                                Image(systemName: isFollowing ? "person.badge.minus" : "person.badge.plus")
                                                Text(isFollowing ? "Отписаться" : "Подписаться")
                                            }
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

                                    Button(action: openChat) {
                                        HStack(spacing: 6) {
                                            Image(systemName: "bubble.left.and.bubble.right")
                                            Text("Написать")
                                        }
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(Color(red: 0.13, green: 0.11, blue: 0.08))
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 9)
                                        .background(Color(red: 0.89, green: 0.86, blue: 0.78))
                                        .cornerRadius(10)
                                    }
                                }
                            }

                            HStack(spacing: 34) {
                                StatColumn(value: "\(posts.count)", label: "Посты")
                                StatColumn(value: "\(user.followersCount ?? 0)", label: "Подписчики")
                            }
                            .padding(.vertical, 20)
                        }
                        .padding(.horizontal, 20)

                        if !posts.isEmpty {
                            LazyVStack(spacing: 16) {
                                ForEach(posts) { post in
                                    PostView(post: post)
                                }
                            }
                            .padding(.horizontal, 20)
                            .padding(.top, 10)
                            .padding(.bottom, 100)
                        }
                    }
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
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            }
        }
        .sheet(item: $chatToOpen) { chat in
            NavigationStack {
                ChatDetailView(chatId: chat.id)
            }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        if let result = await ProfileViewModel().fetchUser(id: userId) {
            user = result.user
            posts = result.posts
            isFollowing = result.isFollowing
        }
        isLoading = false
    }

    private func openChat() {
        Task {
            if let chat = await ChatManager.shared.createChat(participantId: userId) {
                chatToOpen = chat
            }
        }
    }

    private func toggleFollow() {
        isFollowLoading = true
        Task {
            let success: Bool
            if isFollowing {
                success = await ProfileViewModel().unfollowUser(id: userId)
            } else {
                success = await ProfileViewModel().followUser(id: userId)
            }
            if success {
                isFollowing.toggle()
            }
            isFollowLoading = false
        }
    }
}
