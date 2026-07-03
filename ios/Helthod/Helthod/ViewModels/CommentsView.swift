import SwiftUI

struct CommentsView: View {
    let postId: String
    @Environment(\.dismiss) private var dismiss
    @State private var comments: [Comment] = []
    @State private var newCommentText = ""
    @State private var isLoading = false
    @State private var isSending = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if isLoading {
                    Spacer()
                    ProgressView("Загрузка комментариев...")
                    Spacer()
                } else if comments.isEmpty {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "bubble.left")
                            .font(.system(size: 36))
                            .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                        Text("Нет комментариев")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(comments) { comment in
                                CommentRow(comment: comment)
                                if comment.id != comments.last?.id {
                                    Divider()
                                }
                            }
                        }
                    }
                }

                Divider()

                HStack(spacing: 10) {
                    TextField("Написать комментарий...", text: $newCommentText)
                        .textFieldStyle(.plain)
                        .font(.system(size: 15))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color(red: 0.94, green: 0.93, blue: 0.91))
                        .cornerRadius(20)

                    Button(action: sendComment) {
                        if isSending {
                            ProgressView()
                                .tint(.white)
                                .frame(width: 36, height: 36)
                                .background(Color(red: 0.31, green: 0.40, blue: 0.33))
                                .clipShape(Circle())
                        } else {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 36))
                                .foregroundColor(newCommentText.trimmingCharacters(in: .whitespaces).isEmpty
                                    ? Color(red: 0.78, green: 0.76, blue: 0.70)
                                    : Color(red: 0.31, green: 0.40, blue: 0.33))
                        }
                    }
                    .disabled(newCommentText.trimmingCharacters(in: .whitespaces).isEmpty || isSending)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.white)
            }
            .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            .navigationTitle("Комментарии")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Закрыть") { dismiss() }
                }
            }
            .task { await loadComments() }
        }
    }

    private func loadComments() async {
        isLoading = true
        comments = await PostManager.shared.fetchComments(postId: postId)
        isLoading = false
    }

    private func sendComment() {
        let text = newCommentText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        isSending = true
        Task {
            let success = await PostManager.shared.addComment(postId: postId, content: text)
            isSending = false
            if success {
                newCommentText = ""
                await loadComments()
            }
        }
    }
}

struct CommentRow: View {
    let comment: Comment

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text(comment.author.username)
                    .font(.system(size: 13, weight: .semibold))
                Text(comment.relativeDate)
                    .font(.system(size: 11))
                    .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
            }
            Text(comment.content)
                .font(.system(size: 14))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}
