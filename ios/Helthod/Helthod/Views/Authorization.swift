import SwiftUI
import Foundation

enum AuthMode {
    case login
    case register
}

enum FitnessGoal: String, CaseIterable, Encodable {
    case loseWeight = "lose_weight"
    case gainMuscle = "gain_muscle"
    case maintain   = "maintain"
    
    var title: String {
        switch self {
        case .loseWeight: return "Сбросить вес"
        case .gainMuscle: return "Набрать массу"
        case .maintain:   return "Поддерживать форму"
        }
    }
    
    var icon: String {
        switch self {
        case .loseWeight: return "flame.fill"
        case .gainMuscle: return "figure.cross-training"
        case .maintain:   return "heart.text.square.fill"
        }
    }
}

struct AuthView: View {
    @State private var currentMode: AuthMode = .login
    
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var ageString = ""
    @State private var weightString = ""
    @State private var heightString = ""
    @State private var selectedGoal: FitnessGoal = .loseWeight
    
    @ObservedObject private var authManager = AuthManager.shared
    @State private var errorMessage: String?
    @State private var showError = false
    
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 24) {

                VStack(spacing: 12) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.white)
                        .padding(20)
                        .background(Color(red: 0.31, green: 0.40, blue: 0.33))
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                    
                    Text("Healthod")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(Color(red: 0.12, green: 0.12, blue: 0.12))
                    
                    Text("Тренировки, питание и настроение")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.top, 40)
                
            
                HStack(spacing: 0) {
                  
                    Button(action: { currentMode = .login }) {
                        Text("Вход")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(currentMode == .login ? .black : .gray)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(currentMode == .login ? Color.white : Color.clear)
                            .cornerRadius(10)
                            .padding(4)
                    }
                    
             
                    Button(action: { currentMode = .register }) {
                        Text("Регистрация")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(currentMode == .register ? .black : .gray)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(currentMode == .register ? Color.white : Color.clear)
                            .cornerRadius(10)
                            .padding(4)
                    }
                }
                .frame(height: 50)
                .background(Color(red: 0.95, green: 0.94, blue: 0.91)) //
                .cornerRadius(14)
                .padding(.horizontal)
                
        
                VStack(spacing: 0) {
                   
                    if currentMode == .register {
                        HStack {
                            Image(systemName: "person")
                                .foregroundColor(.gray)
                            TextField("Имя пользователя", text: $username)
                        }
                        .padding()
                        Divider().padding(.horizontal)
                    }
 
                    HStack {
                        Image(systemName: "envelope")
                            .foregroundColor(.gray)
                        TextField("Email", text: $email)
                            .autocapitalization(.none)
                                .disableAutocorrection(true)
                                .keyboardType(.emailAddress)
                    }
                    .padding()
                    
                    
                    Divider().padding(.horizontal)
                    
                    HStack {
                        Image(systemName: "lock")
                            .foregroundColor(.gray)
                        SecureField("Пароль", text: $password)
                            .textContentType(.password)
                    }
                    .padding()
                
                    if currentMode == .register {
                        Group {
                            Divider().padding(.horizontal)
                            HStack {
                                Image(systemName: "calendar")
                                    .foregroundColor(.gray)
                                TextField("Возраст", text: $ageString).keyboardType(.numberPad)
                            }.padding()
                            
                            Divider().padding(.horizontal)
                            HStack {
                                Image(systemName: "scalemass")
                                    .foregroundColor(.gray)
                                TextField("Вес (кг)", text: $weightString).keyboardType(.decimalPad)
                            }.padding()
                            
                            Divider().padding(.horizontal)
                            HStack {
                                Image(systemName: "figure.walk")
                                    .foregroundColor(.gray)
                                TextField("Рост (см)", text: $heightString).keyboardType(.numberPad)
                            }.padding()
                        }
                        GoalSelectorView(selectedGoal: $selectedGoal)
                                .padding(.top, 9)
                                .transition(.opacity.combined(with: .move(edge: .top)))
                    }
                   
                }
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
                .padding(.horizontal)
                
           
                
                if authManager.isLoading {
                    ProgressView()
                } else {
                    Button(action: { handleAction() }) {
                        Text(currentMode == .login ? "Войти" : "Зарегистрироваться")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color(red: 0.31, green: 0.40, blue: 0.33))
                            .cornerRadius(14)
                    }
                    .padding(.horizontal)
                }
            
            }
            .padding(.bottom, 20)
        }
        .background(Color(red: 0.96, green: 0.95, blue: 0.93).edgesIgnoringSafeArea(.all))
        .animation(.easeInOut(duration: 0.25), value: currentMode)
        .alert("Ошибка", isPresented: $showError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage ?? "Неизвестная ошибка")
        } 
    }
    
    private func handleAction() {
        Task {
            let success: Bool
            if currentMode == .login {
                success = await authManager.login(email: email, password: password)
            } else {
                success = await authManager.register(
                    email: email, username: username, password: password,
                    age: Int(ageString) ?? 0, weight: Double(weightString) ?? 0.0,
                    height: Double(heightString) ?? 0.0, goal: selectedGoal
                )
            }
            if !success {
                errorMessage = authManager.lastError ?? "Ошибка соединения с сервером. Проверьте подключение к интернету и попробуйте снова."
                showError = true
            }
        }
    }
}
#Preview {
    AuthView()
}
