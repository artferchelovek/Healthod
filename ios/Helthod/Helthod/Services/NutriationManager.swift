import Foundation
import Combine

enum MealType: String, CaseIterable, Codable {
    case breakfast = "BREAKFAST"
    case lunch = "LUNCH"
    case dinner = "DINNER"
    case snack = "SNACK"

    var title: String {
        switch self {
        case .breakfast: return "Завтрак"
        case .lunch: return "Обед"
        case .dinner: return "Ужин"
        case .snack: return "Перекус"
        }
    }

    var icon: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.stars.fill"
        case .snack: return "cup.and.saucer.fill"
        }
    }
}

struct FoodItem: Identifiable, Codable {
    let id: String
    let userId: String
    let foodName: String
    let mealType: MealType
    let calories: Double
    let protein: Double
    let fats: Double
    let carbs: Double
    let createdAt: String

    var name: String { foodName }
}

struct FoodListResponse: Decodable {
    let summary: FoodSummary
    let foods: [FoodItem]
}

struct FoodSummary: Decodable {
    let calories: Double
    let protein: Double
    let fats: Double
    let carbs: Double
}

struct CreateFoodRequest: Encodable {
    let foodName: String
    let mealType: MealType
    let calories: Double
    let protein: Double
    let fats: Double
    let carbs: Double
}

struct UpdateFoodRequest: Encodable {
    let foodName: String
    let mealType: MealType
    let calories: Double
    let protein: Double
    let fats: Double
    let carbs: Double
}

@MainActor
class NutritionManager: ObservableObject {
    static let shared = NutritionManager()

    @Published var meals: [FoodItem] = []
    @Published var consumedCalories: Double = 0
    @Published var targetCalories: Double = 2200
    @Published var isLoading = false

    @Published var proteins: Double = 0
    @Published var fats: Double = 0
    @Published var carbs: Double = 0

    @Published var targetProteins: Double = 110
    @Published var targetFats: Double = 70
    @Published var targetCarbs: Double = 220

    private let network = NetworkManager.shared

    private init() {}

    func fetchMeals() async {
        isLoading = true
        do {
            let response: FoodListResponse = try await network.fetch(endpoint: "/food/today")
            meals = response.foods
            consumedCalories = response.summary.calories
            proteins = response.summary.protein
            fats = response.summary.fats
            carbs = response.summary.carbs
        } catch {
            print("❌ Ошибка загрузки приёмов пищи: \(error)")
        }
        isLoading = false
    }

    func addMeal(name: String, mealType: MealType, calories: Double, protein: Double = 0, fats: Double = 0, carbs: Double = 0) async -> Bool {
        let body = CreateFoodRequest(foodName: name, mealType: mealType, calories: calories, protein: protein, fats: fats, carbs: carbs)
        do {
            try await network.sendPost(endpoint: "/food", body: body)
            await fetchMeals()
            return true
        } catch {
            print("❌ Ошибка добавления приёма пищи: \(error)")
            return false
        }
    }

    func updateMeal(id: String, name: String, mealType: MealType, calories: Double, protein: Double = 0, fats: Double = 0, carbs: Double = 0) async -> Bool {
        let body = UpdateFoodRequest(foodName: name, mealType: mealType, calories: calories, protein: protein, fats: fats, carbs: carbs)
        do {
            try await network.sendPatch(endpoint: "/food/\(id)", body: body)
            await fetchMeals()
            return true
        } catch {
            print("❌ Ошибка обновления приёма пищи: \(error)")
            return false
        }
    }

    func deleteMeal(id: String) async -> Bool {
        do {
            let _: [String: String] = try await network.delete(endpoint: "/food/\(id)", body: ["": ""])
            meals.removeAll { $0.id == id }
            await fetchMeals()
            return true
        } catch {
            print("❌ Ошибка удаления приёма пищи: \(error)")
            return false
        }
    }
}
