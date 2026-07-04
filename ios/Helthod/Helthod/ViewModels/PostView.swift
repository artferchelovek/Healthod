import SwiftUI

enum PostType: String, Codable {
    case text = "TEXT"
    case workout = "WORKOUT"
    case recipe = "RECIPE"
    case poll = "POLL"
}


struct PostView: View {
    let post: Post
    @State private var showComments = false
    @State private var showDeleteAlert = false
    @State private var isDeleting = false

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    NavigationLink(value: post.authorId) {
                        Text(post.author.username)
                            .fontWeight(.semibold)
                    }
                    .buttonStyle(.plain)
                    Text(post.relativeDate).font(.caption).opacity(0.7)
                }
                Spacer()
                if post.authorId == AuthManager.shared.currentUserId {
                    Menu {
                        Button(role: .destructive) {
                            showDeleteAlert = true
                        } label: {
                            Label("Удалить пост", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                            .frame(width: 32, height: 32)
                            .background(Color(red: 0.94, green: 0.93, blue: 0.91))
                            .clipShape(Circle())
                    }
                }
            }

            Text(post.title)
                .font(.headline)

            Text(post.content)
                .font(.body)
            if !post.imageFullURLs.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(post.imageFullURLs, id: \.self) { url in
                            AsyncImage(url: url) { phase in
                                switch phase {
                                case .empty:
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color(red: 0.94, green: 0.93, blue: 0.91))
                                        .frame(width: 240, height: 180)
                                        .overlay(ProgressView())
                                case .success(let image):
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                        .frame(width: 240, height: 180)
                                        .clipped()
                                        .cornerRadius(12)
                                case .failure:
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color(red: 0.94, green: 0.93, blue: 0.91))
                                        .frame(width: 240, height: 180)
                                        .overlay(
                                            Image(systemName: "photo")
                                                .foregroundColor(.gray)
                                        )
                                @unknown default:
                                    EmptyView()
                                }
                            }
                        }
                    }
                }
                .padding(.top, 4)
            }
            LikeButtonView(postId: post.id, initialLikesCount: post.likesCount, commentsCount: post.commentsCount, isLiked: post.isLiked, onCommentsTap: { showComments = true })
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(15)
        .background(RoundedRectangle(cornerRadius: 10).fill(Color.surface))
        .sheet(isPresented: $showComments) {
            CommentsView(postId: post.id)
        }
        .alert("Удалить пост?", isPresented: $showDeleteAlert) {
            Button("Удалить", role: .destructive) {
                isDeleting = true
                Task {
                    _ = await PostManager.shared.deletePost(id: post.id)
                }
            }
            Button("Отмена", role: .cancel) {}
        } message: {
            Text("Пост «\(post.title)» будет удалён навсегда.")
        }
    }
}

