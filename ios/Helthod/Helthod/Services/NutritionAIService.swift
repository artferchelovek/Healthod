import Foundation

struct AIRecommendation: Decodable {
    let calories: Int
    let protein: Int
    let fats: Int
    let carbs: Int
    let reasoning: String
}

struct OpenRouterResponse: Decodable {
    let choices: [OpenRouterChoice]?
}

struct OpenRouterChoice: Decodable {
    let message: OpenRouterMessage?
}

struct OpenRouterMessage: Decodable {
    let content: String?
}

@MainActor
class NutritionAIService {
    static let shared = NutritionAIService()

    private let apiKey = "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"

    private init() {}

    func getRecommendation(age: Int, weight: Double, height: Double, goal: String) async -> AIRecommendation? {
        let goalText: String
        switch goal {
        case "LOSE_WEIGHT": goalText = "похудение"
        case "GAIN_MUSCLE": goalText = "набор мышечной массы"
        case "MAINTAIN": goalText = "поддержание веса"
        default: goalText = goal
        }

        let prompt = """
        Ты эксперт-диетолог и фитнес-тренер.
        Рассчитай дневную норму калорий и макронутриентов (белки, жиры, углеводы в граммах) для пользователя:
        Возраст: \(age) лет
        Вес: \(Int(weight)) кг
        Рост: \(Int(height)) см
        Цель: \(goalText)

        Ответь строго JSON-объектом с ключами: "calories", "protein", "fats", "carbs", "reasoning" (краткое пояснение расчёта на русском, 2-3 предложения). Без markdown-разметки и лишнего текста.
        """

        let messages: [[String: Any]] = [
            ["role": "system", "content": "Ты диетолог. Отвечай только JSON без пояснений и markdown."],
            ["role": "user", "content": prompt]
        ]

        let body: [String: Any] = [
            "model": "google/gemma-4-26b-a4b-it:free",
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 500
        ]

        guard let url = URL(string: "https://openrouter.ai/api/v1/chat/completions") else {
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("Helthod", forHTTPHeaderField: "X-Title")
        request.timeoutInterval = 30
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
                let body = String(data: data, encoding: .utf8) ?? "no body"
                print("OpenRouter HTTP \(httpResponse.statusCode): \(body)")
                return nil
            }

            let apiResponse = try JSONDecoder().decode(OpenRouterResponse.self, from: data)
            guard let content = apiResponse.choices?.first?.message?.content else {
                let raw = String(data: data, encoding: .utf8) ?? "nil"
                print(" OpenRouter: пустой ответ, raw: \(raw.prefix(500))")
                return nil
            }

            let cleaned = content
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .replacingOccurrences(of: "^```(?:json)?\\s*", with: "", options: .regularExpression)
                .replacingOccurrences(of: "\\s*```$", with: "", options: .regularExpression)

            guard let jsonData = cleaned.data(using: .utf8),
                  let recommendation = try? JSONDecoder().decode(AIRecommendation.self, from: jsonData) else {
                print(" OpenRouter: не удалось распарсить JSON, ответ: \(cleaned.prefix(500))")
                return nil
            }

            return recommendation
        } catch {
            print("OpenRouter ошибка: \(error)")
            return nil
        }
    }
}
