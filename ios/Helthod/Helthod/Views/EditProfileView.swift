import SwiftUI

struct EditProfileView: View {
    @ObservedObject var viewModel: ProfileViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var username: String = ""
    @State private var age: String = ""
    @State private var weight: String = ""
    @State private var height: String = ""
    @State private var goal: String = "MAINTAIN"
    @State private var showError = false

    private let goalOptions: [(id: String, label: String)] = [
        ("LOSE_WEIGHT", "Сбросить вес"),
        ("GAIN_MUSCLE", "Набрать массу"),
        ("MAINTAIN", "Поддерживать форму")
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    VStack(spacing: 0) {
                        editField(title: "Имя пользователя", text: $username, keyboardType: .default)
                        Divider().padding(.leading, 16)
                        editField(title: "Возраст", text: $age, keyboardType: .numberPad)
                        Divider().padding(.leading, 16)
                        editField(title: "Вес (кг)", text: $weight, keyboardType: .decimalPad)
                        Divider().padding(.leading, 16)
                        editField(title: "Рост (см)", text: $height, keyboardType: .numberPad)
                    }
                    .background(Color.white)
                    .cornerRadius(14)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Цель")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                            .padding(.leading, 4)

                        VStack(spacing: 0) {
                            ForEach(goalOptions, id: \.id) { option in
                                Button(action: { goal = option.id }) {
                                    HStack {
                                        Text(option.label)
                                            .font(.system(size: 15))
                                            .foregroundColor(.black)
                                        Spacer()
                                        if goal == option.id {
                                            Image(systemName: "checkmark")
                                                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                                        }
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 14)
                                }
                                if option.id != goalOptions.last?.id {
                                    Divider()
                                }
                            }
                        }
                        .background(Color.white)
                        .cornerRadius(14)
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            .navigationTitle("Редактировать профиль")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") { save() }
                        .disabled(viewModel.isSaving)
                }
            }
            .onAppear {
                if let p = viewModel.profile {
                    username = p.username
                    age = p.age.map { "\($0)" } ?? ""
                    weight = p.weight.map { String(format: "%.1f", $0) } ?? ""
                    height = p.height.map { "\(Int($0))" } ?? ""
                    goal = p.goal ?? "MAINTAIN"
                }
            }
            .alert("Ошибка", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(viewModel.saveError ?? "Неизвестная ошибка")
            }
        }
    }

    private func editField(title: String, text: Binding<String>, keyboardType: UIKeyboardType) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 15))
                .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                .frame(width: 100, alignment: .leading)
                .padding(.leading, 16)
            TextField("", text: text)
                .font(.system(size: 15))
                .keyboardType(keyboardType)
                .multilineTextAlignment(.trailing)
                .padding(.trailing, 16)
        }
        .padding(.vertical, 8)
    }

    private func save() {
        guard let ageVal = Int(age),
              let weightVal = Double(weight),
              let heightVal = Double(height),
              !username.trimmingCharacters(in: .whitespaces).isEmpty else { return }

        Task {
            let success = await viewModel.updateProfile(
                username: username.trimmingCharacters(in: .whitespaces),
                age: ageVal,
                weight: weightVal,
                height: heightVal,
                goal: goal
            )
            if success {
                dismiss()
            } else {
                showError = true
            }
        }
    }
}
