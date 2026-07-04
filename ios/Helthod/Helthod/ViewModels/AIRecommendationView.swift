import SwiftUI

struct AIRecommendationView: View {
    let recommendation: AIRecommendation
    let onApply: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 40))
                    .foregroundColor(Color(red: 0.31, green: 0.40, blue: 0.33))

                Text("Рекомендация ИИ")
                    .font(.title2).bold()

                VStack(spacing: 16) {
                    macroRow(title: "Калории", value: "\(recommendation.calories) ккал", color: .darkGreen)
                    macroRow(title: "Белки", value: "\(recommendation.protein) г", color: .darkGreen)
                    macroRow(title: "Жиры", value: "\(recommendation.fats) г", color: .terracotaColor)
                    macroRow(title: "Углеводы", value: "\(recommendation.carbs) г", color: .mustardColor)
                }
                .padding()
                .background(Color.white)
                .cornerRadius(16)

                Text(recommendation.reasoning)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                HStack(spacing: 16) {
                    Button(action: { dismiss() }) {
                        Text("Отмена")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(red: 0.89, green: 0.86, blue: 0.78))
                            .cornerRadius(14)
                            .foregroundColor(Color(red: 0.13, green: 0.11, blue: 0.08))
                    }

                    Button(action: {
                        onApply()
                        dismiss()
                    }) {
                        Text("Применить")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(red: 0.31, green: 0.40, blue: 0.33))
                            .cornerRadius(14)
                            .foregroundColor(.white)
                    }
                }
            }
            .padding(24)
            .background(Color(red: 0.96, green: 0.95, blue: 0.93).ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Закрыть") { dismiss() }
                }
            }
        }
    }

    private func macroRow(title: String, value: String, color: Color) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 15, weight: .medium))
            Spacer()
            Text(value)
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(color)
        }
    }
}
