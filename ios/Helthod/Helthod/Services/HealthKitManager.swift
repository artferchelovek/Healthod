import Foundation
import HealthKit
import Combine

@MainActor
class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    @Published var stepCount: Int = 0
    @Published var isAuthorized = false

    private let healthStore = HKHealthStore()

    private init() {}

    func requestAuthorization() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("HealthKit недоступен на этом устройстве")
            return false
        }

        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!
        ]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
            isAuthorized = true
            return true
        } catch {
            print("ошибка авторизации HealthKit: \(error)")
            return false
        }
    }

    func fetchTodaySteps() async {
        if !isAuthorized {
            let authorized = await requestAuthorization()
            guard authorized else { return }
        }

        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let predicate = HKQuery.predicateForSamples(
            withStart: Calendar.current.startOfDay(for: Date()),
            end: Date(),
            options: .strictStartDate
        )

        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, _ in
                let steps = result?.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
                Task { @MainActor in
                    self.stepCount = Int(steps)
                }
                continuation.resume()
            }
            healthStore.execute(query)
        }
    }
}
