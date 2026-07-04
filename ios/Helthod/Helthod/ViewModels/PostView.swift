import SwiftUI
import AVKit

enum PostType: String, Codable {
    case text = "TEXT"
    case workout = "WORKOUT"
    case recipe = "RECIPE"
    case poll = "POLL"
}

private enum FileType {
    case image, video, document
}

private func fileType(for url: URL) -> FileType {
    let ext = url.pathExtension.lowercased()
    switch ext {
    case "jpg", "jpeg", "png", "gif", "webp", "heic", "heif":
        return .image
    case "mp4", "mov", "m4v", "webm", "avi":
        return .video
    default:
        return .document
    }
}

private func fileName(from url: URL) -> String {
    let name = url.lastPathComponent
    if let range = name.range(of: "^\\d+-", options: .regularExpression) {
        return String(name[range.upperBound...])
    }
    return name
}

private func fileIcon(for url: URL) -> String {
    let ext = url.pathExtension.lowercased()
    switch ext {
    case "pdf": return "doc.richtext"
    case "txt", "csv": return "doc.text"
    case "xls", "xlsx": return "doc.text.magnifyingglass"
    case "zip", "rar", "gz": return "folder.fill"
    case "mp3", "wav", "aac": return "music.note"
    default: return "doc.fill"
    }
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
                VStack(spacing: 8) {
                    ForEach(post.imageFullURLs, id: \.self) { url in
                        switch fileType(for: url) {
                        case .image:
                            AsyncImage(url: url) { phase in
                                switch phase {
                                case .empty:
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color(red: 0.94, green: 0.93, blue: 0.91))
                                        .aspectRatio(16/9, contentMode: .fit)
                                        .overlay(ProgressView())
                                case .success(let image):
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fit)
                                        .cornerRadius(12)
                                case .failure:
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color(red: 0.94, green: 0.93, blue: 0.91))
                                        .aspectRatio(16/9, contentMode: .fit)
                                        .overlay(
                                            Image(systemName: "photo")
                                                .foregroundColor(.gray)
                                        )
                                @unknown default:
                                    EmptyView()
                                }
                            }
                        case .video:
                            VideoThumbnailView(url: url, onPlay: { playVideo(url: $0) })
                        case .document:
                            FileAttachmentView(url: url)
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

    private func playVideo(url: URL) {
        let player = AVPlayer(url: url)
        let playerVC = AVPlayerViewController()
        playerVC.player = player
        playerVC.modalPresentationStyle = .fullScreen
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root = scene.windows.first?.rootViewController {
            root.present(playerVC, animated: true) { player.play() }
        }
    }
}

private struct VideoThumbnailView: View {
    let url: URL
    let onPlay: (URL) -> Void
    @State private var thumbnail: UIImage?

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(red: 0.94, green: 0.93, blue: 0.91))
                .aspectRatio(16/9, contentMode: .fit)
            if let image = thumbnail {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .cornerRadius(12)
            }
            Image(systemName: "play.circle.fill")
                .font(.system(size: 44))
                .foregroundColor(.white)
                .shadow(radius: 4)
        }
        .contentShape(Rectangle())
        .onTapGesture { onPlay(url) }
        .task { await loadThumbnail() }
    }

    private func loadThumbnail() async {
        let asset = AVAsset(url: url)
        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        gen.maximumSize = CGSize(width: 480, height: 360)
        if let cg = try? await gen.image(at: .zero).image {
            thumbnail = UIImage(cgImage: cg)
        }
    }
}

private struct FileAttachmentView: View {
    let url: URL

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: fileIcon(for: url))
                .font(.system(size: 28))
                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                .frame(width: 44, height: 44)
                .background(Color(red: 0.94, green: 0.93, blue: 0.91))
                .cornerRadius(10)
            Text(fileName(from: url))
                .font(.subheadline)
                .foregroundColor(.primary)
                .lineLimit(1)
            Spacer()
            Image(systemName: "arrow.down.circle")
                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
        }
        .padding(12)
        .background(Color(red: 0.94, green: 0.93, blue: 0.91).opacity(0.5))
        .cornerRadius(12)
    }
}
