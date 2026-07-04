import SwiftUI

struct FoodView: View {
    @ObservedObject private var nutritionManager = NutritionManager.shared
    @State private var showAddSheet = false
    @State private var editingMeal: FoodItem?
    @State private var showDeleteAlert = false
    @State private var mealToDelete: FoodItem?
    @State private var showAI = false
    @State private var aiLoading = false
    @State private var aiRecommendation: AIRecommendation?
    @State private var aiError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    HStack(spacing: 20) {
                        CircularProgressView(
                            progress: nutritionManager.consumedCalories,
                            total: nutritionManager.targetCalories
                        )
                        .frame(width: 160, height: 160)

                        VStack(spacing: 18) {
                            MacroMiniView(
                                title: "Белки",
                                current: nutritionManager.proteins,
                                target: nutritionManager.targetProteins,
                                color: Color.darkGreen
                            )
                            MacroMiniView(
                                title: "Жиры",
                                current: nutritionManager.fats,
                                target: nutritionManager.targetFats,
                                color: Color.terracotaColor
                            )
                            MacroMiniView(
                                title: "Углеводы",
                                current: nutritionManager.carbs,
                                target: nutritionManager.targetCarbs,
                                color: Color.mustardColor
                            )
                        }
                    }
                    .padding(20)
                    .background(Color.white)
                    .cornerRadius(16)
                    .padding(.horizontal, 16)
                    .padding(.top, 14)

                    sectionHeader("ПРИЕМЫ ПИЩИ")

                    if nutritionManager.meals.isEmpty && !nutritionManager.isLoading {
                        Text("Нет записей")
                            .foregroundColor(.gray)
                            .padding(.vertical, 20)
                    } else {
                        VStack(spacing: 0) {
                            ForEach(nutritionManager.meals) { meal in
                                MealRow(meal: meal)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        editingMeal = meal
                                    }
                                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                        Button(role: .destructive) {
                                            mealToDelete = meal
                                            showDeleteAlert = true
                                        } label: {
                                            Label("Удалить", systemImage: "trash")
                                        }
                                    }
                                if meal.id != nutritionManager.meals.last?.id {
                                    Divider()
                                        .padding(.leading, 58)
                                }
                            }
                        }
                        .background(Color.white)
                        .cornerRadius(14)
                        .padding(.horizontal, 16)
                    }

                    Button(action: { showAddSheet = true }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                            Text("Добавить приём пищи")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(14)
                        .padding(.horizontal, 16)
                        .padding(.top, 10)
                    }
                }
                .padding(.bottom, 100)
            }
            .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            .navigationTitle("Питание")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 8) {
                        Button(action: requestAI) {
                            if aiLoading {
                                ProgressView()
                                    .tint(Color(red: 0.31, green: 0.40, blue: 0.33))
                                    .frame(width: 34, height: 34)
                                    .background(.ultraThinMaterial)
                                    .clipShape(Circle())
                            } else {
                                Image(systemName: "brain.head.profile")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                                    .frame(width: 34, height: 34)
                                    .background(.ultraThinMaterial)
                                    .clipShape(Circle())
                            }
                        }
                        .disabled(aiLoading)

                        Button(action: { showAddSheet = true }) {
                            Image(systemName: "plus")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                                .frame(width: 34, height: 34)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                        }
                    }
                }
            }
            .sheet(isPresented: $showAddSheet) {
                MealView(mode: .add)
            }
            .sheet(item: $editingMeal) { meal in
                MealView(mode: .edit(meal: meal))
            }
            .sheet(isPresented: $showAI) {
                if let recommendation = aiRecommendation {
                    AIRecommendationView(recommendation: recommendation) {
                        nutritionManager.targetCalories = Double(recommendation.calories)
                        nutritionManager.targetProteins = Double(recommendation.protein)
                        nutritionManager.targetFats = Double(recommendation.fats)
                        nutritionManager.targetCarbs = Double(recommendation.carbs)
                    }
                }
            }
            .alert("Ошибка", isPresented: .init(
                get: { aiError != nil },
                set: { if !$0 { aiError = nil } }
            )) {
                Button("OK") { aiError = nil }
            } message: {
                Text(aiError ?? "")
            }
            .alert("Удалить приём пищи?", isPresented: $showDeleteAlert) {
                Button("Удалить", role: .destructive) {
                    if let meal = mealToDelete {
                        Task { await nutritionManager.deleteMeal(id: meal.id) }
                    }
                }
                Button("Отмена", role: .cancel) {}
            } message: {
                Text(mealToDelete.map { "\($0.name) — \(Int($0.calories)) ккал" } ?? "")
            }
            .task {
                await nutritionManager.fetchMeals()
            }
        }
    }

    private func requestAI() {
        aiLoading = true
        aiError = nil
        Task {
            let network = NetworkManager.shared
            do {
                let profile: UserProfile = try await network.fetch(endpoint: "/auth/me")
                let recommendation = await NutritionAIService.shared.getRecommendation(
                    age: profile.age ?? 25,
                    weight: profile.weight ?? 70,
                    height: profile.height ?? 170,
                    goal: profile.goal ?? "MAINTAIN"
                )
                aiLoading = false
                if let recommendation = recommendation {
                    aiRecommendation = recommendation
                    showAI = true
                } else {
                    aiError = "Не удалось получить рекомендацию. Попробуйте позже."
                }
            } catch {
                aiLoading = false
                aiError = "Ошибка загрузки профиля: \(error.localizedDescription)"
            }
        }
    }

    private func sectionHeader(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                .padding(.leading, 12)
            Spacer()
        }
        .padding(.top, 18)
        .padding(.bottom, 8)
    }
}

struct MealRow: View {
    let meal: FoodItem

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(red: 0.85, green: 0.89, blue: 0.83))
                    .frame(width: 32, height: 32)
                Image(systemName: meal.mealType.icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(meal.name)
                    .font(.system(size: 15, weight: .semibold))
                Text(meal.mealType.title)
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
            }

            Spacer()

            Text("\(Int(meal.calories))")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(red: 0.85, green: 0.89, blue: 0.83).opacity(0.4))
                .cornerRadius(6)

            Image(systemName: "chevron.right")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(Color(red: 0.78, green: 0.76, blue: 0.70))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }
}
