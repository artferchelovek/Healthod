import SwiftUI

struct MainView: View {
    @StateObject private var postManager = PostManager.shared
    @State private var isShowSheetsCreatePost: Bool = false
    @State private var feedRefreshId = UUID()
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            ZStack {
                Color.mainColor
                    .edgesIgnoringSafeArea(.all)

                VStack(spacing: 0) {
                    HStack {
                        Text("Лента")
                            .font(.title)
                            .bold()
                            .frame(maxWidth: .infinity, alignment: .leading)

                        HStack(spacing: 20) {
                            Button(action: {
                                isShowSheetsCreatePost = true
                            }) {
                                Image(systemName: "plus")
                                    .foregroundColor(.black)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)

                    Picker("", selection: $selectedTab) {
                        Text("Все").tag(0)
                        Text("Подписки").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)

                    if postManager.isLoading && postManager.posts.isEmpty {
                        Spacer()
                        ProgressView("Загрузка ленты")
                        Spacer()
                    } else if postManager.posts.isEmpty {
                        Spacer()
                        VStack(spacing: 8) {
                            Image(systemName: selectedTab == 1 ? "person.2" : "text.alignleft")
                                .font(.system(size: 28))
                                .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                            Text(selectedTab == 1 ? "Нет постов от подписок" : "Лента пуста")
                                .foregroundColor(.gray)
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 16) {
                                ForEach(postManager.posts) { post in
                                    PostView(post: post)
                                        .id("\(post.id)-\(feedRefreshId)")
                                }
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                        }
                        .refreshable {
                            await refreshFeed()
                            feedRefreshId = UUID()
                        }
                    }
                }
            }
            .navigationDestination(for: String.self) { userId in
                UserProfileView(userId: userId)
            }
            .sheet(isPresented: $isShowSheetsCreatePost) {
                CreatePostView()
            }
            .task {
                await refreshFeed()
            }
            .onChange(of: selectedTab) { _ in
                Task { await refreshFeed() }
            }
        }
    }

    private func refreshFeed() async {
        if selectedTab == 0 {
            await postManager.fetchPosts()
        } else {
            await postManager.fetchFollowingPosts()
        }
    }
}
#Preview {
    MainView()
}
