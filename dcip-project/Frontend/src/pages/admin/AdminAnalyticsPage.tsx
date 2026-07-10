import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../services/api'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'

interface DisciplinePopularity  { discipline: string; students: number }
interface LevelCompletion       { discipline: string; level1: number; level2: number; level3: number }
interface EngagementByDiscipline{ discipline: string; avgEngagement: number }
interface WeeklyStudio          { week: string; works: number }
interface EngagementBucket      { range: string; count: number }

interface AnalyticsData {
  disciplinePopularity:    DisciplinePopularity[]
  levelCompletion:         LevelCompletion[]
  engagementByDiscipline:  EngagementByDiscipline[]
  weeklyStudio:            WeeklyStudio[]
  engagementDistribution:  EngagementBucket[]
}

const PRIMARY   = '#C8960C'
const COLORS    = ['#C8960C', '#2D6A4F', '#1E3A5F', '#D62828', '#7B2D8B']
const GRID      = '#F0EDE8'
const MUTED     = '#9CA3AF'

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-text-primary font-bold text-base">{title}</h2>
      <p className="text-text-secondary text-xs mt-0.5">{description}</p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-surface-border rounded-xl p-5">
      {children}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setData(r.data as AnalyticsData))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">Loading analytics...</p>
      </div>
    </AdminLayout>
  )

  if (error || !data) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">Could not load analytics data.</p>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-10">

        <div>
          <h1 className="text-text-primary font-bold text-xl">Analytics</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Platform performance and student engagement overview
          </p>
        </div>

        {/* 1. Discipline Popularity */}
        <Card>
          <SectionTitle
            title="Discipline Popularity"
            description="Number of students who have engaged with each discipline"
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.disciplinePopularity} barSize={40}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="discipline" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 12 }}
                cursor={{ fill: '#F9F7F4' }}
              />
              <Bar dataKey="students" name="Students" radius={[4, 4, 0, 0]}>
                {data.disciplinePopularity.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 2. Level Completion Rate */}
        <Card>
          <SectionTitle
            title="Level Completion Rate per Discipline"
            description="Percentage of enrolled students who passed each level — shows where students drop off"
          />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.levelCompletion} barSize={18}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="discipline" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 12 }}
                cursor={{ fill: '#F9F7F4' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="level1" name="Level 1" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="level2" name="Level 2" fill={PRIMARY}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="level3" name="Level 3" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 3. Average Engagement Score */}
        <Card>
          <SectionTitle
            title="Average Engagement Score by Discipline"
            description="How actively students interact with each discipline on average (0-100)"
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.engagementByDiscipline} barSize={40}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="discipline" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 12 }}
                cursor={{ fill: '#F9F7F4' }}
              />
              <Bar dataKey="avgEngagement" name="Avg Engagement" radius={[4, 4, 0, 0]}>
                {data.engagementByDiscipline.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 4. Studio Works Over Time */}
        <Card>
          <SectionTitle
            title="Studio Works Saved Over Time"
            description="Number of creative works saved per week over the last 8 weeks"
          />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.weeklyStudio}>
              <CartesianGrid stroke={GRID} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="works"
                name="Works saved"
                stroke={PRIMARY}
                strokeWidth={2.5}
                dot={{ fill: PRIMARY, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 5. Engagement Score Distribution */}
        <Card>
          <SectionTitle
            title="Engagement Score Distribution"
            description="How many students fall into each engagement bracket across all disciplines"
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.engagementDistribution} barSize={50}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 12 }}
                cursor={{ fill: '#F9F7F4' }}
              />
              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                {data.engagementDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </AdminLayout>
  )
}
