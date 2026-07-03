import SwiftUI

struct MainView: View {
    @StateObject private var postManager = PostManager.shared
    @State private var isShowSheetsCreatePost: Bool = false
    @State private var feedRefreshId = UUID()

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
                                print("Поиск нажат")
                            }) {
                                Image(systemName: "magnifyingglass")
                                    .foregroundColor(.black)
                            }

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

                    if postManager.isLoading && postManager.posts.isEmpty {
                        Spacer()
                        ProgressView("Загрузка ленты")
                        Spacer()
                    } else if postManager.posts.isEmpty {
                        Spacer()
                        Text("Лента пуста")
                            .foregroundColor(.gray)
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
                            await postManager.fetchPosts()
                            feedRefreshId = UUID()
                        }
                    }
                }
            }
            .sheet(isPresented: $isShowSheetsCreatePost) {
                CreatePostView()
            }
            .task {
                await postManager.fetchPosts()
            }
        }
    }
}
#Preview {
    MainView()
}
