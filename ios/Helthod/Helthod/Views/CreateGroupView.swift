import SwiftUI

struct CreateGroupView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var groupName = ""
    @State private var searchQuery = ""
    @State private var searchResults: [ChatUser] = []
    @State private var selectedUsers: [ChatUser] = []
    @State private var isCreating = false

    private let manager = ChatManager.shared

    var body: some View {
        VStack(spacing: 0) {
                TextField("Название группы", text: $groupName)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Color.white)
                    .cornerRadius(10)
                    .padding(.horizontal, 16)
                    .padding(.top, 12)

                if !selectedUsers.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(selectedUsers) { user in
                                HStack(spacing: 4) {
                                    Text(user.username)
                                        .font(.system(size: 13))
                                    Button {
                                        selectedUsers.removeAll { $0.id == user.id }
                                    } label: {
                                        Image(systemName: "xmark.circle.fill")
                                            .font(.system(size: 14))
                                            .foregroundColor(.gray)
                                    }
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color(red: 0.85, green: 0.89, blue: 0.83))
                                .cornerRadius(16)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                    }
                }

                TextField("Поиск пользователей...", text: $searchQuery)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Color.white)
                    .cornerRadius(10)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                    .onChange(of: searchQuery) { _, newValue in
                        guard !newValue.isEmpty else { searchResults = []; return }
                        Task { await search() }
                    }

                List {
                    ForEach(searchResults) { user in
                        HStack {
                            Circle()
                                .fill(Color(red: 0.85, green: 0.89, blue: 0.83))
                                .frame(width: 36, height: 36)
                                .overlay(Text(user.username.prefix(1).uppercased())
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33)))

                            Text(user.username)
                                .font(.system(size: 15))

                            Spacer()

                            if selectedUsers.contains(where: { $0.id == user.id }) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if let idx = selectedUsers.firstIndex(where: { $0.id == user.id }) {
                                selectedUsers.remove(at: idx)
                            } else {
                                selectedUsers.append(user)
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
            .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            .navigationTitle("Новая группа")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Создать") {
                        Task { await createGroup() }
                    }
                    .fontWeight(.semibold)
                    .disabled(groupName.trimmingCharacters(in: .whitespaces).isEmpty || selectedUsers.isEmpty || isCreating)
                }
            }
    }

    private func search() async {
        guard !searchQuery.trimmingCharacters(in: .whitespaces).isEmpty else {
            searchResults = []
            return
        }
        searchResults = await manager.searchUsers(query: searchQuery.trimmingCharacters(in: .whitespaces))
    }

    private func createGroup() async {
        isCreating = true
        let name = groupName.trimmingCharacters(in: .whitespaces)
        let ids = selectedUsers.map { $0.id }
        let chat = await manager.createGroupChat(name: name, participantIds: ids)
        isCreating = false
        if chat != nil {
            dismiss()
        }
    }
}
