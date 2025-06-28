import React from 'react'
import { motion } from 'framer-motion'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    // Split by lines to handle different elements
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let currentIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip empty lines
      if (!line.trim()) {
        elements.push(<br key={`br-${currentIndex++}`} />)
        continue
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${currentIndex++}`} className="text-lg font-semibold mt-4 mb-2 text-primary-400">
            {line.substring(4)}
          </h3>
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${currentIndex++}`} className="text-xl font-semibold mt-6 mb-3 text-primary-300">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${currentIndex++}`} className="text-2xl font-bold mt-6 mb-4 text-primary-200">
            {line.substring(2)}
          </h1>
        )
      }
      // Code blocks
      else if (line.startsWith('```')) {
        const language = line.substring(3).trim()
        const codeLines = []
        i++ // Move to next line
        
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        
        elements.push(
          <div key={`code-${currentIndex++}`} className="my-4">
            <div className="bg-dark-800 rounded-lg overflow-hidden">
              {language && (
                <div className="bg-dark-700 px-4 py-2 text-sm text-dark-300 border-b border-dark-600">
                  {language}
                </div>
              )}
              <pre className="p-4 overflow-x-auto">
                <code className="text-green-400 text-sm font-mono">
                  {codeLines.join('\n')}
                </code>
              </pre>
            </div>
          </div>
        )
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${currentIndex++}`} className="border-l-4 border-primary-500 pl-4 my-3 bg-primary-500/10 py-2 rounded-r">
            <p className="text-primary-200 italic">{line.substring(2)}</p>
          </blockquote>
        )
      }
      // Bullet points
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        const listItems = [line]
        i++
        
        // Collect consecutive list items
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
          listItems.push(lines[i])
          i++
        }
        i-- // Step back one since the loop will increment
        
        elements.push(
          <ul key={`ul-${currentIndex++}`} className="list-disc list-inside my-3 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-dark-200">
                {formatInlineElements(item.substring(2))}
              </li>
            ))}
          </ul>
        )
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const listItems = [line]
        i++
        
        // Collect consecutive numbered items
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          listItems.push(lines[i])
          i++
        }
        i-- // Step back one since the loop will increment
        
        elements.push(
          <ol key={`ol-${currentIndex++}`} className="list-decimal list-inside my-3 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-dark-200">
                {formatInlineElements(item.replace(/^\d+\.\s/, ''))}
              </li>
            ))}
          </ol>
        )
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={`p-${currentIndex++}`} className="text-dark-200 leading-relaxed my-2">
            {formatInlineElements(line)}
          </p>
        )
      }
    }

    return elements
  }

  // Format inline elements like bold, italic, code, math
  const formatInlineElements = (text: string) => {
    const parts = []
    let currentText = text
    let key = 0

    // Process inline code first (to avoid conflicts with other formatting)
    const codeRegex = /`([^`]+)`/g
    const codeParts = []
    let lastIndex = 0
    let match

    while ((match = codeRegex.exec(currentText)) !== null) {
      if (match.index > lastIndex) {
        codeParts.push({ type: 'text', content: currentText.slice(lastIndex, match.index) })
      }
      codeParts.push({ type: 'code', content: match[1] })
      lastIndex = match.index + match[0].length
    }
    
    if (lastIndex < currentText.length) {
      codeParts.push({ type: 'text', content: currentText.slice(lastIndex) })
    }

    // Process each part for other formatting
    codeParts.forEach((part, partIndex) => {
      if (part.type === 'code') {
        parts.push(
          <code key={`code-${key++}`} className="bg-dark-700 px-2 py-1 rounded text-green-400 font-mono text-sm">
            {part.content}
          </code>
        )
      } else {
        // Process bold, italic, and math in text parts
        let textContent = part.content
        const elements = []
        let textKey = 0

        // Math expressions (simple LaTeX-style)
        textContent = textContent.replace(/\$([^$]+)\$/g, (match, formula) => {
          elements.push(
            <span key={`math-${textKey++}`} className="bg-blue-900/30 px-2 py-1 rounded text-blue-300 font-mono">
              {formula}
            </span>
          )
          return `__MATH_${elements.length - 1}__`
        })

        // Bold text
        textContent = textContent.replace(/\*\*([^*]+)\*\*/g, (match, boldText) => {
          elements.push(
            <strong key={`bold-${textKey++}`} className="font-semibold text-white">
              {boldText}
            </strong>
          )
          return `__BOLD_${elements.length - 1}__`
        })

        // Italic text
        textContent = textContent.replace(/\*([^*]+)\*/g, (match, italicText) => {
          elements.push(
            <em key={`italic-${textKey++}`} className="italic text-primary-300">
              {italicText}
            </em>
          )
          return `__ITALIC_${elements.length - 1}__`
        })

        // Split by placeholders and reconstruct
        const finalParts = textContent.split(/(__(?:MATH|BOLD|ITALIC)_\d+__)/)
        finalParts.forEach((finalPart, finalIndex) => {
          if (finalPart.startsWith('__MATH_')) {
            const index = parseInt(finalPart.match(/__MATH_(\d+)__/)?.[1] || '0')
            parts.push(elements[index])
          } else if (finalPart.startsWith('__BOLD_')) {
            const index = parseInt(finalPart.match(/__BOLD_(\d+)__/)?.[1] || '0')
            parts.push(elements[index])
          } else if (finalPart.startsWith('__ITALIC_')) {
            const index = parseInt(finalPart.match(/__ITALIC_(\d+)__/)?.[1] || '0')
            parts.push(elements[index])
          } else if (finalPart) {
            parts.push(finalPart)
          }
        })
      }
    })

    return parts.length > 0 ? parts : text
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`prose prose-invert max-w-none ${className}`}
    >
      {parseMarkdown(content)}
    </motion.div>
  )
}