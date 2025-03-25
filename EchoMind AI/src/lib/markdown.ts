import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

export function renderMarkdown(text: string): string {
  // Replace LaTeX expressions
  text = text.replace(/\$\$(.*?)\$\$/g, '<TeX>$1</TeX>');
  text = text.replace(/\$(.*?)\$/g, '<TeX>$1</TeX>');
  
  return marked(text);
}

export function processMessageContent(content: string): string {
  // Check if content contains code blocks
  if (content.includes('```')) {
    return renderMarkdown(content);
  }
  
  // Check if content contains LaTeX
  if (content.includes('$')) {
    return renderMarkdown(content);
  }
  
  return content;
}