import { marked } from 'marked'
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
})

turndown.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: (content) => `~~${content}~~`,
})

export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) return '<p></p>'
  return marked(markdown, { async: false, gfm: true, breaks: true })
}

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim()
}
