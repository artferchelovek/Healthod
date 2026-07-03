import SwiftUI
import PhotosUI

struct CreatePostView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var text = ""
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var selectedImageData: Data?
    @State private var isUploadingImage = false
    @State private var isPosting = false
    @State private var errorMessage: String?
    @State private var showError = false

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

                        PhotosPicker(selection: $selectedPhoto, matching: .images) {
                            HStack {
                                Image(systemName: "photo.badge.plus")
                                Text(selectedImageData == nil ? "Добавить изображение" : "Изменить изображение")
                            }
                            .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                        }

                        if let data = selectedImageData, let uiImage = UIImage(data: data) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(height: 180)
                                .clipped()
                                .cornerRadius(12)
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
                    if isPosting || isUploadingImage {
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
            .onChange(of: selectedPhoto) { _, newItem in
                Task {
                    guard let item = newItem else { return }
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        selectedImageData = data
                    }
                }
            }
        }
    }

    private func publishPost() {
        isPosting = true
        Task {
            var imageURL: String?

            if let imageData = selectedImageData {
                isUploadingImage = true
                imageURL = try? await NetworkManager.shared.uploadImage(data: imageData)
                isUploadingImage = false
            }

            let success = await PostManager.shared.createPost(
                title: title.trimmingCharacters(in: .whitespaces),
                content: text.trimmingCharacters(in: .whitespaces),
                imageUrl: imageURL
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
