import SwiftUI

struct LikeResponse: Decodable {
    let message: String
    let likesCount: Int
    let isLiked: Bool
}

struct LikeButtonView: View {
    let postId: String
    let commentsCount: Int
    let onCommentsTap: () -> Void

    @State private var isLiked: Bool = false
    @State private var likesCount: Int

    init(postId: String, initialLikesCount: Int, commentsCount: Int, isLiked: Bool = false, onCommentsTap: @escaping () -> Void = {}) {
        self.postId = postId
        self.commentsCount = commentsCount
        self.onCommentsTap = onCommentsTap
        _likesCount = State(initialValue: initialLikesCount)
        _isLiked = State(initialValue: isLiked)
    }

    var body: some View {
        HStack(alignment: .top, spacing: 20) {
            Button(action: { toggleLike() }) {
                HStack(spacing: 4) {
                    Image(systemName: isLiked ? "heart.fill" : "heart")
                        .font(.system(size: 22))

                    Text("\(likesCount)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .foregroundColor(isLiked ? .red : .black)
            }
            .buttonStyle(.plain)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isLiked)

            Button(action: onCommentsTap) {
                HStack(spacing: 8) {
                    Image(systemName: "bubble.right")
                        .font(.system(size: 20))
                    Text("\(commentsCount)")
                        .font(.subheadline)
                }
                .foregroundColor(.black)
            }
            .buttonStyle(.plain)
        }
    }
    
    private func toggleLike() {
        let previousLiked = isLiked
        let previousCount = likesCount
        
        isLiked.toggle()
        likesCount += isLiked ? 1 : -1
        
        Task {
            do {
                let response: LikeResponse = try await isLiked
                    ? NetworkManager.shared.post(endpoint: "/posts/\(postId)/like", body: ["": ""])
                    : NetworkManager.shared.delete(endpoint: "/posts/\(postId)/like", body: ["": ""])
                
                isLiked = response.isLiked
                likesCount = response.likesCount
            } catch {
                isLiked = previousLiked
                likesCount = previousCount
                print("❌ Ошибка лайка: \(error)")
            }
        }
    }
}
