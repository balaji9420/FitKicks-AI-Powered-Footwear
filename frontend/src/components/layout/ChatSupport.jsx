import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import api, { resolveAssetUrl } from '../../services/api'

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: 'Hi! Ask me about shoes, sizes, stock, shipping, returns, or finding a pair for your style. I answer from FitKicks catalog and store information.',
  sources: [],
  products: [],
}

export default function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [isSending, setIsSending] = useState(false)
  const messageEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, messages, isSending])

  const sendQuestion = async (event) => {
    event.preventDefault()
    const text = question.trim()
    if (text.length < 3 || isSending) return

    setQuestion('')
    setMessages((current) => [...current, { role: 'user', text }])
    setIsSending(true)
    try {
      const response = await api.post('/ai/chat', { question: text })
      const data = response.data?.data
      if (!data || typeof data.answer !== 'string') {
        throw new Error('The FitKicks assistant returned an invalid response.')
      }
      setMessages((current) => [...current, {
        role: 'assistant',
        text: data.answer,
        sources: Array.isArray(data.sources) ? data.sources : [],
        products: Array.isArray(data.products) ? data.products : [],
      }])
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        text: error.response?.data?.message || error.message || 'The assistant could not answer right now. Please try again.',
        sources: [],
        products: [],
      }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {isOpen && (
        <section
          aria-label="FitKicks support assistant"
          className="mb-3 flex h-[min(36rem,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl shadow-black/50"
        >
          <header className="flex items-center justify-between border-b border-white/10 bg-dark-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles size={17} />
              </span>
              <div>
                <h2 className="text-sm font-semibold">FitKicks assistant</h2>
                <p className="text-[11px] text-gray-500">Grounded in the store catalog · no paid AI API</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
              aria-label="Close assistant"
            >
              <X size={17} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-primary text-white'
                    : 'rounded-bl-md border border-white/5 bg-dark-200 text-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.products?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2 transition hover:border-primary/50"
                        >
                          {product.image ? (
                            <img
                              src={resolveAssetUrl(product.image)}
                              alt=""
                              className="h-12 w-12 rounded-lg bg-dark-300 object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-dark-300">👟</span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-xs text-gray-400">{product.brand}</span>
                            <span className="block truncate text-sm font-medium text-white">{product.name}</span>
                            <span className="text-xs text-primary">₹{Number(product.price).toLocaleString('en-IN')}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.sources?.length > 0 && (
                    <details className="mt-3 border-t border-white/10 pt-2 text-xs text-gray-400">
                      <summary className="cursor-pointer hover:text-white">Sources used ({message.sources.length})</summary>
                      <ul className="mt-2 space-y-2">
                        {message.sources.map((source, sourceIndex) => (
                          <li key={`${source.title}-${sourceIndex}`}>
                            <span className="font-medium text-gray-300">{source.title}</span>
                            <span className="mt-0.5 block">{source.excerpt}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-gray-400" role="status">
                <Loader2 size={14} className="animate-spin text-primary" />
                Searching FitKicks information…
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          <form onSubmit={sendQuestion} className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={500}
                minLength={3}
                placeholder="Ask about shoes or store info…"
                aria-label="Ask the FitKicks assistant"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-dark-200 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={isSending || question.trim().length < 3}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-600">Answers use retrieved catalog and store information.</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 transition hover:scale-105 hover:bg-primary-600"
        aria-label={isOpen ? 'Close FitKicks assistant' : 'Open FitKicks assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
