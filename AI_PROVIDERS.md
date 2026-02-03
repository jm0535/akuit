# AI Providers - Complete List

## 🎯 Overview

The Akuit system now supports **20 AI providers** including both commercial and open-source models from around the world.

## 📦 Commercial Providers (8)

### 1. **Z.ai**
- **Company:** Z.ai Platform
- **Models:** zai-pro, vision-pro
- **Best For:** General purpose, enterprise applications
- **API Key Format:** `zai_*` or ≥32 chars
- **Env Variable:** `ZAI_API_KEY`
- **Features:** Chat completions, Vision (OCR)

### 2. **OpenAI**
- **Company:** OpenAI
- **Models:** GPT-4, GPT-4 Turbo, GPT-3.5
- **Best For:** General purpose, coding, analysis
- **API Key Format:** `sk-`
- **Env Variable:** `OPENAI_API_KEY`
- **Features:** Chat completions, embeddings, vision

### 3. **Anthropic**
- **Company:** Anthropic
- **Models:** Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Best For:** Long context, reasoning, analysis
- **API Key Format:** `sk-ant-`
- **Env Variable:** `ANTHROPIC_API_KEY`
- **Features:** Chat completions, long context

### 4. **Google (Gemini)**
- **Company:** Google DeepMind
- **Models:** Gemini 1.5 Pro, Gemini 1.5 Flash
- **Best For:** Multimodal, reasoning, enterprise
- **API Key Format:** `AIza`, `GOAI`, or ≥32 chars
- **Env Variable:** `GOOGLE_API_KEY`
- **Features:** Chat completions, vision, coding

### 5. **Cohere**
- **Company:** Cohere
- **Models:** Command R+, Command R
- **Best For:** RAG, enterprise search
- **API Key Format:** ≥32 chars
- **Env Variable:** `COHERE_API_KEY`
- **Features:** Chat completions, embeddings, RAG

### 6. **Hugging Face**
- **Company:** Hugging Face
- **Models:** Thousands of open-source models
- **Best For:** Custom models, research, open-source
- **API Key Format:** `hf_` or ≥32 chars
- **Env Variable:** `HUGGINGFACE_API_KEY`
- **Features:** Inference API, model hosting, transformers

### 7. **Stability AI**
- **Company:** Stability AI
- **Models:** SDXL, Stable Diffusion 3
- **Best For:** Image generation, visual content
- **API Key Format:** `sk-` or ≥32 chars
- **Env Variable:** `STABILITY_API_KEY`
- **Features:** Image generation, video generation

### 8. **Replicate**
- **Company:** Replicate
- **Models:** Hosted open-source models
- **Best For:** Custom model inference, diverse AI
- **API Key Format:** `r8_` or ≥32 chars
- **Env Variable:** `REPLICATE_API_KEY`
- **Features:** Model hosting, diverse model access

## 🌐 Open-Source Providers (9) - NEW!

### 9. **Together AI**
- **Company:** Together Computer
- **Models:** Mixtral, Qwen, Llama 2, Mistral variants
- **Best For:** Open-source models, cost-effective
- **API Key Format:** ≥32 chars
- **Env Variable:** `TOGETHER_API_KEY`
- **Features:** Open-source model inference

### 10. **Mistral AI**
- **Company:** Mistral AI (France)
- **Models:** Mistral 7B, Mixtral 8x7B, Mistral Large
- **Best For:** Multilingual, efficient inference
- **API Key Format:** ≥32 chars
- **Env Variable:** `MISTRAL_API_KEY`
- **Features:** Chat completions, code generation

### 11. **xAI (Grok)**
- **Company:** xAI (Elon Musk)
- **Models:** Grok-1, Grok-2
- **Best For:** Real-time knowledge, reasoning
- **API Key Format:** `xai-` or ≥32 chars
- **Env Variable:** `XAI_API_KEY`
- **Features:** Chat completions, real-time web search

### 12. **Kimi (Moonshot AI)** 🆕
- **Company:** Moonshot AI (China)
- **Models:** Kimi-1.5, Kimi-vl, Kimi-1.5-pro
- **Best For:** Chinese market, multilingual, long context
- **API Key Format:** ≥32 chars
- **Env Variable:** `KIMI_API_KEY`
- **Features:** Chat completions, vision, long context (200K tokens)

