# OVH Chatbot Template

A simple example chatbot built with Next.js 15+ that demonstrates how to integrate with OVHcloud AI endpoints. This template shows how to use the AI SDK to build a basic chatbot application using OVHcloud's AI infrastructure.

## Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
- OVH account and API credentials

## Getting Started

### Installation

```bash
# Using synaigy CLI (recommended)
synaigy create my-chatbot --template ovh-chatbot

# Or clone this template directly
git clone <repository-url>
cd my-chatbot
pnpm install  # or npm install, yarn install
```

### Configuration

1. Create a `.env.local` file in the root directory:

```env
AI_ENDPOINT=Endpoint of the LLM
AI_MODEL=Model
AI_API_KEY=Api key
```

2. Configure your chat settings in `config/chat-config.ts`

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
