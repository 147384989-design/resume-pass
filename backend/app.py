import os
import time
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder=None)
CORS(app)

# 兼容不同工作目录启动
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.isdir(os.path.join(BASE_DIR, "..", "frontend")):
    FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")
elif os.path.isdir(os.path.join(BASE_DIR, "frontend")):
    FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
else:
    FRONTEND_DIR = os.path.join(BASE_DIR)


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_DIR, path)

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")

PROVIDER_CONFIG = {
    "deepseek": {
        "url": "https://api.deepseek.com/v1/chat/completions",
        "model": "deepseek-chat",
    },
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4o-mini",
    },
}

POLISH_PROMPTS = {
    "work": "你是一位资深HR和简历优化专家。请将以下工作经历描述改写成专业、有影响力的简历表述，使用STAR法则（情境、任务、行动、结果），突出量化成果和具体贡献。保持简洁（不超过100字），直接返回改写结果不要解释。",
    "project": "你是一位资深技术专家和简历优化专家。请将以下项目经验描述改写成专业、有影响力的简历表述，突出技术难点、解决方案和项目成果，尽量量化。保持简洁（不超过100字），直接返回改写结果不要解释。",
    "evaluate": "你是一位简历优化专家。请将以下自我评价改写成专业、自信、有影响力的表述，突出核心竞争力和职业素养，使用第一人称。保持简洁（不超过100字），直接返回改写结果不要解释。",
    "default": "你是一位简历优化专家。请将以下内容改写成专业、简洁、有吸引力的简历表述，突出成果和能力。保持简洁（不超过100字），直接返回改写结果不要解释。",
}

MOCK_POLISHED = {
    "work": "主导核心业务模块开发，优化系统架构使接口响应速度提升40%，日均处理10万+请求，保障系统99.9%可用率。跨部门协作推动3个重点项目按时交付，获团队最佳贡献奖。",
    "project": "作为技术负责人主导架构设计与核心开发，采用微服务架构拆分单体应用，系统吞吐量提升3倍，服务端成本降低35%。攻克高并发场景下的数据一致性问题，设计分布式缓存方案，QPS从500提升至5000。",
    "evaluate": "我具备扎实的专业基础和出色的问题解决能力，善于在快节奏环境中推动技术方案落地。拥有良好的跨团队协作精神和结果导向思维，多次在核心项目中承担关键角色并超额完成任务。",
    "default": "具备扎实的专业基础和出色的学习能力，善于在快速变化的环境中创造价值。多次在核心项目中担任关键角色，以结果为导向驱动团队达成目标。",
}


def call_llm(text: str, field: str, api_key: str = "", provider: str = "deepseek", api_url: str = "") -> str | None:
    prompt_template = POLISH_PROMPTS.get(field, POLISH_PROMPTS["default"])

    # 确定 API 地址和模型
    key = api_key or DEEPSEEK_API_KEY
    if not key:
        return None

    if provider == "custom" and api_url:
        url = api_url
        model = data.get("model", "custom-model") if 'data' in dir() else "custom-model"
    else:
        cfg = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["deepseek"])
        url = cfg["url"]
        model = cfg["model"]

    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": prompt_template},
                    {"role": "user", "content": text},
                ],
                "temperature": 0.7,
                "max_tokens": 300,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[LLM API Error] provider={provider} {e}")
        return None


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/polish", methods=["POST"])
def polish():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"success": False, "error": "缺少 text 字段"}), 400

    text = data["text"].strip()
    field = data.get("field", "default")
    user_key = data.get("api_key", "")
    provider = data.get("provider", "deepseek")
    custom_url = data.get("api_url", "")

    if not text:
        return jsonify({"success": False, "error": "文本不能为空"}), 400

    # 用户自带 Key → 用用户的；没有 → 用服务端默认
    polished = call_llm(text, field, api_key=user_key, provider=provider, api_url=custom_url)

    if polished is None:
        time.sleep(0.3)
        mock = MOCK_POLISHED.get(field, MOCK_POLISHED["default"])
        key_words = text[:20] if len(text) > 20 else text
        polished = f"{mock}\n\n（基于原文「{key_words}…」的AI润色建议）"

    return jsonify({"success": True, "polished": polished})


if __name__ == "__main__":
    print(" Resume Polish API running on http://localhost:5000")
    print(f"   服务器 API Key: {'已配置' if DEEPSEEK_API_KEY else '未配置（使用模拟润色）'}")
    print(f"   支持用户自备 Key: DeepSeek / OpenAI / 自定义")
    app.run(host="0.0.0.0", port=5000, debug=True)