### 13. **DeepSeek** 🆕
- **Company:** DeepSeek-AI (China)
- **Models:** DeepSeek-V2.5, DeepSeek-Coder-V2
- **Best For:** Coding, math, reasoning
- **API Key Format:** `sk-` or ≥32 chars
- **Env Variable:** `DEEPSEEK_API_KEY`
- **Features:** Chat completions, coding, 128K context

### 14. **Qwen (Alibaba Cloud)** 🆕
- **Company:** Alibaba Cloud (China)
- **Models:** Qwen2.5-72B, Qwen-VL-Max, Qwen-Math
- **Best For:** Multimodal, math, enterprise China
- **API Key Format:** `sk-` or ≥32 chars
- **Env Variable:** `QWEN_API_KEY`
- **Features:** Chat completions, vision, math, coding

### 15. **Baichuan AI** 🆕
- **Company:** Baichuan (China)
- **Models:** Baichuan4, Baichuan2-Turbo
- **Best For:** Chinese language, large models
- **API Key Format:** ≥32 chars
- **Env Variable:** `BAICHUAN_API_KEY`
- **Features:** Chat completions, Chinese NLP

### 16. **Yi (01.AI)** 🆕
- **Company:** 01.AI (China)
- **Models:** Yi-Large, Yi-34B, Yi-VL
- **Best For:** Multimodal, bilingual (Chinese/English)
- **API Key Format:** ≥32 chars
- **Env Variable:** `YI_API_KEY`
- **Features:** Chat completions, vision, bilingual support

### 17. **InternLM** 🆕
- **Company:** Shanghai AI Lab (China)
- **Models:** InternLM2.5-20B, InternVL-2.5
- **Best For:** Long context, research, open-source
- **API Key Format:** ≥32 chars
- **Env Variable:** `INTERNLM_API_KEY`
- **Features:** Chat completions, 1M context, vision

### 18. **Zhipu AI** 🆕
- **Company:** Zhipu AI (China)
- **Models:** GLM-4, GLM-4V
- **Best For:** Chinese market, enterprise applications
- **API Key Format:** ≥32 chars
- **Env Variable:** `ZHIPU_API_KEY`
- **Features:** Chat completions, vision, multimodal

## 🔧 Custom Provider

### 19. **Custom**
- **Purpose:** User-defined API endpoints
- **API Key Format:** ≥16 chars
- **Features:** Any OpenAI-compatible API endpoint
- **Use Cases:** Self-hosted models, custom deployments

---

## 🌍 Regional Distribution

### **North America**
- Z.ai (USA)
- OpenAI (USA)
- Anthropic (USA)
- Google (USA)

### **Europe**
- Cohere (Canada)
- Mistral AI (France)
- Stability AI (UK)

### **Asia-Pacific**
- Hugging Face (Global)
- Replicate (USA - hosts Asian models)
- Together AI (USA - hosts Asian models)
- Kimi (China)
- DeepSeek (China)
- Qwen (China)
- Baichuan (China)
- Yi (China)
- InternLM (China)
- Zhipu (China)
- xAI (USA)

---

## 📊 Model Categories

### **General Purpose (Chat)**
- Z.ai, OpenAI, Anthropic, Google, Cohere
- Together AI, Mistral, xAI
- Kimi, DeepSeek, Qwen, Baichuan, Yi, InternLM, Zhipu

### **Vision/Multimodal**
- Z.ai (Vision Pro), OpenAI (GPT-4V)
- Google (Gemini Pro Vision), Qwen-VL, Yi-VL, InternVL-2.5, GLM-4V

### **Code Generation**
- DeepSeek-Coder, Qwen-Math, OpenAI (GPT-4)
- Z.ai (Pro), Anthropic (Claude 3.5 Sonnet)

### **Long Context**
- Anthropic (200K tokens)
- Kimi (200K tokens)
- InternLM (1M tokens)

### **Image Generation**
- Stability AI (Stable Diffusion)
- Replicate (hosted models)

---

## 💾 Integration Details

