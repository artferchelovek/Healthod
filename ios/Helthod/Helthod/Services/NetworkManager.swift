import Foundation

class NetworkManager {
static let shared = NetworkManager()
    
    private init() {}
    
    private var baseURL: String = "https://api.health.lilv2dim.ru/api"
    
    enum NetworkError: Error, LocalizedError {
        case badURL
        case invalidResponse
        case decodingError
        case unauthorized
        case serverError(String)

        var errorDescription: String? {
            switch self {
            case .badURL: return "Неверный URL"
            case .invalidResponse: return "Ошибка сервера"
            case .decodingError: return "Ошибка обработки данных"
            case .unauthorized: return "Требуется авторизация"
            case .serverError(let msg): return msg
            }
        }
    }
  
    private func addAuthHeader(to request: inout URLRequest) {
        if let token = AuthManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }
    
    private func handleResponse(_ response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        print("📱 iOS запрос вернул статус-код: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode == 401 {
            if let errorBody = String(data: data, encoding: .utf8) {
                print("401 — неавторизован: \(errorBody)")
            }
            AuthManager.shared.logout()
            throw NetworkError.unauthorized
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            let errorBody = String(data: data, encoding: .utf8) ?? ""
            print("Тело ответа с ошибкой: \(errorBody)")

            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: String],
               let msg = json["error"] ?? json["message"] {
                throw NetworkError.serverError(msg)
            }
            throw NetworkError.serverError(errorBody)
        }
    }
    
    func fetch<T: Decodable>(endpoint: String) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        addAuthHeader(to: &request)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: data)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            print("Ошибка декодирования: \(error)")
            throw NetworkError.decodingError
        }
    }
 
    func sendPost<RequestBody: Encodable>(endpoint: String, body: RequestBody) async throws {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        addAuthHeader(to: &request)
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: data)
    }

    func sendPatch<RequestBody: Encodable>(endpoint: String, body: RequestBody) async throws {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        addAuthHeader(to: &request)
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: data)
    }
    
    func post<RequestBody: Encodable, ResponseBody: Decodable>(endpoint: String, body: RequestBody) async throws -> ResponseBody {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        addAuthHeader(to: &request)
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: data)
    
        return try JSONDecoder().decode(ResponseBody.self, from: data)
    }
    
    func uploadImage(data: Data) async throws -> String {
        guard let url = URL(string: "\(baseURL)/upload") else {
            throw NetworkError.badURL
        }
        
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60
        addAuthHeader(to: &request)
        request.httpBody = body
        
        let (responseData, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: responseData)
        
        struct UploadResponse: Decodable {
            let imageUrl: String?
        }
        
        do {
            let decoded = try JSONDecoder().decode(UploadResponse.self, from: responseData)
            if let url = decoded.imageUrl, !url.isEmpty { return url }
        } catch {
            if let path = String(data: responseData, encoding: .utf8)?
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .trimmingCharacters(in: CharacterSet(charactersIn: "\"")),
                !path.isEmpty, !path.hasPrefix("{") {
                return path
            }
        }
        
        throw NetworkError.invalidResponse
    }
    
    func patch<RequestBody: Encodable, ResponseBody: Decodable>(endpoint: String, body: RequestBody) async throws -> ResponseBody {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        addAuthHeader(to: &request)
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: data)
    
        return try JSONDecoder().decode(ResponseBody.self, from: data)
    }

    func delete<RequestBody: Encodable, ResponseBody: Decodable>(endpoint: String, body: RequestBody) async throws -> ResponseBody {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        addAuthHeader(to: &request)
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: data)
    
        return try JSONDecoder().decode(ResponseBody.self, from: data)
    }

    func delete<ResponseBody: Decodable>(endpoint: String) async throws -> ResponseBody {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.timeoutInterval = 30
        addAuthHeader(to: &request)

        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response, data: data)
    
        return try JSONDecoder().decode(ResponseBody.self, from: data)
    }
}
