import SwiftUI
import PhotosUI
import UniformTypeIdentifiers
import AVFoundation

struct MediaAttachment: Identifiable {
    let id = UUID()
    let data: Data
    let fileName: String
    let type: UTType
}

struct CreatePostView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var text = ""
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var attachments: [MediaAttachment] = []
    @State private var isUploading = false
    @State private var isPosting = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var showDocumentPicker = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.mainColor.ignoresSafeArea(.all)

                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 12) {
                        TextField("Заголовок", text: $title)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)

                        Divider()

                        TextField("Текст поста...", text: $text, axis: .vertical)
                            .lineLimit(5...10)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)

                        Divider()

                        HStack(spacing: 12) {
                            PhotosPicker(selection: $selectedPhotos, maxSelectionCount: 10, matching: .any(of: [.images, .videos])) {
                                HStack {
                                    Image(systemName: "photo.badge.plus")
                                    Text("Фото/видео")
                                }
                                .font(.subheadline)
                                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                            }

                            Button {
                                showDocumentPicker = true
                            } label: {
                                HStack {
                                    Image(systemName: "doc.badge.plus")
                                    Text("Файл")
                                }
                                .font(.subheadline)
                                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                            }
                        }

                        if !attachments.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(attachments) { item in
                                        attachmentThumbnail(item)
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Новая публикация")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isPosting || isUploading {
                        ProgressView()
                    } else {
                        Button("Опубликовать") { publishPost() }
                            .fontWeight(.bold)
                            .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
            }
            .alert("Ошибка", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage ?? "Неизвестная ошибка")
            }
            .onChange(of: selectedPhotos) { _, newItems in
                Task {
                    for item in newItems {
                        guard let data = try? await item.loadTransferable(type: Data.self) else { continue }
                        let utType = item.supportedContentTypes.first ?? .data
                        let fileName = "file.\(utType.preferredFilenameExtension ?? "data")"
                        attachments.append(MediaAttachment(data: data, fileName: fileName, type: utType))
                    }
                }
            }
            .sheet(isPresented: $showDocumentPicker) {
                DocumentPicker { data, fileName in
                    let ext = (fileName as NSString).pathExtension
                    let utType = UTType(filenameExtension: ext) ?? .data
                    attachments.append(MediaAttachment(data: data, fileName: fileName, type: utType))
                }
            }
        }
    }

    @ViewBuilder
    private func attachmentThumbnail(_ item: MediaAttachment) -> some View {
        if item.type.conforms(to: .image) {
            if let uiImage = UIImage(data: item.data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 100, height: 100)
                    .clipped()
                    .cornerRadius(10)
                    .overlay(alignment: .topTrailing) {
                        removeButton(item)
                    }
            }
        } else if item.type.conforms(to: .movie) {
            ZStack {
                if let uiImage = videoPreview(data: item.data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 100, height: 100)
                        .clipped()
                        .cornerRadius(10)
                } else {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 100, height: 100)
                }
                Image(systemName: "play.circle.fill")
                    .font(.system(size: 30))
                    .foregroundColor(.white)
            }
            .overlay(alignment: .topTrailing) {
                removeButton(item)
            }
        } else {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(red: 0.94, green: 0.93, blue: 0.91))
                    .frame(width: 100, height: 100)
                VStack(spacing: 4) {
                    Image(systemName: fileIcon(for: item.type))
                        .font(.system(size: 28))
                        .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                    Text(item.fileName)
                        .font(.system(size: 9))
                        .lineLimit(2)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 4)
                }
            }
            .overlay(alignment: .topTrailing) {
                removeButton(item)
            }
        }
    }

    private func removeButton(_ item: MediaAttachment) -> some View {
        Button {
            attachments.removeAll { $0.id == item.id }
        } label: {
            Image(systemName: "xmark.circle.fill")
                .font(.system(size: 18))
                .foregroundColor(.white)
                .shadow(radius: 2)
        }
        .offset(x: 4, y: -4)
    }

    private func fileIcon(for type: UTType) -> String {
        if type.conforms(to: .pdf) { return "doc.richtext" }
        if type.conforms(to: .plainText) { return "doc.text" }
        if type.conforms(to: .spreadsheet) { return "doc.text.magnifyingglass" }
        if type.conforms(to: .archive) { return "folder.fill" }
        if type.conforms(to: .audio) { return "music.note" }
        return "doc.fill"
    }

    private func videoPreview(data: Data) -> UIImage? {
        let temp = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).mp4")
        try? data.write(to: temp)
        let asset = AVAsset(url: temp)
        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        guard let cg = try? gen.copyCGImage(at: .zero, actualTime: nil) else { return nil }
        try? FileManager.default.removeItem(at: temp)
        return UIImage(cgImage: cg)
    }

    private func publishPost() {
        isPosting = true
        Task {
            var urls: [String] = []

            if !attachments.isEmpty {
                isUploading = true
                for item in attachments {
                    let mimeType: String
                    if let preferred = item.type.preferredMIMEType {
                        mimeType = preferred
                    } else {
                        mimeType = "application/octet-stream"
                    }
                    if let url = try? await NetworkManager.shared.uploadFile(data: item.data, fileName: item.fileName, mimeType: mimeType) {
                        urls.append(url)
                    }
                }
                isUploading = false
            }

            let success = await PostManager.shared.createPost(
                title: title.trimmingCharacters(in: .whitespaces),
                content: text.trimmingCharacters(in: .whitespaces),
                images: urls
            )
            isPosting = false

            if success {
                dismiss()
            } else {
                errorMessage = "Не удалось создать пост"
                showError = true
            }
        }
    }
}

#Preview {
    CreatePostView()
}