### API Key Storage
```typescript
// All providers use the same storage
interface ApiKey {
  id: string
  name: string
  key: string
  provider: 'z-ai' | 'openai' | 'anthropic' | 'google' | 'cohere' |
             'huggingface' | 'stability' | 'replicate' | 'together' |
             'mistral' | 'xai' | 'kimi' | 'deepseek' | 'qwen' |
             'baichuan' | 'yi' | 'internlm' | 'zhipu' | 'custom'
  createdAt: string
  lastUsed?: string
  isValid?: boolean
}
```

### Environment Variables
```bash
# Commercial
ZAI_API_KEY=your_zai_key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Open-Source
TOGETHER_API_KEY=your_together_key
MISTRAL_API_KEY=your_mistral_key
XAI_API_KEY=xai-...

# Chinese Providers (NEW!)
KIMI_API_KEY=your_kimi_key
DEEPSEEK_API_KEY=sk-...
QWEN_API_KEY=sk-...
BAICHUAN_API_KEY=your_baichuan_key
YI_API_KEY=your_yi_key
INTERNLM_API_KEY=your_internlm_key
ZHIPU_API_KEY=your_zhipu_key

# Other Providers
COHERE_API_KEY=your_cohere_key
HUGGINGFACE_API_KEY=hf_...
STABILITY_API_KEY=sk-...
REPLICATE_API_KEY=r8_...
```

### Validation Rules
```typescript
validateApiKey(key: string, provider: ApiKey['provider']): boolean

// Each provider has specific validation:
- Z.ai: Starts with "zai_" or ≥32 chars
- OpenAI: Starts with "sk-"
- Anthropic: Starts with "sk-ant-"
- Kimi: ≥32 chars
- DeepSeek: Starts with "sk-" or ≥32 chars
- Qwen: Starts with "sk-" or ≥32 chars
- Chinese providers: ≥32 chars
- Custom: ≥16 chars
```

---

## 🎨 UI Integration

### Settings Page Dropdown
The provider dropdown in settings now includes ALL providers:

```
┌─────────────────────────────────────────┐
│ Select Provider: [Choose...] ▼      │
└─────────────────────────────────────────┘

Dropdown Options:
- Z.ai
- OpenAI
- Anthropic
- Google (Gemini)
- Cohere
- Hugging Face
- Stability AI
- Replicate
- Together AI
- Mistral AI
- xAI (Grok)
- Kimi (Moonshot AI)        ← NEW!
- DeepSeek                   ← NEW!
- Qwen (Alibaba Cloud)       ← NEW!
- Baichuan AI                ← NEW!
- Yi (01.AI)                ← NEW!
- InternLM AI                 ← NEW!
- Zhipu AI                  ← NEW!
- Custom
```

### Validation Messages
Each provider shows specific guidance:

```
❌ Invalid: "Kimi (Moonshot AI) API keys should be at least 32 characters"
❌ Invalid: "DeepSeek API keys should start with 'sk-' or be at least 32 characters"
❌ Invalid: "Qwen (Alibaba Cloud) API keys should start with 'sk-' or be at least 32 characters"
```

---

## 🔐 Security Features

- ✅ **AES-256 Encryption:** All keys encrypted client-side
- ✅ **Masked Display:** Only show first 4 and last 4 characters
- ✅ **No Logging:** Keys never logged or exposed in errors
- ✅ **Priority Resolution:** Env vars → Encrypted storage → Demo keys
- ✅ **Secure Storage:** localStorage with encryption

---

## 🌍 Use Cases by Provider

### **Compliance Analysis (Document Review)**
- **Best:** Z.ai, Anthropic, Qwen, Kimi
- **Why:** Strong reasoning, long context, compliance-aware

### **Vision/OCR (Scanned Documents)**
- **Best:** Z.ai (Vision Pro), Google (Gemini Vision), Qwen-VL, Yi-VL, InternVL-2.5
- **Why:** Multimodal capabilities, good OCR accuracy

### **General Document Analysis**
- **Best:** OpenAI (GPT-4), Anthropic (Claude 3.5), DeepSeek, Qwen
- **Why:** Strong understanding, structured output

### **Cost-Effective Options**
- **Best:** DeepSeek, Qwen, Together AI, Hugging Face, Replicate
- **Why:** Open-source, lower pricing, good performance

### **Enterprise/Compliance**
- **Best:** Anthropic, Cohere, Google (Gemini), Zhipu, Kimi
- **Why:** Enterprise focus, data security, compliance features

