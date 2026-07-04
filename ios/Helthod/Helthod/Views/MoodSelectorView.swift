import SwiftUI

struct MoodSelectorView: View {
    @ObservedObject private var moodManager = MoodManager.shared

    var body: some View {
        HStack(spacing: 10) {
            ForEach(Mood.allCases, id: \.self) { mood in
                Button(action: {
                    Task { await moodManager.setMood(mood) }
                }) {
                    VStack(spacing: 6) {
                        Image(systemName: mood.systemImage)
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundColor(moodManager.currentMood == mood ? mood.color : Color(red: 0.55, green: 0.52, blue: 0.44))
                        Text(mood.shortTitle)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(moodManager.currentMood == mood ? mood.color : Color(red: 0.55, green: 0.52, blue: 0.44))
                    }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(moodManager.currentMood == mood ? mood.color.opacity(0.15) : Color.white)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(moodManager.currentMood == mood ? mood.color.opacity(0.4) : Color.clear, lineWidth: 1.5)
                        )
                }
                .buttonStyle(.plain)
            }
        }
    }
}
