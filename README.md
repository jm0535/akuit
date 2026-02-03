# 📋 Akuit - Acquittal Review & Reporting System

<div align="center">

![Akuit Logo](public/logo.svg)

**Premium enterprise-grade acquittal review and reporting system powered by AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

</div>

---

## ✨ About Akuit

Akuit is an open-source, AI-powered acquittal review and reporting system designed for organizations that need to audit receipts, invoices, and financial documents for compliance and accuracy. With advanced AI capabilities, Akuit automatically detects issues, recommends fixes, and generates comprehensive reports following premium enterprise standards.

### 🎯 Key Features

- **🔍 AI-Powered Document Analysis**: Automatically analyze receipts, invoices, and financial documents using computer vision
- **⚠️ Issue Detection**: Identify compliance issues, missing information, and irregularities
- **💡 Smart Recommendations**: Get actionable recommendations to fix detected issues
- **📊 Comprehensive Reports**: Generate detailed reports with confidence scores and severity levels
- **🎨 Beautiful UI**: Modern, responsive interface with dark/light mode
- **🔒 Secure API Key Management**: AES-256 encrypted storage for your API keys
- **🌓 Theme Support**: Light, dark, and system theme options
- **📱 Mobile-First Design**: Fully responsive for all devices

---

## 🏗 Technology Stack

### Core Framework

- **⚡ Next.js 16** - React framework with App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling
- **🧩 shadcn/ui** - High-quality accessible components

### AI & Vision

- **👁️ z-ai-web-dev-sdk** - Vision and language model integration
- **🤖 Computer Vision** - Document text extraction and analysis
- **🧠 AI Analysis** - Issue detection and recommendation generation

### Backend & Data

- **🗄️ Prisma** - Type-safe database ORM
- **🔐 SQLite** - Embedded database for easy deployment
- **🔒 Crypto-JS** - AES-256 encryption for API keys

### UI/UX

