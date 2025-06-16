# Jacob J. Choi - Personal Portfolio

> **"Melos contra Mundum"** - A modern, tech-inspired portfolio showcasing AI engineering and entrepreneurial ventures.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.18.1-pink?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🚀 Live Demo

**[View Portfolio →]([https://jacob-choi.dev](https://www.jacobchoi.xyz/))** *(https://www.jacobchoi.xyz/)*

---

## ⚡ Features

### 🎨 **Design System**
- **Professional CSS Architecture** - Custom design tokens, component library, and utility classes
- **Responsive Design** - Optimized for all devices and screen sizes
- **Modern Aesthetics** - Tech-inspired UI with glassmorphism and subtle animations

### 🎭 **Interactive Elements**
- **Custom Tech Cursor** - SVG-based crosshair cursor with instant response
- **Glitch Text Effects** - Dynamic text animations for social links
- **Smooth Reveal Animation** - Character-by-character name reveal
- **Floating Grid Lines** - Subtle animated background elements

### 🏗️ **Architecture**
- **Component-Based Structure** - Reusable, maintainable React components
- **TypeScript Integration** - Full type safety and developer experience
- **Clean File Organization** - Professional folder structure with barrel exports
- **Performance Optimized** - Fast loading with efficient animations

### 🎯 **Content Highlights**
- **AI Engineering Experience** - Showcasing work at Microsoft Research, USC ICT
- **Entrepreneurial Ventures** - TuneTales AI platform and other projects
- **Technical Projects** - HarmonyRestorer, Turing Test experiments
- **Professional Background** - Investment analysis, legal internships, musical achievements

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 15.3.3 with App Router |
| **Language** | TypeScript 5.7.3 |
| **Styling** | Tailwind CSS 3.4.17 + Custom CSS |
| **Animations** | Framer Motion 12.18.1 |
| **Fonts** | Inter, Space Grotesk, JetBrains Mono |
| **Build Tool** | Next.js built-in bundler |
| **Deployment** | Vercel (recommended) |

---

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/jacob7choi-xyz/jacob-choi-website.git

# Navigate to project directory
cd jacob-choi-website

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles & design system
├── assets/                # Static assets
│   └── cursor.svg         # Custom cursor graphics
├── components/            # Reusable components
│   ├── Global/           # Shared components
│   │   ├── Cursor.tsx    # Custom cursor implementation
│   │   └── GlitchText.tsx # Text animation effects
│   └── Home/             # Page-specific components
│       └── Header.tsx    # Header section
└── constants/            # Configuration & data
    ├── animations.ts     # Animation presets
    ├── experience.ts     # Professional experience data
    ├── socials.ts        # Personal information & links
    └── index.ts          # Barrel exports
```

---

## 🎨 Design System

### Color Palette
```css
/* Primary Tech Colors */
--primary-cyan: #00E5FF
--primary-blue: #0084FF
--accent-green: #00FF88

/* Dark Theme */
--bg-primary: #0A0A0A
--bg-secondary: #111111
--text-primary: #FFFFFF
--text-secondary: #B3B3B3
```

### Typography Scale
- **Headings**: Space Grotesk (Geometric sans-serif)
- **Body Text**: Inter (Clean, readable)
- **Code/Tech**: JetBrains Mono (Developer-focused)

### Component Classes
```css
.card-glass        /* Glassmorphism cards */
.btn-primary       /* Primary CTA buttons */
.text-tech         /* Tech accent color */
.animate-glow      /* Subtle glow animations */
```

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Deploy automatically on every push

### Manual Deployment
```bash
npm run build
# Upload 'dist' folder to your hosting provider
```

### Environment Variables
No environment variables required for basic functionality.

---

## 🔧 Customization

### Updating Content
- **Personal Info**: Edit `src/constants/socials.ts`
- **Experience**: Modify `src/constants/experience.ts`
- **Animations**: Adjust `src/constants/animations.ts`

### Styling Changes
- **Colors**: Update CSS custom properties in `globals.css`
- **Fonts**: Modify font imports and utility classes
- **Components**: Customize in respective component files

### Adding Features
- **New Sections**: Create components in `src/components/Home/`
- **New Pages**: Add to `src/app/` directory
- **New Animations**: Extend `src/constants/animations.ts`

---

## 🎯 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- **Bundle Size**: Optimized with tree shaking
- **Animation Performance**: 60fps with hardware acceleration
- **Loading Speed**: < 2s initial load

---

## 🤝 Contributing

While this is a personal portfolio, feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Design Inspiration**: Modern tech portfolios and developer communities
- **Animation Concepts**: Framer Motion documentation and community examples
- **Technical Architecture**: Next.js best practices and TypeScript patterns

---

## 📞 Contact

**Jacob J. Choi**
- **Email**: [jchoi26@colby.edu](mailto:jchoi26@colby.edu)
- **LinkedIn**: [jacobjchoi](https://www.linkedin.com/in/jacobjchoi/)
- **GitHub**: [jacob7choi-xyz](https://github.com/jacob7choi-xyz)
- **Website**: [jacob-choi.dev]([https://jacob-choi.dev](https://www.jacobchoi.xyz/))

---

<div align="center">

**Built with ❤️ by Jacob J. Choi**

*"Melos contra Mundum"*

</div>