---

## 📦 Implementation Files

### Core Files
```
src/lib/api-keys.ts
├── ApiKey interface (with all 19 providers)
├── validateApiKey() (validation for all providers)
├── getEnvApiKey() (checks all env vars)
├── saveApiKey() (encrypted storage)
├── getApiKeys() (retrieval + decryption)
├── setActiveApiKey() (set active provider)
└── deleteApiKey() (remove key)
```

### UI Files
```
src/app/settings/page.tsx
├── Provider dropdown (all 19 + custom options)
├── Validation messages (provider-specific)
├── Key input with show/hide
├── Environment variables documentation
└── API key list with badges
```

---

## 🚀 Usage Examples

### Adding a Kimi API Key
```tsx
1. Go to Settings page
2. Click "Add Key" button
3. Select "Kimi (Moonshot AI)" from dropdown
4. Enter key name: "Production Kimi Key"
5. Enter API key: "sk-xxxxx..." (at least 32 chars)
6. Click "Save Key"
```

### Setting Environment Variable
```bash
# .env file
KIMI_API_KEY=your_production_kimi_key_here

# The app will automatically detect and use this key
```

---

## 📈 Comparison Summary

### **Cost Performance**
| Provider | Cost | Performance | Notes |
|----------|-------|-------------|--------|
| DeepSeek | $ | Very Good | Best value |
| Qwen | $$ | Excellent | Enterprise China |
| Kimi | $$ | Very Good | Long context |
| OpenAI | $$$ | Excellent | Industry standard |
| Anthropic | $$$ | Excellent | Best reasoning |
| Z.ai | $$$ | Excellent | Platform native |

### **Context Window**
| Provider | Context | Notes |
|----------|---------|-------|
| InternLM | 1M tokens | **Largest** |
| Kimi | 200K tokens | Very large |
| Anthropic | 200K tokens | Very large |
| DeepSeek | 128K tokens | Large |
| Qwen | 100K tokens | Large |
| Others | 32K-128K tokens | Standard |

### **Special Features**
| Provider | Vision | Coding | Multimodal | Notes |
|----------|--------|--------|-------------|-------|
| Z.ai | ✅ | ✅ | ✅ | Platform native |
| Google | ✅ | ✅ | ✅ | Gemini Pro Vision |
| Qwen-VL | ✅ | ✅ | ✅ | Strong multimodal |
| Yi-VL | ✅ | ❌ | ✅ | Bilingual vision |
| InternVL-2.5 | ✅ | ✅ | ✅ | Large vision context |
| GLM-4V | ✅ | ❌ | ✅ | Enterprise China |

---

## 🔮 Future Additions

Potential providers that could be added:
1. **Perplexity** - Open search + AI
2. **AI21 Labs (Jamba)** - Open-source research models
3. **Groq** - Fast LLaMA inference
4. **Novita AI** - Another Chinese provider
5. **01.AI** - More models from Yi creators
6. **WizardLM** - Microsoft open-source
7. **Phi (Microsoft)** - Small efficient models

---

## 📚 Documentation

- **API_KEYS.md** - Full API key management details
- **SCANNED_DOCUMENT_FEATURES.md** - Document processing features
- **README.md** - Project overview and setup

---

## ✅ Summary

**Total Providers Supported: 20**

### Commercial (8)
- Z.ai, OpenAI, Anthropic, Google, Cohere, Hugging Face, Stability AI, Replicate

### Open-Source (9) - NEW!
- Together AI, Mistral AI, xAI, Kimi, DeepSeek, Qwen, Baichuan, Yi, InternLM, Zhipu

### Custom (1)
- Custom endpoint support

### Chinese Market Providers (6) - NEW!
- Kimi (Moonshot), DeepSeek, Qwen, Baichuan, Yi, InternLM, Zhipu

### Vision/Multimodal (7)
- Z.ai, OpenAI, Google, Qwen, Yi, InternLM, Zhipu

### Long Context (3)
- InternLM (1M), Kimi (200K), Anthropic (200K)

---

**Version:** 2.0.0
**Last Updated:** 2025
**Status:** Production Ready

**All requested open-source providers have been added!** 🎉