- **🎭 Framer Motion** - Smooth animations
- **🌓 next-themes** - Theme management
- **🎨 Lucide Icons** - Beautiful icon library
- **🔔 Sonner** - Toast notifications

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **npm**, **yarn**, or **bun** package manager
- API key from [Z.ai](https://z-ai.com) or compatible provider

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/akuit.git
cd akuit

# Install dependencies
bun install

# Copy environment variables template
cp .env.example .env

# Edit .env and add your API key
# Get your API key from: https://z-ai.com/developers
```

### Configuration

Edit the `.env` file with your API keys:

```bash
# Required: Z.ai API Key
ZAI_API_KEY=your_zai_api_key_here

# Optional: Custom API endpoint
ZAI_API_ENDPOINT=https://api.z-ai.com

# Optional: Encryption key for client-side storage
ENCRYPTION_KEY=your_random_encryption_key
```

### Running the Application

```bash
# Development server with hot reload
bun run dev

# Build for production
bun run build

# Start production server
bun start

# Run linter
bun run lint
```

Visit [http://localhost:3000](http://localhost:3000) to access Akuit.

---

## 🔑 API Key Management

Akuit provides multiple ways to manage API keys for different deployment scenarios:

### Priority Order

1. **Environment Variables** (Production/Self-hosted)
2. **Encrypted Local Storage** (Client-side, user-provided)
3. **Demo Keys** (Limited functionality, testing only)

### For Production Deployment

Set API keys in your environment:

```bash
# .env file
ZAI_API_KEY=sk-your-production-key-here
```

Or in your deployment platform:

- **Vercel**: Environment Variables settings
- **Docker**: Environment variables in docker-compose.yml
- **Kubernetes**: ConfigMap or Secret
- **Railway**: Environment variables tab
- **Render**: Environment variables section

### For End Users (Client-Side)

Users can add their own API keys through the Settings page:

1. Navigate to **Settings** from the dashboard
2. Click **Add Key**
3. Enter your API key name and key
4. Select your provider (Z.ai, OpenAI, Anthropic, Custom)
5. Click **Save Key**

**Security Features:**
- Keys are encrypted using AES-256 before storage
- Keys are masked in the UI (shows only first 4 and last 4 characters)
- Keys are never logged or exposed in error messages
- Multiple keys supported with active key selection

### Key Validation

Akuit validates API keys before saving:

| Provider | Format Validation |
|----------|-----------------|
| Z.ai | Starts with `zai_` or ≥32 characters |
| OpenAI | Starts with `sk-` |
| Anthropic | Starts with `sk-ant-` |
| Custom | ≥16 characters |

---

## 📖 Usage Guide

### Analyzing Documents

1. **Upload Documents**
   - Drag and drop files onto the upload area
   - Or click to browse (supports images and PDFs)

2. **Start Analysis**
   - Click "Analyze Documents" button
   - Wait for AI processing (shows progress)

3. **Review Results**
   - View detected issues categorized by severity
   - Read AI-generated recommendations
   - Check confidence scores for each issue

### Managing Reports

1. **Access Reports Tab**
   - View all analyzed reports
   - See issue counts and status
   - Click to view detailed analysis

2. **Export Reports**
   - Click "Export" to download report data
   - Future: PDF and Excel export

### Settings & Configuration

1. **API Keys**
   - Add/remove API keys
   - Switch between providers
   - View key usage and validity

2. **Appearance**
   - Switch between light/dark theme
   - Use system preference
   - Theme persists across sessions

---

## 🐳 Deployment

### Docker Deployment

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "start"]
```

```bash
# Build and run with Docker
docker build -t akuit .
docker run -p 3000:3000 -e ZAI_API_KEY=your_key_here akuit
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# ZAI_API_KEY=your_production_key
```

### Railway Deployment

1. Fork and push this repository to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Set `ZAI_API_KEY` as environment variable
5. Deploy!

---

## 🔒 Security Considerations

### API Key Security

- ✅ Never commit `.env` file to version control
- ✅ Add `.env` to `.gitignore`
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys regularly (every 90 days recommended)
- ✅ Monitor API usage for anomalies
- ✅ Revoke compromised keys immediately

### Data Privacy

- ✅ Client-side encryption for stored keys
- ✅ No data retention on public instances
- ✅ Clear privacy policy in settings
- ✅ User control over data deletion

### Best Practices

```bash
# .gitignore (always include these)
.env
.env.local
.env.*.local
uploads/
db/*.db
db/*.db-journal
```

---

## 🏛 Development

### Project Structure

```
akuit/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   └── akuit/        # Akuit-specific endpoints
│   │   ├── settings/          # Settings page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Dashboard
│   │   └── globals.css        # Global styles
│   ├── components/             # React components
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utilities
│       ├── api-keys.ts        # API key management
│       ├── theme-provider.tsx  # Theme context
│       ├── db.ts              # Prisma client
│       └── utils.ts          # Helper functions
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static assets
├── .env.example               # Environment template
└── README.md                 # This file
```

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma` then run `bun run db:push`
2. **New API Route**: Add to `src/app/api/` following Next.js conventions
3. **New Page**: Add to `src/app/` for new routes
4. **New Component**: Add to `src/components/` or `src/components/ui/`

### Code Quality

```bash
# Run linter
bun run lint

# Format code (if using Prettier)
bun run format

# Type check
bun run type-check
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests and linting
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to branch: `git push origin feature/your-feature`
7. Open a Pull Request

### Development Guidelines

- Write clear, descriptive commit messages
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to learn and build something great together.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### What You Can Do

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ✅ Sublicensing

### What You Must Do

- ⚠️ Include the license and copyright notice
- ⚠️ State significant changes to the software

---

## 🗺 Roadmap

### v1.0 (Current)
- [x] Core document analysis
- [x] Issue detection and recommendations
- [x] API key management
- [x] Dark/light theme
- [x] Settings page
- [x] PDF export
- [x] Excel/CSV export
- [x] Document preview

### v1.5 (Planned)
- [ ] User authentication
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Custom compliance rules
- [ ] Cloud storage integrations
- [ ] Mobile PWA

### v2.0 (Future)
- [ ] Team workspaces
- [ ] Collaboration features
- [ ] Workflow management
- [ ] API for third-party integrations
- [ ] White-label support

---

## 📞 Support & Community

- 📧 **Documentation**: See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed research
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Join discussions on GitHub
- 📧 **Email**: support@akuit.io (if applicable)

---

## 🙏 Acknowledgments

- Built with [Z.ai](https://chat.z.ai) AI development platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
- Fonts from [Vercel](https://vercel.com/font)

---

## 📊 Project Status

![Release](https://img.shields.io/badge/release-v1.0--blue)
![Activity](https://img.shields.io/github/last-commit/your-username/akuit)
![Stars](https://img.shields.io/github/stars/your-username/akuit?style=social)

---

<div align="center">

**Built with ❤️ for the open-source community**

[⬆ Back to Top](#-akuit---acquittal-review--reporting-system)

</div>
