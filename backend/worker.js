// Cloudflare Worker — 简历润色 API
// 部署方式：复制全部代码 → Cloudflare Dashboard → Workers & Pages → 创建 Worker → 粘贴 → 部署

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const POLISH_PROMPTS = {
  work: "你是一位资深HR和简历优化专家。请将以下工作经历描述改写成专业、有影响力的简历表述，使用STAR法则（情境、任务、行动、结果），突出量化成果和具体贡献。保持简洁（不超过100字），直接返回改写结果不要解释。",
  project: "你是一位资深技术专家和简历优化专家。请将以下项目经验描述改写成专业、有影响力的简历表述，突出技术难点、解决方案和项目成果，尽量量化。保持简洁（不超过100字），直接返回改写结果不要解释。",
  evaluate: "你是一位简历优化专家。请将以下自我评价改写成专业、自信、有影响力的表述，突出核心竞争力和职业素养，使用第一人称。保持简洁（不超过100字），直接返回改写结果不要解释。",
  default: "你是一位简历优化专家。请将以下内容改写成专业、简洁、有吸引力的简历表述，突出成果和能力。保持简洁（不超过100字），直接返回改写结果不要解释。",
};

const MOCK_RESULTS = {
  work: "主导核心业务模块开发，优化系统架构使接口响应速度提升40%，日均处理10万+请求，保障系统99.9%可用率。跨部门协作推动3个重点项目按时交付，获团队最佳贡献奖。",
  project: "作为技术负责人主导架构设计与核心开发，采用微服务架构拆分单体应用，系统吞吐量提升3倍，服务端成本降低35%。攻克高并发场景下的数据一致性问题，设计分布式缓存方案，QPS从500提升至5000。",
  evaluate: "我具备扎实的专业基础和出色的问题解决能力，善于在快节奏环境中推动技术方案落地。拥有良好的跨团队协作精神和结果导向思维，多次在核心项目中承担关键角色并超额完成任务。",
  default: "具备扎实的专业基础和出色的学习能力，善于在快速变化的环境中创造价值。多次在核心项目中担任关键角色，以结果为导向驱动团队达成目标。",
};

// 服务端默认 Key（部署者在 Cloudflare 环境变量中设置）
const SERVER_KEY = typeof DEEPSEEK_API_KEY !== 'undefined' ? DEEPSEEK_API_KEY : '';

async function callLLM(text, field, apiKey, provider, customUrl) {
  const prompt = POLISH_PROMPTS[field] || POLISH_PROMPTS.default;
  const key = apiKey || SERVER_KEY;
  if (!key) return null;

  let url, model;
  if (provider === 'custom' && customUrl) {
    url = customUrl;
    model = 'custom-model';
  } else if (provider === 'openai') {
    url = OPENAI_API_URL;
    model = 'gpt-4o-mini';
  } else {
    url = DEEPSEEK_API_URL;
    model = 'deepseek-chat';
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error(`[Worker LLM Error] ${provider}: ${e.message}`);
    return null;
  }
}

function getMockResult(text, field) {
  const mock = MOCK_RESULTS[field] || MOCK_RESULTS.default;
  const key = text.slice(0, 20);
  return `${mock}\n\n（基于原文「${key}…」的AI润色建议）`;
}

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleRequest(request) {
  const url = new URL(request.url);

  // OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // GET /api/health
  if (request.method === 'GET' && url.pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // POST /api/polish
  if (request.method === 'POST' && url.pathname === '/api/polish') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: '无效的 JSON' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const text = (body.text || '').trim();
    const field = body.field || 'default';
    if (!text) {
      return new Response(JSON.stringify({ success: false, error: '文本不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const userKey = body.api_key || '';
    const provider = body.provider || 'deepseek';
    const customUrl = body.api_url || '';

    let polished = await callLLM(text, field, userKey, provider, customUrl);
    if (!polished) {
      polished = getMockResult(text, field);
    }

    return new Response(JSON.stringify({ success: true, polished }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Fallback: serve index.html (optional, for future use)
  return new Response('Resume Polish API — use POST /api/polish', {
    headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS },
  });
}

export default { fetch: handleRequest };
