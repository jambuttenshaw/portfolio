# Portfolio Website

A modern portfolio website built with Eleventy and Nunjucks, featuring Markdown content.

## Features

- **Static Site Generation**: Built with Eleventy (11ty) for fast, secure static sites
- **Nunjucks Templating**: Flexible templating system for reusable layouts
- **Markdown Content**: Write your content in easy-to-use Markdown
- **Responsive Design**: Mobile-friendly CSS styling
- **Clean Architecture**: Organized folder structure for maintainability

## Project Structure

```
portfolio/
├── _includes/          # Reusable template parts
├── _layouts/           # Page layouts (base.njk)
├── _site/             # Generated static site (don't edit)
├── css/               # Stylesheets
├── js/                # JavaScript files
├── projects/          # Individual project markdown files
├── index.njk          # Home page (auto-lists projects)
├── about.md           # About page
├── projects.njk       # Projects overview page
├── contact.md         # Contact page
├── .eleventy.js       # Eleventy configuration
└── package.json       # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server with live reload:
```bash
npm run dev
```

This will start a local server at `http://localhost:8080` and watch for file changes.

### Building

Build the static site for production:
```bash
npm run build
```

The generated site will be in the `_site/` directory.

### Serving

Serve the built site locally:
```bash
npm start
```

## Customization

### Site Configuration

Edit the front matter in your Markdown files or modify the `.eleventy.js` config to change:

- Site title and author
- Template engines
- Input/output directories
- Passthrough copies

### Styling

Modify `css/style.css` to customize the appearance of your portfolio.

### Adding New Pages

1. Create a new `.md` file in the root directory
2. Add front matter at the top:
   ```yaml
   ---
   layout: base.njk
   title: Your Page Title
   ---
   ```
3. Write your content in Markdown below the front matter

### Adding New Projects

Create a new `.md` file in the `projects/` folder with the following front matter:

```yaml
---
layout: base.njk
title: Your Project Title
description: Brief project description
technologies: Tech1, Tech2, Tech3
github: https://github.com/username/project-repo
demo: https://project-demo.com
image: /images/project-name.png
featured: true
---
```

The `image` field should point to a preview image in the `images/` folder. The project will automatically appear in the table on both the homepage and projects page.

### Layouts

Edit `_layouts/base.njk` to modify the overall page structure and navigation.

## Deployment

The `_site/` directory contains your static site ready for deployment. You can deploy to:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## Technologies Used

- [Eleventy](https://www.11ty.dev/) - Static site generator
- [Nunjucks](https://mozilla.github.io/nunjucks/) - Templating engine
- [Markdown](https://daringfireball.net/projects/markdown/) - Content format
