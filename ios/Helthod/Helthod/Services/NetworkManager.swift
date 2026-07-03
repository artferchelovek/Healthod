import Foundation

class NetworkManager {
static let shared = NetworkManager()
    
    private init() {}
    
    private var baseURL: String = "https://temp.lilv2dim.ru/api"
    
    enum NetworkError: Error {
        case badURL
        case invalidResponse
        case decodingError
    }
  
    func fetch<T: Decodable>(endpoint: String) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw NetworkError.invalidResponse
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            print("Ошибка декодирования: \(error)")
            throw NetworkError.decodingError
        }
    }
 
    func post<RequestBody: Encodable, ResponseBody: Decodable>(endpoint: String, body: RequestBody) async throws -> ResponseBody {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.badURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        print("📱 iOS запрос на \(endpoint) вернул статус-код: \(httpResponse.statusCode)")
        
        guard (200...299).contains(httpResponse.statusCode) else {
        
            throw NetworkError.invalidResponse
        }
    
        return try JSONDecoder().decode(ResponseBody.self, from: data)
    }
}
