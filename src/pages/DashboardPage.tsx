import { useState } from "react"
import { supabase } from "../lib/supabase"
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  GraduationScrollIcon,
  House01Icon,
  Logout01Icon,
  Mail01Icon,
  Notification03Icon,
  QuestionIcon,
  UserGroupIcon,
  Wallet01Icon,
} from "hugeicons-react"
import UpdatesSection from "../components/UpdatesSection"
import ImportantDatesSection from "../components/ImportantDatesSection"
import AccommodationsSection from "../components/AccommodationsSection"
import EventsSection from "../components/EventsSection"
import AskQuestionsSection from "../components/AskQuestionsSection"
import EmailListSection from "../components/EmailListSection"
import FreshersHubSection from "../components/FreshersHubSection"
import FinancialLedgerSection from "../components/FinancialLedgerSection"

const PRIMARY = "#2F4EA2"
const INK = "#111827"
const MUTED = "#6B7280"
const BORDER = "#BFC3C6"
const SECTION_BG = "#F7F8FA"

type SectionId =
  | "updates"
  | "dates"
  | "accommodations"
  | "events"
  | "questions"
  | "emails"
  | "freshers"
  | "ledger"

const sectionMeta: { id: SectionId; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "updates",
    label: "Updates",
    description: "News and announcements for students",
    icon: <Notification03Icon size={40} color={PRIMARY} />,
  },
  {
    id: "dates",
    label: "Important Dates",
    description: "JAMB, admission and registration deadlines",
    icon: <Calendar03Icon size={40} color={PRIMARY} />,
  },
  {
    id: "accommodations",
    label: "Accommodations",
    description: "Housing listings with photos and videos",
    icon: <House01Icon size={40} color={PRIMARY} />,
  },
  {
    id: "events",
    label: "Events",
    description: "Seminars, workshops and campus gatherings",
    icon: <UserGroupIcon size={40} color={PRIMARY} />,
  },
  {
    id: "questions",
    label: "Ask Campus Guide",
    description: "Student questions awaiting answers",
    icon: <QuestionIcon size={40} color={PRIMARY} />,
  },
  {
    id: "emails",
    label: "Email List",
    description: "Opted-in profiles and newsletter subscribers",
    icon: <Mail01Icon size={40} color={PRIMARY} />,
  },
  {
    id: "freshers",
    label: "Freshers Hub",
    description: "Step-by-step guidance for new intakes",
    icon: <GraduationScrollIcon size={40} color={PRIMARY} />,
  },
  {
    id: "ledger",
    label: "Financial Ledger",
    description: "Aggregated CBT, PDF, inspection, and ticket cash flows",
    icon: <Wallet01Icon size={40} color={PRIMARY} />,
  },
]

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)

  const handleLogout = async () => {
    await (supabase.auth as any).signOut()
  }

  if (activeSection) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
              style={{ borderColor: BORDER, color: PRIMARY }}
            >
              <ArrowLeft01Icon size={14} />
              Back to dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
              style={{ color: MUTED }}
            >
              <Logout01Icon size={16} />
              Log Out
            </button>
          </div>

          {activeSection === "updates" && <UpdatesSection />}
          {activeSection === "dates" && <ImportantDatesSection />}
          {activeSection === "accommodations" && <AccommodationsSection />}
          {activeSection === "events" && <EventsSection />}
          {activeSection === "questions" && <AskQuestionsSection />}
          {activeSection === "emails" && <EmailListSection />}
          {activeSection === "freshers" && <FreshersHubSection />}
          {activeSection === "ledger" && <FinancialLedgerSection />}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: SECTION_BG }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-12 flex items-center justify-between">
          <p className="text-lg font-medium tracking-tight" style={{ color: INK }}>
            Welcome back, <span className="font-semibold">Admin</span>
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
            style={{ color: MUTED }}
          >
            <Logout01Icon size={16} />
            Log Out
          </button>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {sectionMeta.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="flex flex-col items-start gap-3 rounded-xl border bg-white p-6 text-left transition-colors duration-150 hover:border-[#2F4EA2]"
              style={{ borderColor: BORDER }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-xl lg:h-20 lg:w-20" style={{ backgroundColor: "#EEF2FC" }}>
                {section.icon}
              </span>
              <span>
                <span className="block text-base font-semibold tracking-tight" style={{ color: INK }}>
                  {section.label}
                </span>
                <span className="mt-1 block text-sm leading-relaxed" style={{ color: MUTED }}>
                  {section.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
