import SwiftUI

struct AddWorkoutView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var title: String = ""
    @State private var exercises: [(name: String, sets: String, reps: String, calories: String)] = []
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showError = false

    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty &&
        !exercises.isEmpty &&
        exercises.allSatisfy { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Название тренировки") {
                    TextField("Например: Утренняя", text: $title)
                }

                Section("Упражнения") {
                    ForEach(exercises.indices, id: \.self) { index in
                        VStack(spacing: 8) {
                            TextField("Название", text: $exercises[index].name)
                            HStack(spacing: 12) {
                                TextField("Подходы", text: $exercises[index].sets)
                                    .keyboardType(.numberPad)
                                    .frame(maxWidth: .infinity)
                                TextField("Повторения", text: $exercises[index].reps)
                                    .keyboardType(.numberPad)
                                    .frame(maxWidth: .infinity)
                                TextField("ккал", text: $exercises[index].calories)
                                    .keyboardType(.numberPad)
                                    .frame(maxWidth: 60)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .onDelete { exercises.remove(atOffsets: $0) }

                    Button(action: {
                        exercises.append((name: "", sets: "", reps: "", calories: ""))
                    }) {
                        Label("Добавить упражнение", systemImage: "plus.circle")
                    }
                }
            }
            .navigationTitle("Новая тренировка")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                        .disabled(isSaving)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Создать") { save() }
                            .fontWeight(.bold)
                            .disabled(!isValid)
                    }
                }
            }
            .alert("Ошибка", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage ?? "Неизвестная ошибка")
            }
        }
    }

    private func save() {
        isSaving = true
        Task {
            guard let workout = await WorkoutManager.shared.createWorkout(
                title: title.trimmingCharacters(in: .whitespaces)
            ) else {
                isSaving = false
                errorMessage = "Не удалось создать тренировку"
                showError = true
                return
            }

            for ex in exercises {
                let name = ex.name.trimmingCharacters(in: .whitespaces)
                guard !name.isEmpty,
                      let sets = Int(ex.sets), sets > 0,
                      let reps = Int(ex.reps)
                else { continue }

                let calories = Double(ex.calories) ?? 0
                let success = await WorkoutManager.shared.addExercise(
                    to: workout.id,
                    name: name,
                    sets: sets,
                    repetitions: reps,
                    calories: calories
                )
                if !success {
                    print("❌ Не удалось добавить упражнение: \(name)")
                }
            }

            isSaving = false
            dismiss()
        }
    }
}
