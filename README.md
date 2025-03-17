# Civis - Non-Profit Management Platform

A modern web application for non-profit organizations to manage donors, track engagement, and leverage AI-powered insights.

## Features

- 🔐 Secure authentication with Supabase
- 📊 Analytics dashboard with real-time insights
- 🤖 AI-powered donor engagement analysis
- 💰 Donor management and tracking
- 📈 Project management and impact tracking
- 💬 Interactive AI chat for insights

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- LangChain
- Anthropic Claude AI

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/civis.git
cd civis
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
civis/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── dashboard/         # Dashboard pages
│   └── lib/              # Utility functions and services
├── public/               # Static assets
└── supabase/            # Supabase migrations and types
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
