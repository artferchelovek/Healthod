import SwiftUI

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showEditProfile = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Загрузка профиля")
                } else if let profile = viewModel.profile {
                    profileContent(profile)
                } else {
                    VStack(spacing: 12) {
                        Text("Не удалось загрузить профиль")
                            .foregroundColor(.gray)
                        Button("Повторить") {
                            Task { await viewModel.fetchProfile() }
                        }
                        .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                    }
                }
            }
            .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.showingSettings.toggle() }) {
                        Image(systemName: "gearshape")
                            .font(.system(size: 16))
                            .foregroundColor(.black)
                            .frame(width: 34, height: 34)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    .confirmationDialog("Настройки", isPresented: $viewModel.showingSettings) {
                        Button("Выйти из аккаунта", role: .destructive) {
                            viewModel.logout()
                        }
                        Button("Отмена", role: .cancel) { }
                    }
                }
            }
            .task {
                await viewModel.fetchProfile()
            }
        }
    }

    private func profileContent(_ profile: UserProfile) -> some View {
        ScrollView {
            VStack(spacing: 0) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [
                                Color(red: 0.85, green: 0.89, blue: 0.83),
                                Color(red: 0.96, green: 0.87, blue: 0.81)
                            ], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 88, height: 88)

                        Image(systemName: "person.fill")
                            .font(.system(size: 36))
                            .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))
                    }

                    Text(profile.username)
                        .font(.title2).fontWeight(.bold)

                    Text("Бегаю по утрам · в Healthod с \(profile.relativeDate)")
                        .font(.subheadline)
                        .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
                        .multilineTextAlignment(.center)

                    HStack(spacing: 10) {
                        Button(action: { showEditProfile = true }) {
                            Text("Редактировать")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 22)
                                .padding(.vertical, 9)
                                .background(Color(red: 0.31, green: 0.40, blue: 0.33))
                                .cornerRadius(10)
                        }

                        Button(action: {}) {
                            Text("Поделиться")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(Color(red: 0.13, green: 0.11, blue: 0.08))
                                .padding(.horizontal, 22)
                                .padding(.vertical, 9)
                                .background(Color(red: 0.89, green: 0.86, blue: 0.78))
                                .cornerRadius(10)
                        }
                    }
                    .padding(.top, 4)
                    .sheet(isPresented: $showEditProfile) {
                        EditProfileView(viewModel: viewModel)
                    }

                    HStack(spacing: 34) {
                        StatColumn(value: "42", label: "Тренировки")
                        StatColumn(value: "18", label: "Посты")
                        StatColumn(value: "210", label: "Подписчики")
                    }
                    .padding(.vertical, 20)
                }
                .padding(.horizontal, 20)

                VStack(spacing: 0) {
                    sectionHeader("НАСТРОЕНИЕ")
                        .padding(.bottom, 8)

                    MoodSelectorView()
                        .padding(.bottom, 12)

                    sectionHeader("ДОСТИЖЕНИЯ")
                        .padding(.bottom, 8)

                    HStack(spacing: 14) {
                        AchievementBadge(
                            icon: "star.fill",
                            color: AnyShapeStyle(LinearGradient(colors: [
                                Color(red: 0.35, green: 0.48, blue: 0.36),
                                Color(red: 0.25, green: 0.36, blue: 0.26)
                            ], startPoint: .topLeading, endPoint: .bottomTrailing)),
                            label: "Первая тренировка",
                            unlocked: true
                        )
                        AchievementBadge(
                            icon: "flame.fill",
                            color: AnyShapeStyle(LinearGradient(colors: [
                                Color(red: 0.87, green: 0.53, blue: 0.41),
                                Color(red: 0.78, green: 0.61, blue: 0.24)
                            ], startPoint: .topLeading, endPoint: .bottomTrailing)),
                            label: "7 дней подряд",
                            unlocked: true
                        )
                AchievementBadge(
                    icon: "person.2.fill",
                    color: AnyShapeStyle(Color(red: 0.89, green: 0.86, blue: 0.78)),
                    label: "100 подписчиков",
                    unlocked: false
                )
                    }
                    .padding(.bottom, 12)

                    sectionHeader("СИНХРОНИЗАЦИЯ")
                        .padding(.bottom, 8)

                    VStack(spacing: 0) {
                        SyncRow(name: "Apple Health", isOn: true)
                        Divider().padding(.leading, 14)
                        SyncRow(name: "Samsung Health", isOn: false)
                        Divider().padding(.leading, 14)
                        SyncRow(name: "Mi Health", isOn: false)
                    }
                    .background(Color.white)
                    .cornerRadius(14)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 100)
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
    }
}

struct StatColumn: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 19, weight: .bold))
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(Color(red: 0.55, green: 0.52, blue: 0.44))
        }
    }
}

struct AchievementBadge: View {
    let icon: String
    let color: AnyShapeStyle
    let label: String
    let unlocked: Bool

    var body: some View {
        VStack(spacing: 8) {
            Circle()
                .fill(unlocked ? color : AnyShapeStyle(Color(red: 0.89, green: 0.86, blue: 0.78)))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(unlocked ? .white : Color(red: 0.55, green: 0.52, blue: 0.44))
                )

            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(unlocked ? Color(red: 0.55, green: 0.52, blue: 0.44) : .gray.opacity(0.6))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 70)
        }
        .opacity(unlocked ? 1 : 0.4)
    }
}

struct SyncRow: View {
    let name: String
    @State var isOn: Bool

    var body: some View {
        HStack {
            Text(name)
                .font(.system(size: 15, weight: .medium))
            Spacer()
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(Color(red: 0.31, green: 0.40, blue: 0.33))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
    }
}
