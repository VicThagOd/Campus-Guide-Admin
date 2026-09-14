import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshIcon, CheckmarkCircle02Icon, Cancel01Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

interface Question {
  id: string
  user_id: string | null
  name: string | null
  email: string | null
  category: string
  question: string
  status: string
  answer: string | null
  created_at: string
}

export default function AskQuestionsSection() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('ask_questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setQuestions(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleAnswer = async (id: string) => {
    if (!answerText.trim()) return
    setSubmitting(true)
    const { error } = await supabase
      .from('ask_questions')
      .update({ answer: answerText.trim(), status: 'answered' })
      .eq('id', id)

    if (!error) {
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answer: answerText.trim(), status: 'answered' } : q))
      setAnsweringId(null)
      setAnswerText('')
    }
    setSubmitting(false)
  }

  const handleClose = async (id: string) => {
    await supabase.from('ask_questions').update({ status: 'closed' }).eq('id', id)
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, status: 'closed' } : q))
  }

  const openCount = questions.filter((q) => q.status === 'open').length
  const answeredCount = questions.filter((q) => q.status === 'answered').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Student Questions
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            {openCount} open · {answeredCount} answered · {questions.length} total
          </p>
        </div>
        <button
          onClick={fetchQuestions}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
          style={{ borderColor: BORDER, color: INK }}
        >
          <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>No questions submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border bg-white p-5"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: q.status === 'open' ? '#FEF6E4' : q.status === 'answered' ? '#DCFCE7' : '#F3F4F6',
                        color: q.status === 'open' ? '#B7791F' : q.status === 'answered' ? '#16A34A' : MUTED,
                      }}
                    >
                      {q.status}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                      {q.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium" style={{ color: INK }}>
                    {q.question}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: MUTED }}>
                    {q.name && <span>{q.name}</span>}
                    {q.email && <span>{q.email}</span>}
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {q.status === 'open' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setAnsweringId(q.id); setAnswerText(''); }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-50"
                      style={{ color: PRIMARY }}
                    >
                      Answer
                    </button>
                    <button
                      onClick={() => handleClose(q.id)}
                      className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                      title="Close"
                    >
                      <Cancel01Icon size={14} />
                    </button>
                  </div>
                )}
              </div>

              {q.answer && (
                <div className="mt-3 rounded-lg border p-3" style={{ borderColor: '#D1D9F0', backgroundColor: '#F9FAFB' }}>
                  <p className="text-[11px] font-semibold" style={{ color: PRIMARY }}>ANSWER</p>
                  <p className="mt-1 text-sm" style={{ color: INK }}>{q.answer}</p>
                </div>
              )}

              {answeringId === q.id && (
                <div className="mt-4 space-y-2">
                  <textarea
                    rows={3}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAnsweringId(null)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                      style={{ borderColor: BORDER, color: INK }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAnswer(q.id)}
                      disabled={submitting || !answerText.trim()}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      <CheckmarkCircle02Icon size={12} />
                      {submitting ? 'Sending...' : 'Send Answer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
