import Foundation
import Combine

struct Exercise: Identifiable, Codable {
    let id: String
    let workoutId: String
    let name: String
    let sets: Int
    let reps: Int?
    let durationSeconds: Int?
    let calories: Double
}

struct Workout: Identifiable, Codable {
    let id: String
    let userId: String
    let title: String
    let totalCalories: Double
    let createdAt: String
    let exercises: [Exercise]
}

struct CreateWorkoutRequest: Encodable {
    let title: String
}

struct AddExerciseRequest: Encodable {
    let name: String
    let sets: Int
    let repetitions: Int
    let calories: Double
}

@MainActor
class WorkoutManager: ObservableObject {
    static let shared = WorkoutManager()

    @Published var workouts: [Workout] = []
    @Published var isLoading = false
    @Published var todayCalories: Double = 0
    @Published var weekCalories: Double = 0

    private let network = NetworkManager.shared

    private init() {}

    func fetchWorkouts() async {
        isLoading = true
        do {
            let fetched: [Workout] = try await network.fetch(endpoint: "/workouts")
            workouts = fetched
            calculateTotals()
        } catch {
            print("❌ Ошибка загрузки тренировок: \(error)")
        }
        isLoading = false
    }

    func createWorkout(title: String) async -> Workout? {
        let body = CreateWorkoutRequest(title: title)
        do {
            let workout: Workout = try await network.post(endpoint: "/workouts", body: body)
            return workout
        } catch {
            print("❌ Ошибка создания тренировки: \(error)")
            return nil
        }
    }

    func addExercise(to workoutId: String, name: String, sets: Int, repetitions: Int, calories: Double) async -> Bool {
        let body = AddExerciseRequest(name: name, sets: sets, repetitions: repetitions, calories: calories)
        do {
            let _: Exercise = try await network.post(endpoint: "/workouts/\(workoutId)/exercises", body: body)
            await fetchWorkouts()
            return true
        } catch {
            print("❌ Ошибка добавления упражнения: \(error)")
            return false
        }
    }

    func deleteWorkout(id: String) async -> Bool {
        do {
            let _: [String: String] = try await network.delete(endpoint: "/workouts/\(id)", body: ["": ""])
            workouts.removeAll { $0.id == id }
            calculateTotals()
            return true
        } catch {
            print("❌ Ошибка удаления тренировки: \(error)")
            return false
        }
    }

    private func calculateTotals() {
        let calendar = Calendar.current
        let now = Date()
        var today: Double = 0
        var week: Double = 0

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        for workout in workouts {
            if let date = formatter.date(from: workout.createdAt) {
                if calendar.isDateInToday(date) {
                    today += workout.totalCalories
                }
                if let weekAgo = calendar.date(byAdding: .day, value: -7, to: now),
                   date >= weekAgo {
                    week += workout.totalCalories
                }
            }
            week += workout.totalCalories // fallback: all workouts
        }

        todayCalories = today
        weekCalories = week
    }
}
