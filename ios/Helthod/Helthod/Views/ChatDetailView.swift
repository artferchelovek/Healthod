import SwiftUI

struct ChatDetailView: View {
    let chatId: String
    @State private var messages: [Message] = []
    @State private var inputText = ""
    @State private var isLoading = true
    @State private var isSending = false
    @FocusState private var isFocused: Bool

    private let manager = ChatManager.shared

    var body: some View {
        VStack(spacing: 0) {
            if isLoading {
                Spacer()
                ProgressView("Загрузка сообщений")
                Spacer()
            } else if messages.isEmpty {
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "bubble.left.and.bubble.right")
                        .font(.system(size: 36))
                        .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                    Text("Нет сообщений")
                        .foregroundColor(.gray)
                    Text("Напишите что-нибудь")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                Spacer()
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(messages) { msg in
                                MessageBubble(message: msg)
                                    .id(msg.id)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                    .onChange(of: messages.count) { _, _ in
                        if let last = messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }
            }

            HStack(spacing: 10) {
                TextField("Сообщение...", text: $inputText)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(Color(red: 0.94, green: 0.93, blue: 0.91))
                    .cornerRadius(18)
                    .focused($isFocused)

                Button(action: sendMessage) {
                    if isSending {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 30))
                    }
                }
                .foregroundColor(inputText.trimmingCharacters(in: .whitespaces).isEmpty
                    ? Color(red: 0.55, green: 0.52, blue: 0.44).opacity(0.4)
                    : Color(red: 0.31, green: 0.40, blue: 0.33))
                .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty || isSending)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color(red: 0.96, green: 0.95, blue: 0.93))
        }
        .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadMessages()
            manager.startPolling(chatId: chatId) { newMessages in
                messages = newMessages
            }
        }
        .onDisappear {
            manager.stopPolling(chatId: chatId)
        }
    }

    private func loadMessages() async {
        isLoading = true
        if let response = await manager.fetchMessages(chatId: chatId) {
            messages = response.messages
        }
        isLoading = false
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        isSending = true
        inputText = ""
        Task {
            if let msg = await manager.sendMessage(chatId: chatId, content: text) {
                messages.append(msg)
            }
            isSending = false
        }
    }
}

struct MessageBubble: View {
    let message: Message

    var body: some View {
        HStack {
            if message.isMine { Spacer(minLength: 50) }

            VStack(alignment: message.isMine ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.system(size: 15))
                    .foregroundColor(message.isMine ? .white : Color(red: 0.13, green: 0.11, blue: 0.08))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(message.isMine
                        ? Color(red: 0.31, green: 0.40, blue: 0.33)
                        : Color.white)
                    .cornerRadius(16)

                Text(message.relativeTime)
                    .font(.system(size: 11))
                    .foregroundColor(.gray.opacity(0.7))
            }

            if !message.isMine { Spacer(minLength: 50) }
        }
    }
}
