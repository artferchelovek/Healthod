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

    private var apiKey: String {
        if let path = Bundle.main.path(forResource: "Secrets", ofType: "plist"),
           let dict = NSDictionary(contentsOfFile: path),
           let key = dict["OPENROUTER_API_KEY"] as? String {
            return key
        }
        return "sk-or-v1-"
    }

    private let models: [String] = [
        "qwen/qwen3-coder:free",
        "nousresearch/hermes-3-llama-3.1-405b:free",
        "liquid/lfm-2.5-1.2b-instruct:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "google/gemma-4-26b-a4b-it:free",
    ]

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

        for model in models {
            if let result = await tryModel(model, messages: messages) {
                return result
            }
            try? await Task.sleep(nanoseconds: 500_000_000)
        }

        return nil
    }

    private func tryModel(_ model: String, messages: [[String: Any]]) async -> AIRecommendation? {
        let body: [String: Any] = [
            "model": model,
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

            guard let httpResponse = response as? HTTPURLResponse else { return nil }

            guard httpResponse.statusCode == 200 else {
                let body = String(data: data, encoding: .utf8) ?? "no body"
                print("OpenRouter \(model) \(httpResponse.statusCode): \(body.prefix(200))")
                return nil
            }

            let apiResponse = try JSONDecoder().decode(OpenRouterResponse.self, from: data)
            guard let content = apiResponse.choices?.first?.message?.content else {
                let raw = String(data: data, encoding: .utf8) ?? "nil"
                print("OpenRouter \(model): пустой ответ, raw: \(raw.prefix(500))")
                return nil
            }

            let cleaned = content
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .replacingOccurrences(of: "^```(?:json)?\\s*", with: "", options: .regularExpression)
                .replacingOccurrences(of: "\\s*```$", with: "", options: .regularExpression)

            guard let jsonData = cleaned.data(using: .utf8),
                  let recommendation = try? JSONDecoder().decode(AIRecommendation.self, from: jsonData) else {
                print("OpenRouter \(model): не удалось распарсить JSON, ответ: \(cleaned.prefix(500))")
                return nil
            }

            return recommendation
        } catch {
            print("OpenRouter \(model) ошибка: \(error)")
            return nil
        }
    }
}
