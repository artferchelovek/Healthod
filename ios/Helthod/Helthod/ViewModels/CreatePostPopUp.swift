import SwiftUI
import PhotosUI

struct CreatePostView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var text = ""
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var selectedImagesData: [Data] = []
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

                        PhotosPicker(selection: $selectedPhotos, maxSelectionCount: 10, matching: .images) {
                            HStack {
                                Image(systemName: "photo.badge.plus")
                                Text(selectedImagesData.isEmpty ? "Добавить фото" : "Изменить фото (\(selectedImagesData.count))")
                            }
                            .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                        }

                        if !selectedImagesData.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(selectedImagesData.indices, id: \.self) { i in
                                        if let uiImage = UIImage(data: selectedImagesData[i]) {
                                            Image(uiImage: uiImage)
                                                .resizable()
                                                .aspectRatio(contentMode: .fill)
                                                .frame(width: 120, height: 120)
                                                .clipped()
                                                .cornerRadius(10)
                                        }
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
            .onChange(of: selectedPhotos) { _, newItems in
                Task {
                    var datas: [Data] = []
                    for item in newItems {
                        if let data = try? await item.loadTransferable(type: Data.self) {
                            datas.append(data)
                        }
                    }
                    selectedImagesData = datas
                }
            }
        }
    }

    private func publishPost() {
        isPosting = true
        Task {
            var imageURLs: [String] = []

            if !selectedImagesData.isEmpty {
                isUploadingImage = true
                for imageData in selectedImagesData {
                    if let url = try? await NetworkManager.shared.uploadImage(data: imageData) {
                        imageURLs.append(url)
                    }
                }
                isUploadingImage = false
            }

            let success = await PostManager.shared.createPost(
                title: title.trimmingCharacters(in: .whitespaces),
                content: text.trimmingCharacters(in: .whitespaces),
                images: imageURLs
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
