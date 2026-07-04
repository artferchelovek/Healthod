import SwiftUI

struct JoinGroupView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var communityId = ""
    @State private var isJoining = false
    @State private var errorMessage: String?
    @State private var success = false

    private let manager = ChatManager.shared

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.3.fill")
                .font(.system(size: 50))
                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))

            Text("Присоединиться к группе")
                .font(.title2)
                .fontWeight(.bold)

            Text("Введите код группы, который отправил организатор")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            TextField("Код группы", text: $communityId)
                .textFieldStyle(.plain)
                .multilineTextAlignment(.center)
                .font(.system(size: 16, design: .monospaced))
                .padding()
                .background(Color.white)
                .cornerRadius(10)
                .padding(.horizontal, 40)
                .autocapitalization(.none)
                .disableAutocorrection(true)

            if let error = errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }

            Button {
                Task { await join() }
            } label: {
                if isJoining {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Присоединиться")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(communityId.trimmingCharacters(in: .whitespaces).isEmpty ? Color.gray : Color(red: 0.31, green: 0.40, blue: 0.33))
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.horizontal, 40)
            .disabled(communityId.trimmingCharacters(in: .whitespaces).isEmpty || isJoining)

            if success {
                Text("Вы присоединились к группе!")
                    .font(.subheadline)
                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
            }

            Spacer()
        }
        .padding(.top, 40)
        .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
        .navigationTitle("Присоединиться")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func join() async {
        isJoining = true
        errorMessage = nil
        let id = communityId.trimmingCharacters(in: .whitespaces)
        let ok = await manager.joinCommunity(id: id)
        if ok {
            success = true
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            dismiss()
        } else {
            errorMessage = "Не удалось присоединиться. Проверьте код."
        }
        isJoining = false
    }
}
