import SwiftUI

enum MealMode: Identifiable {
    case add
    case edit(meal: FoodItem)

    var id: String {
        switch self {
        case .add: return "add"
        case .edit(let m): return m.id
        }
    }

    var title: String {
        switch self {
        case .add: return "Новый приём пищи"
        case .edit: return "Редактировать"
        }
    }

    var buttonTitle: String {
        switch self {
        case .add: return "Добавить"
        case .edit: return "Сохранить"
        }
    }
}

struct MealView: View {
    let mode: MealMode

    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var mealType: MealType = .breakfast
    @State private var caloriesString: String = ""
    @State private var proteinsString: String = ""
    @State private var fatsString: String = ""
    @State private var carbsString: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showError = false

    private var isValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        (Double(caloriesString) ?? 0) > 0
    }

    init(mode: MealMode) {
        self.mode = mode
        if case .edit(let meal) = mode {
            _name = State(initialValue: meal.name)
            _mealType = State(initialValue: meal.mealType)
            _caloriesString = State(initialValue: String(Int(meal.calories)))
            _proteinsString = State(initialValue: String(Int(meal.protein)))
            _fatsString = State(initialValue: String(Int(meal.fats)))
            _carbsString = State(initialValue: String(Int(meal.carbs)))
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Тип приёма") {
                    Picker("Тип", selection: $mealType) {
                        ForEach(MealType.allCases, id: \.self) { type in
                            Label(type.title, systemImage: type.icon)
                                .tag(type)
                        }
                    }
                }
                Section("Блюдо") {
                    TextField("Например: Овсянка с бананом", text: $name)
                }
                Section("Калории") {
                    TextField("Например: 420", text: $caloriesString)
                        .keyboardType(.numberPad)
                }
                Section("БЖУ (необязательно)") {
                    HStack {
                        Text("Белки")
                        Spacer()
                        TextField("г", text: $proteinsString)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                    }
                    HStack {
                        Text("Жиры")
                        Spacer()
                        TextField("г", text: $fatsString)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                    }
                    HStack {
                        Text("Углеводы")
                        Spacer()
                        TextField("г", text: $carbsString)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                    }
                }
            }
            .navigationTitle(mode.title)
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
                        Button(mode.buttonTitle) { save() }
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
        guard let cal = Double(caloriesString), cal > 0 else { return }
        isSaving = true

        let p = Double(proteinsString) ?? 0
        let f = Double(fatsString) ?? 0
        let c = Double(carbsString) ?? 0

        Task {
            let success: Bool
            switch mode {
            case .add:
                success = await NutritionManager.shared.addMeal(
                    name: name.trimmingCharacters(in: .whitespaces),
                    mealType: mealType,
                    calories: cal,
                    protein: p,
                    fats: f,
                    carbs: c
                )
            case .edit(let meal):
                success = await NutritionManager.shared.updateMeal(
                    id: meal.id,
                    name: name.trimmingCharacters(in: .whitespaces),
                    mealType: mealType,
                    calories: cal,
                    protein: p,
                    fats: f,
                    carbs: c
                )
            }

            isSaving = false

            if success {
                dismiss()
            } else {
                errorMessage = "Не удалось сохранить приём пищи. Проверьте подключение и попробуйте снова."
                showError = true
            }
        }
    }
}
