import SwiftUI
struct GoalSelectorView: View {
    @Binding var selectedGoal: FitnessGoal
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ваша главная цель")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.gray)
                .padding(.horizontal, 4)
            
            VStack(spacing: 10) {
                ForEach(FitnessGoal.allCases, id: \.self) { goal in
                    let isSelected = selectedGoal == goal
                    
                    Button(action: {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedGoal = goal
                        }
                    }) {
                        HStack {
                            Spacer()
                            
                            Text(goal.title)
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(isSelected ? .white : .black)
                            
                            Spacer()
                        }
                        .padding(.vertical, 16)
                        .background(isSelected ? Color(red: 0.31, green: 0.40, blue: 0.33) : Color.white)
                        .cornerRadius(14)
                        .shadow(color: Color.black.opacity(isSelected ? 0 : 0.03), radius: 8, x: 0, y: 4)
                        .scaleEffect(isSelected ? 1.01 : 1.0)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
}
