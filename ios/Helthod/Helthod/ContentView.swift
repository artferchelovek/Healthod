import SwiftUI

struct ContentView: View {
    @ObservedObject private var authManager = AuthManager.shared
    @ObservedObject private var postsManager = PostManager.shared
    var body: some View {
        if authManager.isAuthenticated {
            
            MainTabView()
        } else {
            AuthView()
        }
    }
}
