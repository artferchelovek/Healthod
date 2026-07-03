import Foundation
import SwiftUI
import Combine

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct AuthResponse: Decodable {
    let token: String
}

struct RegisterResponse: Decodable {
    let message: String
    let user: RegisterUser
}

struct RegisterUser: Decodable {
    let id: String
    let email: String
    let username: String
    let age: Int
    let weight: Double
    let height: Double
    let goal: String
    let createdAt: String
}
struct RegisterRequest: Encodable {
    let email: String
    let username: String
    let password: String
    let age: Int
    let weight: Double
    let height: Double
    let goal: FitnessGoal
}

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()
    
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false
    @Published var lastError: String?
    
    private let tokenKey = "user_jwt_token"
    
    private init() {
        self.isAuthenticated = checkSavedToken()
    }
    
    func login(email: String, password: String) async -> Bool {
        self.isLoading = true
        defer { self.isLoading = false }
        
        let loginBody = LoginRequest(email: email, password: password)
        
        do {

            let response: AuthResponse = try await NetworkManager.shared.post(endpoint: "/auth/login", body: loginBody)
            saveToken(response.token)
            self.isAuthenticated = true
            return true
            
        } catch {
            self.lastError = error.localizedDescription
            return false
        }
    }
    
    func logout() {
        removeToken()
        self.isAuthenticated = false
    }
    func register(
        email: String,
        username: String,
        password: String,
        age: Int,
        weight: Double,
        height: Double,
        goal: FitnessGoal
    ) async -> Bool {
        self.isLoading = true
        defer { self.isLoading = false }
    
        let registerBody = RegisterRequest(
            email: email,
            username: username,
            password: password,
            age: age,
            weight: weight,
            height: height,
            goal: goal
        )
        
        do {
            let _: RegisterResponse = try await NetworkManager.shared.post(endpoint: "/auth/register", body: registerBody)
            
            return await login(email: email, password: password)
            
        } catch {
            self.lastError = error.localizedDescription
            return false
        }
    }
    
    private func saveToken(_ token: String) { UserDefaults.standard.set(token, forKey: tokenKey) }
    func getToken() -> String? { UserDefaults.standard.string(forKey: tokenKey) }
    private func removeToken() { UserDefaults.standard.removeObject(forKey: tokenKey) }
    private func checkSavedToken() -> Bool { getToken() != nil }
}
