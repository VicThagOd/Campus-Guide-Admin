import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckmarkCircle02Icon, Clock01Icon, Message02Icon, Delete02Icon, RefreshIcon, Cancel01Icon } from 'hugeicons-react'

const PRIMARY = '#2F4EA2'
const INK = '#111827'
const MUTED = '#6B7280'
const BORDER = '#BFC3C6'

export interface AskQuestionItem {
  id: string
  user_id: string | null
  name: string | null
  email: string | null
  category: string | null
  question: string
  status: 'open' | 'answered' | string
  answer: string | null
  created_at: string
}

export default function AskQuestionsSection() {
  const [questions, setQuestions] = useState<AskQuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'answered'>('open')

  // Answer modal
  const [selectedQuestion, setSelectedQuestion] = useState<AskQuestionItem | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)

    // Fetch open first, then answered, ordered by created_at desc
    const { data, error } = await supabase
      .from('ask_questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching questions:', error)
      setError(error.message)
    } else {
      // Sort in memory: 'open' first, then 'answered'
      const sorted = (data || []).sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1
        if (a.status !== 'open' && b.status === 'open') return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setQuestions(sorted)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  const openAnswerModal = (item: AskQuestionItem) => {
    setSelectedQuestion(item)
    setAnswerText(item.answer || '')
  }

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion || !answerText.trim()) return

    setSubmitting(true)
    const { error } = await supabase
      .from('ask_questions')
      .update({
        answer: answerText.trim(),
        status: 'answered',
      })
      .eq('id', selectedQuestion.id)

    if (error) {
      alert(`Failed to save answer: ${error.message}`)
    } else {
      setSelectedQuestion(null)
      fetchQuestions()
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return

    const { error } = await supabase
      .from('ask_questions')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Failed to delete: ${error.message}`)
    } else {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    }
  }

  const openCount = questions.filter((q) => q.status === 'open').length
  const answeredCount = questions.filter((q) => q.status === 'answered').length

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === 'open') return q.status === 'open'
    if (activeTab === 'answered') return q.status === 'answered'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
            Ask Campus Guide Moderation
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Review student inquiries and submit official answers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchQuestions}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
            style={{ borderColor: BORDER, color: INK }}
          >
            <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* Metric Cards & Filter Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4" style={{ borderColor: BORDER }}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('open')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'open'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab !== 'open' ? { borderColor: BORDER } : {}}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setActiveTab('answered')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'answered'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab !== 'answered' ? { borderColor: BORDER } : {}}
          >
            Answered ({answeredCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab !== 'all' ? { borderColor: BORDER } : {}}
          >
            All Questions ({questions.length})
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
          Loading questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
          <p style={{ color: MUTED }}>
            {activeTab === 'open' ? 'No open questions right now!' : 'No questions match the filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQuestions.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-start ${
                item.status === 'open' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
              }`}
              style={{ borderColor: BORDER }}
            >
              <div className="space-y-3 flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {item.status === 'open' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800">
                      <Clock01Icon size={12} />
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                      <CheckmarkCircle02Icon size={12} />
                      Answered
                    </span>
                  )}

                  {item.category && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 uppercase">
                      {item.category}
                    </span>
                  )}

                  <span className="text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {item.name || 'Anonymous Student'} {item.email ? `<${item.email}>` : ''}
                  </div>
                  <p className="mt-1 text-base font-medium text-slate-900">
                    "{item.question}"
                  </p>
                </div>

                {item.answer && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm border text-slate-800" style={{ borderColor: BORDER }}>
                    <div className="font-semibold text-sky-900 mb-0.5">Campus Guide Answer:</div>
                    <p className="leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t pt-3 sm:mt-0 sm:border-t-0 sm:pt-0 shrink-0">
                <button
                  onClick={() => openAnswerModal(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Message02Icon size={14} />
                  {item.answer ? 'Edit Answer' : 'Answer Question'}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  title="Delete Question"
                >
                  <Delete02Icon size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: INK }}>
                Answer Question
              </h3>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="rounded-lg p-1 transition-colors hover:bg-slate-100"
                style={{ color: MUTED }}
              >
                <Cancel01Icon size={20} />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-4 border" style={{ borderColor: BORDER }}>
              <p className="text-xs font-medium text-slate-500">Student Question ({selectedQuestion.name || 'Anonymous'}):</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">"{selectedQuestion.question}"</p>
            </div>

            <form onSubmit={handleSaveAnswer} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: INK }}>
                  Your Official Answer *
                </label>
                <textarea
                  rows={5}
                  required
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type clear, helpful answer for the student..."
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: BORDER }}>
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(null)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                  style={{ borderColor: BORDER, color: INK }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Message02Icon size={16} />
                  {submitting ? 'Saving...' : 'Submit Answer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
