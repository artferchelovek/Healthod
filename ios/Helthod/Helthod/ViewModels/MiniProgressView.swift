import Foundation
import SwiftUI
struct MacroMiniView: View {
    let title: String
    let current: Double
    let target: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack{
                Text(title)
                    .font(.default)
                    .foregroundColor(Color.ink)
                    .bold()
                
                Text("\(Int(current))/\(Int(target)) г")
                    .font(.system(.caption, design: .rounded))
                    .bold()
                    .foregroundColor(Color.ink)
            }
           
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.mainColor)
                    Capsule()
                        .fill(color)
                        .frame(width: geo.size.width * CGFloat(min(current / target, 1.0)))
                }
            }
            .frame(height: 6)
        }
        .frame(maxWidth: .infinity)
    }
}
