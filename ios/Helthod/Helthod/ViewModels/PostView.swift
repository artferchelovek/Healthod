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

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 2) {
                Text(post.author.username)
                Text(post.relativeDate).font(.caption).opacity(0.7)
            }

            Text(post.title)
                .font(.headline)

            Text(post.content)
                .font(.body)
            if let url = post.imageFullURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        HStack {
                            Spacer()
                            ProgressView()
                            Spacer()
                        }
                        .frame(height: 200)
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .clipped()
                            .cornerRadius(12)
                    case .failure:
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                            .frame(height: 150)
                            .frame(maxWidth: .infinity)
                            .background(Color.black.opacity(0.03))
                            .cornerRadius(12)
                    @unknown default:
                        EmptyView()
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
    }
}

