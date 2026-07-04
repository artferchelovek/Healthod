import SwiftUI

struct CircularProgressView: View {

    let progress: Double
    let total: Double
    

    private var normalizedProgress: Double {
        guard total > 0 else { return 0 }

        return min(max(progress / total, 0), 1)
    }

    let ringColor = Color.darkGreen
    let backgroundColor = Color.mainColor
    let textColor = Color.inkSoft
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(
                    backgroundColor,
                    style: StrokeStyle(lineWidth: 15, lineCap: .round)
                )
            Circle()
                .trim(from: 0, to: normalizedProgress)
                .stroke(
                    ringColor,
                    style: StrokeStyle(lineWidth: 15, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 1.0), value: progress)
           
            VStack(spacing: 0) {
                Text("\(Int(progress))")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                Text("из \(Int(total)) ккал")
                    .font(.caption)
                    .foregroundColor(textColor.opacity(0.7))
            }
        }
        .foregroundColor(textColor)
        .frame(width: 150, height: 150)
        .padding()
    }
}


struct CircularProgressView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 30) {
            CircularProgressView(progress: 1400, total: 2000)
            
            CircularProgressView(progress: 300, total: 2000)
                .frame(width: 100, height: 100)
        }
        .previewLayout(.sizeThatFits)
        .padding()
    }
}
