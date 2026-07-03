import SwiftUI

struct TrainView: View {
    @StateObject private var workoutManager = WorkoutManager.shared
    @StateObject private var healthKitManager = HealthKitManager.shared
    @State private var showAddSheet = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    weekSummaryCard

                    if workoutManager.isLoading && workoutManager.workouts.isEmpty {
                        Spacer().frame(height: 40)
                        ProgressView("Загрузка тренировок")
                        Spacer().frame(height: 40)
                    } else if workoutManager.workouts.isEmpty {
                        Spacer().frame(height: 40)
                        Text("Нет тренировок")
                            .foregroundColor(.gray)
                    } else {
                        workoutList
                    }
                }
                .padding(.bottom, 100)
            }
            .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            .navigationTitle("Тренировки")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
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
            .sheet(isPresented: $showAddSheet) {
                AddWorkoutView()
            }
            .task {
                await healthKitManager.fetchTodaySteps()
                await workoutManager.fetchWorkouts()
            }
        }
    }

    private var weekSummaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Эта неделя")
                    .font(.system(size: 12.5, weight: .medium))
                    .opacity(0.85)
                Spacer()
                Text("\(Int(workoutManager.weekCalories)) ккал · \(workoutManager.workouts.count) тренировок")
                    .font(.system(size: 13, weight: .bold))
            }

            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 14))
                Text("\(healthKitManager.stepCount)")
                    .font(.system(size: 15, weight: .bold))
                Text("шагов сегодня")
                    .font(.system(size: 12))
                    .opacity(0.7)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .foregroundColor(.white)
        .padding(16)
        .background(Color(red: 0.31, green: 0.40, blue: 0.33))
        .cornerRadius(16)
        .padding(.horizontal, 16)
        .padding(.top, 8)
    }

    private var workoutList: some View {
        let grouped = Dictionary(grouping: workoutManager.workouts) { workout -> String in
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: workout.createdAt) {
                let dayFormatter = DateFormatter()
                dayFormatter.locale = Locale(identifier: "ru_RU")
                if Calendar.current.isDateInToday(date) {
                    return "СЕГОДНЯ"
                } else if Calendar.current.isDateInYesterday(date) {
                    return "ВЧЕРА"
                } else {
                    dayFormatter.dateFormat = "d MMMM"
                    return dayFormatter.string(from: date).uppercased()
                }
            }
            return ""
        }

        return VStack(spacing: 16) {
            ForEach(Array(grouped.keys.sorted().reversed()), id: \.self) { key in
                let workouts = grouped[key] ?? []
                let totalCal = workouts.reduce(0) { $0 + $1.totalCalories }

                sectionHeader("\(key) · \(Int(totalCal)) ККАЛ")

                VStack(spacing: 0) {
                    ForEach(Array(workouts.enumerated()), id: \.offset) { _, workout in
                        workoutCard(workout)
                        if workout.id != workouts.last?.id {
                            Divider().padding(.leading, 14)
                        }
                    }
                }
                .background(Color.white)
                .cornerRadius(14)
                .padding(.horizontal, 16)
            }
        }
        .padding(.top, 6)
    }

    private func workoutCard(_ workout: Workout) -> some View {
        VStack(spacing: 0) {
            ForEach(Array(workout.exercises.enumerated()), id: \.offset) { _, exercise in
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(exercise.name)
                            .font(.system(size: 15, weight: .semibold))
                        if exercise.reps != nil {
                            Text("\(exercise.sets) подхода × \(exercise.reps!)")
                                .font(.system(size: 12))
                                .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                        } else {
                            Text("\(exercise.sets) подхода")
                                .font(.system(size: 12))
                                .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                        }
                    }

                    Spacer()

                    Text("\(Int(exercise.calories))")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color(red: 0.85, green: 0.89, blue: 0.83).opacity(0.4))
                        .cornerRadius(6)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 11)

                if exercise.id != workout.exercises.last?.id {
                    Divider().padding(.leading, 14)
                }
            }
        }
    }

    private func sectionHeader(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                .padding(.leading, 4)
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 6)
    }
}
