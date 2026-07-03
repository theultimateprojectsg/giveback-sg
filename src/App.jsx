import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from './assets/logo.png'
import * as XLSX from 'xlsx'
import './App.css'

const CHARITIES = [
  { id: 1, name: "Food Bank Singapore", cat: "Relief", icon: "🥫", uen: "T12CC0035G", desc: "Fighting hunger by redistributing surplus food.", ipc: true },
  { id: 2, name: "SPCA Singapore", cat: "Animals", icon: "🐾", uen: "T08CC0104K", desc: "Animal welfare, rescue and responsible ownership.", ipc: true },
  { id: 3, name: "Singapore Cancer Society", cat: "Health", icon: "🎗️", uen: "196900494K", desc: "Cancer awareness, patient support and research.", ipc: true },
  { id: 4, name: "National Kidney Foundation", cat: "Health", icon: "💙", uen: "199603200Z", desc: "Subsidised dialysis and kidney disease prevention.", ipc: true },
  { id: 5, name: "Alzheimer's Disease Association", cat: "Health", icon: "🧠", uen: "T08CC1132A", desc: "Dementia care, support and research.", ipc: true },
  { id: 6, name: "Children's Cancer Foundation", cat: "Children", icon: "🎈", uen: "T04CC0026E", desc: "Holistic support for children with cancer.", ipc: true },
  { id: 7, name: "TOUCH Community Services", cat: "Elderly", icon: "🤝", uen: "T03CC0245J", desc: "Eldercare, family and youth services.", ipc: true },
  { id: 8, name: "Nature Society Singapore", cat: "Environment", icon: "🌿", uen: "T08CC0226E", desc: "Conservation of nature and biodiversity.", ipc: true },
  { id: 9, name: "Samaritans of Singapore", cat: "Social", icon: "📞", uen: "S72SS0056F", desc: "24/7 crisis helpline for those in distress.", ipc: true },
  { id: 10, name: "Dyslexia Association of Singapore", cat: "Education", icon: "📚", uen: "T08CC0067G", desc: "Support and resources for children with dyslexia.", ipc: true },
  { id: 11, name: "Singapore Red Cross", cat: "Relief", icon: "🆘", uen: "00218R", desc: "Humanitarian aid, blood services and disaster relief.", ipc: true },
  { id: 12, name: "Cat Welfare Society", cat: "Animals", icon: "🐈", uen: "T07CC0128A", desc: "Trap-neuter-return and community cat programmes.", ipc: true },
  { id: 13, name: "Willing Hearts", cat: "Social", icon: "🥘", uen: "T09CC0062C", desc: "Daily meals delivered to over 3,000 beneficiaries.", ipc: true },
  { id: 14, name: "Singapore Heart Foundation", cat: "Health", icon: "❤️", uen: "196900164W", desc: "Heart health education and cardiac patient support.", ipc: true },
  { id: 15, name: "Beyond Social Services", cat: "Children", icon: "🌟", uen: "T13CC0105G", desc: "Empowering youth from low-income families.", ipc: true },
]

const CATEGORIES = ["All", "Health", "Children", "Elderly", "Education", "Animals", "Environment", "Relief", "Social"]

const ONBOARDING_STEPS = [
  { title: 'Welcome to Giving Tree 👋', body: 'Track every donation, get instant tax receipts, and support verified Singapore charities — all in one place.', position: 'center' },
  { title: 'Your Giving Journey', body: 'This card shows your total donated and estimated tax savings, updated automatically every time you give.', position: 'top' },
  { title: 'Set a Giving Goal', body: 'Set a personal target and track your progress toward it throughout the year.', position: 'top' },
  { title: 'Browse Charities', body: 'Tap here to explore registered charities by category, search by name, or save your favourites.', position: 'bottom-nav' },
  { title: 'Causes & Events', body: 'Check this tab for limited-time campaigns and fundraising drives from charities that need urgent support.', position: 'bottom-nav' },
  { title: 'Receipts & Tax', body: 'All your donation receipts live here, with one-tap export to PDF or Excel for your tax filing.', position: 'bottom-nav' },
]

const QUOTES = [
  '"Giving is not just about making a donation, it\'s about making a difference."',
  '"No act of kindness, no matter how small, is ever wasted."',
  '"We make a living by what we get, but a life by what we give."',
  '"Alone we can do so little; together we can do so much."',
  '"Small acts, when multiplied by millions of people, can transform the world."',
]

// ── PALETTE ──────────────────────────────────────────────
const C = {
  forest:     '#1B4332',
  teal:       '#1A3C34',
  sage:       '#40916C',
  sageLight:  '#74C69D',
  gold:       '#D4A017',
  goldLight:  '#F0C84A',
  ivory:      '#FAF7F2',
  ivoryDark:  '#F0EBE1',
  border:     '#E2D9CC',
  text:       '#1C1C1C',
  textMuted:  '#7A6E62',
  white:      '#FFFFFF',
  red:        '#C0392B',
}

export default function App() {
  const _persistedScreen = localStorage.getItem('giveback_screen') || 'home'
const [screen, setScreen] = useState(['donate', 'qr', 'success'].includes(_persistedScreen) ? 'home' : _persistedScreen)
  const [selectedCharity, setSelectedCharity] = useState(null)
  const [selectedCause, setSelectedCause] = useState(null)
  const [allCauses, setAllCauses] = useState([])
  const [amount, setAmount] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [profileName, setProfileName] = useState('')
  const [profileNric, setProfileNric] = useState('')
  const [hasNric, setHasNric] = useState(false)
  const [editingNric, setEditingNric] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [favourites, setFavourites] = useState([])
  const [filterYear, setFilterYear] = useState('All')
  const [filterCharity, setFilterCharity] = useState('All')
  const [givingGoal, setGivingGoal] = useState(0)
  const [editingGoal, setEditingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [recentSearches, setRecentSearches] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [donationsLoading, setDonationsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pullY, setPullY] = useState(0)
  const touchStartY = useRef(0)
  const [donationNote, setDonationNote] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [pendingDonationId, setPendingDonationId] = useState(null)
  const [pendingResumeQueue, setPendingResumeQueue] = useState([])
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [causes, setCauses] = useState([])
  const [causeFilter, setCauseFilter] = useState('All')
  const [sponsoredCharity, setSponsoredCharity] = useState(null)
  const [ipcOverrides, setIpcOverrides] = useState({})
  const [liveCharities, setLiveCharities] = useState([])
  const [charitiesLoading, setCharitiesLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [nricBannerDismissed, setNricBannerDismissed] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [profileGoalInput, setProfileGoalInput] = useState('0')

  useEffect(() => {
    let hadSession = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      hadSession = !!session
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') setShowResetPassword(true)
      if (event === 'SIGNED_IN' && !hadSession) goTo('home')
      hadSession = !!session
    })
    return () => subscription.unsubscribe()
  }, [])

  function goTo(screenName) {
    localStorage.setItem('giveback_screen', screenName)
    setScreen(screenName)
    if (screenName === 'home' && session) {
      checkPendingConfirmations(session)
    }
  }

  function showToast(msg, type = 'error') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ msg, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 5000)
  }

  function showConfirm({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
    return new Promise(resolve => {
      setConfirmModal({
        title, body, confirmLabel, cancelLabel,
        onConfirm: () => { setConfirmModal(null); resolve(true) },
        onCancel: () => { setConfirmModal(null); resolve(false) },
      })
    })
  }

  useEffect(() => {
    if (session) {
      loadCharities().then(() => loadDonations(session))
      loadCauses()
      loadSponsoredBanner()
      checkPendingConfirmations(session)
      applyPendingNric(session)
      setProfileName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '')
      supabase.from('donor_profiles').select('nric_masked, favourites, giving_goal, onboarding_seen, nric_banner_dismissed').eq('user_id', session.user.id).single()
        .then(({ data }) => {
          if (data?.nric_masked) { setProfileNric(data.nric_masked); setHasNric(true) }
          if (data?.favourites) setFavourites(data.favourites)
          if (data?.giving_goal) { setGivingGoal(data.giving_goal); setProfileGoalInput(data.giving_goal.toLocaleString()) }
          if (!data || !data.onboarding_seen) setShowOnboarding(true)
          if (data?.nric_banner_dismissed) setNricBannerDismissed(true)
        })
      const searches = localStorage.getItem('giveback_searches')
      if (searches) setRecentSearches(JSON.parse(searches))
    }
  }, [session])

  async function applyPendingNric(activeSession) {
    const pending = localStorage.getItem('giveback_pending_nric')
    if (!pending) return
    const { nric, full_name } = JSON.parse(pending)
    const masked = nric.slice(0, 1) + '×××××' + nric.slice(-2)
    const { error } = await supabase.from('donor_profiles').upsert({
      user_id: activeSession.user.id,
      full_name,
      nric,
      nric_masked: masked,
    })
    if (!error) {
      localStorage.removeItem('giveback_pending_nric')
      setProfileNric(masked)
      setHasNric(true)
    } else {
      console.error('Could not apply pending NRIC on login:', error)
    }
  }

  async function checkPendingConfirmations(activeSession) {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_email', activeSession.user.email)
      .eq('status', 'awaiting_donor_confirmation')
      .order('created_at', { ascending: false })
    if (error) { console.error('Could not check pending confirmations:', error); return }
    if (!data || data.length === 0) return

    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
    const expired = data.filter(d => new Date(d.created_at).getTime() < fortyEightHoursAgo)
    const stillValid = data.filter(d => new Date(d.created_at).getTime() >= fortyEightHoursAgo)

    if (expired.length > 0) {
      await supabase
        .from('donations')
        .update({ status: 'cancelled_by_donor' })
        .in('id', expired.map(d => d.id))
        .eq('status', 'awaiting_donor_confirmation')
    }

    if (stillValid.length > 0) {
      setPendingResumeQueue(stillValid)
    }
  }

  async function loadDonations(activeSession = session) {
    setDonationsLoading(true)
    const { data, error } = await supabase
      .from('donations') 
      .select('*')
      .eq('donor_email', activeSession.user.email)
      .not('status', 'in', '(cancelled_by_donor,deleted_by_charity,awaiting_donor_confirmation)')
      .order('created_at', { ascending: false })
    if (error) { console.error(error); setSubmitting(false); setDonationsLoading(false); return }
    setDonations(data.map(d => ({
      id: d.id,
      charity: d.charity_name,
      charity_uen: d.charity_uen,
      icon: liveCharities.find(c => c.uen === d.charity_uen)?.icon || d.charity_name?.charAt(0).toUpperCase() || '💚',
      amount: d.amount,
      date: new Date(d.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }),
      year: new Date(d.created_at).toLocaleDateString('en-SG', { year: 'numeric' }),
      receipt: d.receipt_issued,
      paymentStatus: d.payment_status,
      createdAt: d.created_at,
      notes: d.notes,
      paymentRef: d.payment_ref,
      donorNricMasked: d.donor_nric ? (d.donor_nric.slice(0, 1) + '×××××' + d.donor_nric.slice(-2)) : null,
      canCancel: d.payment_status === 'pending'
    })))
    setDonationsLoading(false)
  }

  async function loadSponsoredBanner() {
    if (sponsoredCharity) return
    const { data, error } = await supabase
      .from('causes')
      .select('*')
      .eq('active', true)
      .eq('status', 'approved')
      .eq('type', 'sponsored')
    if (error) { console.error(error); return }
    if (data && data.length > 0) {
      const picked = data[Math.floor(Math.random() * data.length)]
      setSponsoredCharity(picked)
    }
  }

  async function loadCharities() {
    setCharitiesLoading(true)
    const { data, error } = await supabase
      .from('charity_contacts')
      .select('charity_uen, charity_name, category, icon, description, ipc, active')
      .eq('active', true)
      .order('charity_name', { ascending: true })
    if (error) { console.error('Could not load charities:', error); setCharitiesLoading(false); return null }
    setLiveCharities(data.map(c => ({
      id: c.charity_uen,
      uen: c.charity_uen,
      name: c.charity_name,
      cat: c.category || 'General',
      icon: c.icon || '💚',
      desc: c.description || 'A registered charity on Giving Tree.',
      ipc: c.ipc !== false,
    })))
    const map = {}
    data.forEach(row => { map[row.charity_uen] = row.ipc })
    setIpcOverrides(map)
    setCharitiesLoading(false)
  }

  async function loadCauses() {
    const { data, error } = await supabase
      .from('causes')
      .select('*')
      .eq('status', 'approved')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (!error) {
      setCauses(data)
      setAllCauses(data)
    }
  }

  function causeNameForDonation(donation) {
    if (!donation?.cause_id) return null
    const c = allCauses.find(c => c.id === donation.cause_id)
    return c ? c.title : null
  }

  async function resendVerificationEmail() {
    const { error } = await supabase.auth.resend({ type: 'signup', email: session.user.email })
    if (error) { setProfileMsg('Could not resend: ' + error.message); return }
    setProfileMsg('Verification email resent! Check your inbox (and spam folder).')
    setTimeout(() => setProfileMsg(''), 5000)
  }

  function dismissNricBanner() {
    setNricBannerDismissed(true)
    supabase.from('donor_profiles').upsert({ user_id: session.user.id, nric_banner_dismissed: true }).then(({ error }) => {
      if (error) console.error('Could not save nric_banner_dismissed:', error)
    })
  }

  function finishOnboarding() {
    setShowOnboarding(false)
    setOnboardingStep(0)
    supabase.from('donor_profiles').upsert({ user_id: session.user.id, onboarding_seen: true }).then(({ error }) => {
      if (error) console.error('Could not save onboarding_seen:', error)
    })
  }

  function saveGivingGoal(g) {
    setGivingGoal(g)
    supabase.from('donor_profiles').upsert({ user_id: session.user.id, giving_goal: g }).then(({ error }) => {
      if (error) console.error('Could not save giving goal:', error)
    })
  }

  function toggleFavourite(charity) {
    const isFav = favourites.find(f => f.uen === charity.uen)
    const updated = isFav
      ? favourites.filter(f => f.uen !== charity.uen)
      : [...favourites, charity]
    setFavourites(updated)
    supabase.from('donor_profiles').upsert({ user_id: session.user.id, favourites: updated }).then(({ error }) => {
      if (error) console.error('Could not save favourites:', error)
    })
  }

  function addRecentSearch(term) {
    if (!term.trim()) return
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('giveback_searches', JSON.stringify(updated))
  }

  const dynamicCategories = ['All', ...new Set(liveCharities.map(c => c.cat))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b))

  const filteredCharities = liveCharities.filter(c => {
    const matchCat = selectedCat === 'All' || c.cat === selectedCat
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
  }).sort((a, b) => a.name.localeCompare(b.name))

  const filteredDonations = donations.filter(d => {
    const matchYear = filterYear === 'All' || d.year === filterYear
    const matchCharity = filterCharity === 'All' || d.charity === filterCharity
    return matchYear && matchCharity
  })

  const totalDonated = filteredDonations.reduce((sum, d) => sum + d.amount, 0)
  const totalAllTime = donations.reduce((sum, d) => sum + d.amount, 0)
  const taxSaving = amount ? (parseFloat(amount) * 2.5 * 0.22).toFixed(2) : '0.00'
  const donorName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email || 'Donor'
  const goalProgress = givingGoal > 0 ? Math.min((totalAllTime / givingGoal) * 100, 100) : 0
  const uniqueCharities = [...new Set(donations.map(d => d.charity))]
  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length]

  function getCharityIpcState(uen) {
    if (ipcOverrides[uen] !== undefined) return ipcOverrides[uen] ? 'ipc' : 'not_ipc'
    const live = liveCharities.find(c => c.uen === uen)
    if (live) return live.ipc !== false ? 'ipc' : 'not_ipc'
    return 'unknown'
  }

  function isCharityIpc(uen) {
    return getCharityIpcState(uen) === 'ipc'
  }

  async function cancelDonation(donationId) {
    const { data: freshDonation, error: fetchError } = await supabase
      .from('donations')
      .select('charity_name, charity_uen, amount, payment_status')
      .eq('id', donationId)
      .single()
    if (fetchError) console.error('Could not fetch donation details for audit log:', fetchError)
    if (freshDonation?.payment_status === 'confirmed') {
      showToast('This donation has already been confirmed and can no longer be cancelled. Contact hello@givingtree.sg for help.')
      await loadDonations()
      return
    }
    const { error } = await supabase
      .from('donations')
      .update({ status: 'cancelled_by_donor' })
      .eq('id', donationId)
      .eq('donor_email', session.user.email)
      .eq('payment_status', 'pending')
    if (error) { console.error(error); showToast('Could not cancel this donation. Please try again or contact hello@givingtree.sg.'); return }
    await supabase.from('audit_log').insert({
      actor_type: 'donor',
      actor_email: session.user.email,
      action: 'donation_cancelled',
      donation_id: donationId,
      details: { charity_name: freshDonation?.charity_name, charity_uen: freshDonation?.charity_uen, amount: freshDonation?.amount },
    })
    setDonations(donations.filter(d => d.id !== donationId))
  }

  async function createPendingDonation(ref) {
    if (!session?.user?.email_confirmed_at) return
    const { data: profile } = await supabase
      .from('donor_profiles')
      .select('nric')
      .eq('user_id', session.user.id)
      .single()
    const { data, error } = await supabase
      .from('donations')
      .insert([{
        donor_name: donorName,
        donor_email: session.user.email,
        donor_nric: profile?.nric || null,
        charity_name: selectedCharity.name,
        charity_uen: selectedCharity.uen,
        cause_id: selectedCause?.id || null,
        amount: parseFloat(amount),
        status: 'awaiting_donor_confirmation',
        payment_status: 'pending',
        receipt_issued: false,
        notes: donationNote || null,
        payment_ref: ref,
      }])
      .select()
    if (error) { console.error('Could not create pending donation:', error); return }
    setPendingDonationId(data[0].id)
  }

  async function resolvePendingResume(confirmed) {
    const current = pendingResumeQueue[0]
    if (!current) return
    if (!confirmed) {
      await supabase
        .from('donations')
        .update({ status: 'cancelled_by_donor' })
        .eq('id', current.id)
        .eq('status', 'awaiting_donor_confirmation')
      setPendingResumeQueue(q => q.slice(1))
      return
    }
    const charityIpc = getCharityIpcState(current.charity_uen) === 'ipc'
    if (charityIpc && !hasNric) {
      const proceedWithoutNric = await showConfirm({
        title: 'No NRIC on File',
        body: `${current.charity_name} won't be able to submit this donation to IRAS for your 250% tax deduction. Add your NRIC in Profile first, or continue without it.`,
        confirmLabel: 'Continue Without NRIC',
        cancelLabel: 'Go to Profile',
      })
      if (!proceedWithoutNric) { goTo('profile'); return }
    }
    if (current.amount >= 1000) {
      const confirmedLargeAmount = await showConfirm({
        title: 'Confirm Large Donation',
        body: `You're about to confirm SGD $${current.amount.toLocaleString()} to ${current.charity_name}. Please confirm this is correct before proceeding.`,
        confirmLabel: 'Confirm & Continue',
        cancelLabel: 'Go Back',
      })
      if (!confirmedLargeAmount) return
    }
    const { data, error } = await supabase
      .from('donations')
      .update({ status: 'confirmed' })
      .eq('id', current.id)
      .eq('status', 'awaiting_donor_confirmation')
      .select()
    if (error || !data || data.length === 0) {
      showToast('Could not confirm this donation. Please try again or contact hello@givingtree.sg.')
      return
    }
    await supabase.from('audit_log').insert({
      actor_type: 'donor',
      actor_email: session.user.email,
      action: 'donation_created',
      donation_id: data[0].id,
      details: { charity_name: current.charity_name, charity_uen: current.charity_uen, amount: current.amount, notes: current.notes, resumed: true },
    })
    setPendingResumeQueue(q => q.slice(1))
    await loadDonations()
    showToast('Donation confirmed — thank you!', 'success')
  }

  async function handleDonate() {
    if (!amount || parseFloat(amount) <= 0) return
    if (submitting) return

    if (!session?.user?.email_confirmed_at) {
      showToast('Please verify your email before donating. Check your inbox, or resend from your Profile.')
      return
    }

    if (!pendingDonationId) {
      showToast('Something went wrong finding your donation. Please go back and try again.')
      return
    }

    setSubmitting(true)

    // Check session is still valid
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) {
      setSubmitting(false)
      showToast('Your session has expired. Please sign in again.')
      supabase.auth.signOut()
      return
    }

    const { data, error } = await supabase
      .from('donations')
      .update({ status: 'confirmed' })
      .eq('id', pendingDonationId)
      .eq('donor_email', session.user.email)
      .eq('status', 'awaiting_donor_confirmation')
      .select()
    if (error) {
      console.error(error)
      setSubmitting(false)
      showToast('Could not confirm your donation. Please try again or contact hello@givingtree.sg.')
      return
    }
    if (!data || data.length === 0) {
      setSubmitting(false)
      showToast('This donation may have already been confirmed or expired. Check your Recent Activity.')
      return
    }
    await supabase.from('audit_log').insert({
      actor_type: 'donor',
      actor_email: session.user.email,
      action: 'donation_created',
      donation_id: data[0].id,
      details: { charity_name: selectedCharity.name, charity_uen: selectedCharity.uen, amount: parseFloat(amount), notes: donationNote || null },
    })

    // Notify the charity of the new donation (best-effort, doesn't block the donor flow if it fails)
    supabase.from('charity_contacts').select('notification_email').eq('charity_uen', selectedCharity.uen).single()
      .then(({ data: contact, error: contactError }) => {
        if (contactError) {
          console.error('Could not look up charity_contacts:', contactError)
          supabase.from('audit_log').insert({
            actor_type: 'system',
            action: 'charity_notification_failed',
            donation_id: data[0].id,
            details: { charity_uen: selectedCharity.uen, reason: 'charity_contacts lookup failed', error: contactError.message },
          })
          return
        }
        if (!contact?.notification_email) {
          console.warn('No notification_email found for charity_uen:', selectedCharity.uen)
          supabase.from('audit_log').insert({
            actor_type: 'system',
            action: 'charity_notification_failed',
            donation_id: data[0].id,
            details: { charity_uen: selectedCharity.uen, reason: 'no notification_email on file' },
          })
          return
        }
        supabase.functions.invoke('notify-charity-donation', {
          body: {
            charity_email: contact.notification_email,
            charity_name: selectedCharity.name,
            charity_uen: selectedCharity.uen,
            donor_name: data[0].donor_name,
            donor_email: data[0].donor_email,
            amount: data[0].amount,
            date: new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }),
            payment_ref: data[0].payment_ref,
            notes: data[0].notes,
          }
        }).then(res => {
          if (res.error) {
            supabase.from('audit_log').insert({
              actor_type: 'system',
              action: 'charity_notification_failed',
              donation_id: data[0].id,
              details: { charity_uen: selectedCharity.uen, reason: 'edge function returned error', error: res.error.message },
            })
          }
        }).catch(err => {
          console.error('Charity notification failed:', err)
          supabase.from('audit_log').insert({
            actor_type: 'system',
            action: 'charity_notification_failed',
            donation_id: data[0].id,
            details: { charity_uen: selectedCharity.uen, reason: 'edge function invoke threw', error: err.message },
          })
        })
      })

    setDonations([{
      id: data[0].id,
      charity: selectedCharity.name,
      charity_uen: selectedCharity.uen,
      icon: selectedCharity.icon,
      amount: parseFloat(amount),
      date: new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }),
      year: new Date().getFullYear().toString(),
      createdAt: new Date().toISOString(),
      receipt: false,
      paymentStatus: 'pending',
      notes: donationNote || null,
      paymentRef: paymentRef || null,
      canCancel: true
    }, ...donations.filter(d => d.id !== data[0].id)])
    setPendingDonationId(null)
    setSubmitting(false)
    setDonationNote('')
    goTo('success')
  }

  async function saveProfile() {
    if (savingProfile) return
    if (!profileName) { setProfileMsg('Please enter your name'); return }
    setSavingProfile(true)
    const { error: nameError } = await supabase.auth.updateUser({ data: { full_name: profileName } })
    if (nameError) { setProfileMsg('Error saving. Please try again.'); setSavingProfile(false); return }
    if (profileNric.length === 9) {
      const validNric = /^[A-Z]\d{7}[A-Z]$/.test(profileNric)
      if (!validNric) { setProfileMsg('Invalid NRIC format. Should be like S1234567B'); setSavingProfile(false); return }
      const masked = profileNric.slice(0, 1) + '×××××' + profileNric.slice(-2)
      const { error: nricError } = await supabase.from('donor_profiles').upsert({
        user_id: session.user.id,
        full_name: profileName,
        nric: profileNric,
        nric_masked: masked,
      })
      if (nricError) { setProfileMsg('Error saving NRIC. Please try again.'); setSavingProfile(false); return }

      // Sync this NRIC onto the donor's existing donations — but only ones without an issued receipt,
      // since a receipt already in the charity's hands (and possibly filed with IRAS) shouldn't silently
      // disagree with what's now in the database.
      const { data: syncedDonations, error: syncError } = await supabase
        .from('donations')
        .update({ donor_nric: profileNric })
        .eq('donor_email', session.user.email)
        .eq('receipt_issued', false)
        .select('id')
      if (syncError) console.error('Could not sync NRIC to existing donations:', syncError)
      if (syncedDonations?.length) {
        await supabase.from('audit_log').insert({
          actor_type: 'donor',
          actor_email: session.user.email,
          action: 'nric_synced_by_donor',
          details: { donation_count: syncedDonations.length },
        })
      }
      await loadDonations()

      setProfileNric(masked)
      setHasNric(true)
      setEditingNric(false)
    } else if (profileNric.length === 0 && editingNric) {
      const confirmedRemoval = await showConfirm({
        title: 'Remove your NRIC?',
        body: "Without it, the charity won't be able to submit your donations to IRAS, so your 250% tax deduction won't be automatically included until you add it again.",
        confirmLabel: 'Remove NRIC',
        cancelLabel: 'Keep It',
      })
      if (!confirmedRemoval) {
        setEditingNric(false)
        setSavingProfile(false)
        return
      }
      const { error: clearError } = await supabase.from('donor_profiles').upsert({
        user_id: session.user.id,
        full_name: profileName,
        nric: null,
        nric_masked: null,
      })
      if (clearError) { setProfileMsg('Error removing NRIC. Please try again.'); setSavingProfile(false); return }
      setHasNric(false)
      setEditingNric(false)
    } else if (profileNric.length > 0 && profileNric.length < 9) {
      setProfileMsg('NRIC must be 9 characters, or leave blank to remove it')
      setSavingProfile(false)
      return
    }
    setProfileMsg('Profile saved successfully!')
    setSavingProfile(false)
    setTimeout(() => setProfileMsg(''), 3000)
  }

  function exportIRASPDF() {
    setExporting(true)
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`Giving Tree - IRAS Donation Statement ${filterYear === 'All' ? 'All Years' : filterYear}`, 14, 22)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Donor: ${donorName}`, 14, 32)
    doc.text(`Email: ${session?.user?.email}`, 14, 39)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-SG')}`, 14, 46)
    doc.text(`Total Donated: SGD $${totalDonated}`, 14, 53)
    const deductibleTotal = filteredDonations.filter(d => isCharityIpc(d.charity_uen)).reduce((sum, d) => sum + d.amount, 0)
    doc.text(`Tax Deductible (250%): SGD $${(deductibleTotal * 2.5).toFixed(2)}`, 14, 60)
    doc.text(`Est. Tax Savings (illustrative, 22% rate): SGD $${(deductibleTotal * 2.5 * 0.22).toFixed(2)}`, 14, 67)
    autoTable(doc, {
      startY: 76,
      head: [['Charity', 'Amount (SGD)', 'Date', 'Receipt', 'Tax Deductible', 'Payment Ref', 'Notes']],
      body: filteredDonations.map(d => {
        return [d.charity, `$${d.amount.toFixed(2)}`, d.date, d.receipt ? 'Issued' : 'Pending', isCharityIpc(d.charity_uen) ? 'Yes' : 'No', d.paymentRef || '—', d.notes || '—']
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [64, 145, 108], textColor: [255, 255, 255] },
    })
    const totalY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text(`Total: SGD $${totalDonated}`, 14, totalY)
    doc.text(`250% Deductible: SGD $${(deductibleTotal * 2.5).toFixed(2)}`, 14, totalY + 7)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Only donations to IPC-registered charities are eligible for the 250% tax deduction. Check each entry above.', 14, totalY + 18)
    doc.text('Tax savings shown assume a flat 22% rate for illustration only. Actual savings depend on your tax bracket.', 14, totalY + 25)
    doc.save(`GivingTree-IRAS-${filterYear}.pdf`)
    setExporting(false)
  }

  function exportIRASExcel() {
    setExporting(true)
    const data = filteredDonations.map(d => {
      const ipcStatus = isCharityIpc(d.charity_uen)
      return {
        'Charity': d.charity, 'Amount (SGD)': d.amount, 'Date': d.date,
        'Receipt': d.receipt ? 'Issued' : 'Pending',
        'IPC Registered': ipcStatus ? 'Yes' : 'No',
        'Tax Deductible (250%)': ipcStatus ? d.amount * 2.5 : 0,
        'Payment Reference': d.paymentRef || '',
        'Notes': d.notes || '',
      }
    })
    const deductibleTotal = filteredDonations.filter(d => isCharityIpc(d.charity_uen)).reduce((sum, d) => sum + d.amount, 0)
    const summary = [
      {}, { 'Charity': 'SUMMARY' },
      { 'Charity': 'Donor', 'Amount (SGD)': donorName },
      { 'Charity': 'Total Donated', 'Amount (SGD)': totalDonated },
      { 'Charity': 'Tax Deductible', 'Amount (SGD)': deductibleTotal * 2.5 },
      { 'Charity': 'Est. Tax Savings', 'Amount (SGD)': deductibleTotal * 2.5 * 0.22 },
    ]
    const ws = XLSX.utils.json_to_sheet([...data, ...summary])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `IRAS ${filterYear}`)
    XLSX.writeFile(wb, `GivingTree-IRAS-${filterYear}.xlsx`)
    setExporting(false)
  }

  function exportSingleReceiptPDF(donation) {
    const doc = new jsPDF()
    const isIpc = isCharityIpc(donation.charity_uen)
    const pageWidth = 210
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    const forest = [27, 67, 50]
    const gold = [212, 160, 23]
    const ivory = [250, 247, 242]
    const successBg = [238, 246, 241]
    const mutedText = [122, 110, 98]
    const darkText = [28, 28, 28]
    const borderColor = [226, 217, 204]

    doc.setFillColor(...forest)
    doc.rect(0, 0, pageWidth, 42, 'F')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('OFFICIAL DONATION RECEIPT', margin, 16)
    doc.setFontSize(16)
    doc.text(donation.charity_name || 'Charity', margin, 26)
    doc.setFontSize(10)
    doc.text(`UEN ${donation.charity_uen || ''}`, margin, 34)

    let y = 56
    doc.setFontSize(9)
    doc.setTextColor(...mutedText)
    doc.text('ISSUED TO', margin, y)
    doc.setFontSize(9)
    doc.text('RECEIPT NO.', pageWidth - margin, y, { align: 'right' })
    y += 7
    doc.setFontSize(13)
    doc.setTextColor(...darkText)
    doc.text(donation.donor_name || '', margin, y)
    doc.setFontSize(10)
    doc.text(donation.payment_ref || donation.receipt_number || 'N/A', pageWidth - margin, y, { align: 'right' })
    y += 6
    doc.setDrawColor(...borderColor)
    doc.line(margin, y, pageWidth - margin, y)

    y += 14
    doc.setFillColor(...ivory)
    doc.roundedRect(margin, y, contentWidth, 32, 4, 4, 'F')
    doc.setFontSize(9)
    doc.setTextColor(...mutedText)
    doc.text('AMOUNT DONATED', pageWidth / 2, y + 12, { align: 'center' })
    doc.setFontSize(22)
    doc.setTextColor(...forest)
    doc.text(`SGD $${Number(donation.amount).toLocaleString()}.00`, pageWidth / 2, y + 24, { align: 'center' })

    y += 44
    const facts = [
      ['Date', new Date(donation.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['Payment method', donation.source === 'manual' ? (donation.payment_method || 'Manual') : 'PayNow'],
    ]
    const causeTitle = causeNameForDonation(donation)
    if (causeTitle) facts.push(['Cause', causeTitle])
    if (donation.donor_nric) facts.push(['NRIC / FIN on file', donation.donor_nric])

    facts.forEach(([label, value], i) => {
      doc.setFontSize(10)
      doc.setTextColor(...mutedText)
      doc.text(label, margin, y)
      doc.setTextColor(...darkText)
      doc.text(String(value), pageWidth - margin, y, { align: 'right' })
      if (i < facts.length - 1) {
        doc.setDrawColor(240, 235, 225)
        doc.line(margin, y + 3, pageWidth - margin, y + 3)
      }
      y += 9
    })

    if (donation.notes) {
      y += 4
      const noteLines = doc.splitTextToSize(donation.notes, contentWidth - 12)
      const noteBoxHeight = 14 + noteLines.length * 5
      doc.setFillColor(...ivory)
      doc.roundedRect(margin, y, contentWidth, noteBoxHeight, 4, 4, 'F')
      doc.setFontSize(8)
      doc.setTextColor(...mutedText)
      doc.text('NOTE FROM DONOR', margin + 6, y + 8)
      doc.setFontSize(10)
      doc.setTextColor(...darkText)
      doc.text(noteLines, margin + 6, y + 15)
      y += noteBoxHeight + 10
    } else {
      y += 6
    }

    if (isIpc) {
      doc.setFillColor(...successBg)
      doc.roundedRect(margin, y, contentWidth, 26, 4, 4, 'F')
      doc.setFontSize(10)
      doc.setTextColor(59, 109, 17)
      doc.text('250% tax deductible', margin + 8, y + 11)
      doc.text('Est. tax savings (22%)', margin + 8, y + 20)
      doc.setFontSize(12)
      doc.setTextColor(...forest)
      doc.text(`SGD $${(donation.amount * 2.5).toLocaleString()}.00`, pageWidth - margin - 8, y + 11, { align: 'right' })
      doc.text(`SGD $${(donation.amount * 2.5 * 0.22).toLocaleString(undefined, { maximumFractionDigits: 0 })}.00`, pageWidth - margin - 8, y + 20, { align: 'right' })
      y += 36
    } else {
      doc.setFillColor(...ivory)
      doc.roundedRect(margin, y, contentWidth, 16, 4, 4, 'F')
      doc.setFontSize(9)
      doc.setTextColor(...mutedText)
      doc.text('This charity is registered but not an IPC. Not tax deductible.', pageWidth / 2, y + 10, { align: 'center' })
      y += 26
    }

    doc.setDrawColor(...borderColor)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
    doc.setFontSize(9)
    doc.setTextColor(...mutedText)
    doc.text('Issued via Giving Tree, a donation platform for Singapore charities', pageWidth / 2, y, { align: 'center' })
    y += 8
    doc.setFontSize(8)
    doc.setTextColor(180, 178, 167)
    doc.text('Tax savings shown assume a flat 22% rate for illustration only. Actual savings depend on your tax bracket.', pageWidth / 2, y, { align: 'center', maxWidth: contentWidth })

    doc.save(`Receipt-${donation.payment_ref || donation.id}.pdf`)
  }

  function shareOnSocial(donation) {
    const text = `I just donated SGD $${Number(donation.amount).toFixed(2)} to ${donation.charity} via Giving Tree! 💚 #GivingTree #Singapore`
    if (navigator.share) {
      navigator.share({ title: 'I donated via Giving Tree!', text, url: 'https://givingtree.sg' })
        .then(() => showToast('Thanks for sharing!', 'success'))
        .catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Donation message copied to clipboard!', 'success'))
        .catch(() => showToast('Could not copy to clipboard.'))
    }
  }

  function saveQR() {
    const svg = document.querySelector('#qr-code-svg')
    if (!svg) { showToast('Could not find the QR code to save. Please try again.'); return }
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 300
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 300, 300)
      ctx.drawImage(img, 25, 25, 250, 250)
      const a = document.createElement('a')
      a.download = `GivingTree-${selectedCharity.name}-QR.png`
      a.href = canvas.toDataURL('image/png'); a.click()
    }
    img.onerror = () => {
      showToast('Could not save the QR code image. Please try again or take a screenshot instead.')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgStr)
  }

  async function handleSetNewPassword() {
    if (newPassword.length < 6) { setResetMsg('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setResetMsg('Passwords do not match'); return }
    setResetLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setResetLoading(false)
    if (error) { setResetMsg(error.message); return }
    setResetMsg('Password updated! Redirecting...')
    setTimeout(() => { setShowResetPassword(false); setNewPassword(''); setConfirmPassword(''); setResetMsg('') }, 1500)
  }

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: 'Segoe UI', fontSize: 16, color: C.textMuted }}>
      Loading...
    </div>
  )

  if (showResetPassword) return (
    <div style={{ minHeight: '100dvh', background: '#0F2419', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <div style={{ background: C.ivory, borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.forest, marginBottom: 8 }}>Set a New Password</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Enter a new password for your Giving Tree account.</div>
        {resetMsg && <div style={{ background: '#EEF6F1', color: C.forest, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{resetMsg}</div>}
        <input style={{ ...styles.profileInput, marginBottom: 12 }} type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <input style={{ ...styles.profileInput, marginBottom: 16 }} type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        <button style={{ ...styles.payBtn, margin: 0, width: '100%' }} onClick={handleSetNewPassword} disabled={resetLoading}>{resetLoading ? 'Saving...' : 'Update Password'}</button>
      </div>
    </div>
  )

  if (!session) return <Auth />

  return (
    <div style={{ minHeight: '100dvh', background: '#0F2419', display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
    <div className="giving-tree-app-shell" style={styles.app}>

      {/* ── HOME ── */}
      {screen === 'home' && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={styles.quote}>
            <div style={{ height: 0 }} />
            <div><img src={logo} style={{ width: 36, height: 36, objectFit: 'contain' }} /></div>
          </div>
            
            
            <div style={styles.name}> {(() => { const name = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name)?.split(' ')[0]; if (!name) return 'Your'; return name.endsWith('s') ? `${name}'` : `${name}'s`; })()} Giving Journey</div>
            <div style={styles.quote}>{todayQuote}</div>
            <div style={{ height: 5 }} />
          </div>
          <div
  style={styles.scrollArea}
  onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
  onTouchMove={e => {
    const el = e.currentTarget
    const diff = e.touches[0].clientY - touchStartY.current
    if (el.scrollTop === 0 && diff > 0) setPullY(Math.min(diff * 0.4, 60))
    else setPullY(0)  
  }}
  onTouchEnd={async () => {
    if (pullY > 40) {
      setRefreshing(true)
      await loadDonations()
      setRefreshing(false)
    }
    setPullY(0)
  }}
>

{pendingResumeQueue.length > 0 && (
    <div style={{ margin: '0 16px 16px', background: '#FDF3DC', border: '1.5px solid #E8CC7A', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#A07010', marginBottom: 4 }}>
        Did you complete this donation?
        {pendingResumeQueue.length > 1 && ` (1 of ${pendingResumeQueue.length})`}
      </div>
      <div style={{ fontSize: 12, color: '#A07010', lineHeight: 1.5, marginBottom: 10 }}>
        You started a SGD ${pendingResumeQueue[0].amount.toLocaleString()} donation to {pendingResumeQueue[0].charity_name} but never confirmed it.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, padding: '8px', background: C.sage, color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => resolvePendingResume(true)}>Yes, I paid</button>
        <button style={{ flex: 1, padding: '8px', background: '#FFFFFF', color: '#A07010', border: '1.5px solid #E8CC7A', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => resolvePendingResume(false)}>No, cancel it</button>
      </div>
    </div>
  )}

            {/* HERO CARD — sage green */}
            <div style={styles.card}>
            <div style={styles.cardLabel}>Total Given · {new Date().getFullYear()}</div>
              <div style={styles.cardAmount}>SGD {totalAllTime.toLocaleString()}</div>
              <div style={styles.cardBottom}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div style={styles.cardStat}>{donations.length}</div>
                  <div style={styles.cardStatLabel}>Donations</div>
                </div>
                <div style={styles.taxBadge}>
                250% · ~${(totalAllTime * 2.5 * 0.22).toLocaleString()} estimated saved*
                </div>
              </div>
            </div>

            {!hasNric && !nricBannerDismissed && (
              <div style={{ margin: '0 16px 16px', background: '#FDF3DC', border: '1.5px solid #E8CC7A', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>🪪</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#A07010', marginBottom: 3 }}>Add your NRIC for tax deductions</div>
                  <div style={{ fontSize: 12, color: '#A07010', lineHeight: 1.5, marginBottom: 8 }}>Without it, charities can't submit your donations to IRAS for the 250% tax deduction.</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#A07010', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => goTo('profile')}>Add NRIC</span>
                    <span style={{ fontSize: 12, color: '#A07010', opacity: 0.7, cursor: 'pointer' }} onClick={dismissNricBanner}>Dismiss</span>
                  </div>
                </div>
              </div>
            )}

            {/* GIVING GOAL */}
            <div style={styles.goalCard}>
              <div style={styles.goalHeader}>
                <div style={styles.goalTitle}>🎯 Giving Goal</div>
                {!editingGoal ? (
                  <div style={styles.goalEdit} onClick={() => { setEditingGoal(true); setNewGoal(givingGoal.toString()) }}>Edit</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={styles.goalInput} value={newGoal} onChange={e => setNewGoal(e.target.value)} type="number" min="1" />
                    <div style={styles.goalEdit} onClick={() => {
                      const g = Math.max(parseInt(newGoal) || 1000, 1)
                      saveGivingGoal(g)
                      setEditingGoal(false)
                    }}>Save</div>
                  </div>  
                )}
              </div>
              {givingGoal > 0 ? (
                <>
                  <div style={styles.goalBarBg}>
                    <div style={{ height: '100%', width: `${goalProgress}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.sage})`, borderRadius: 10, transition: 'width 0.5s', minWidth: 8 }} />
                  </div>
                  <div style={styles.goalMeta}>
                    <span>${totalAllTime.toLocaleString()} donated</span>
                    <span>{totalAllTime > givingGoal ? `🎉 Goal exceeded · ${((totalAllTime / givingGoal) * 100).toFixed(0)}%` : `${goalProgress.toFixed(0)}% of $${givingGoal.toLocaleString()}`}</span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '8px 0' }}>Set a target to track your progress throughout the year</div>
              )}
            </div>

            {/* FAVOURITES */}
            {favourites.length > 0 && (
              <>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionTitle}>❤️ Favourites</div>
                  <div style={styles.sectionMeta}>{favourites.length} saved</div>
                </div>
                <div style={styles.favScroll}>
                  {favourites.map(c => (
                    <div key={c.uen} style={styles.favCard} onClick={() => { setSelectedCharity(c); setSelectedCause(null); setAmount(''); setPaymentRef(''); setDonationNote(''); goTo('donate') }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                      <div style={styles.favName}>{c.name}</div>
                      <div style={styles.favBtn}>Give Again</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SPONSORED BANNER */}
            {sponsoredCharity && (
              <div style={{ margin: '0 16px 16px', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
                <div style={{ background: C.ivoryDark, padding: '4px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Sponsored</div>
                </div>
                <div style={{ background: C.white, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ fontSize: 36, width: 56, height: 56, background: '#FFF5E6', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {liveCharities.find(c => c.uen === sponsoredCharity.charity_uen)?.icon || sponsoredCharity.charity_name?.charAt(0).toUpperCase() || '🎗️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Featured Charity</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.forest, marginBottom: 3 }}>{sponsoredCharity.charity_name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>{liveCharities.find(c => c.uen === sponsoredCharity.charity_uen)?.desc || 'A registered charity on Giving Tree.'}</div>
                  </div>
                </div>
                <div style={{ padding: '0 16px 14px' }}>
                  <button
                    style={{ width: '100%', padding: '10px', background: C.gold, color: C.forest, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => {
                      const c = liveCharities.find(c => c.uen === sponsoredCharity.charity_uen) || { name: sponsoredCharity.charity_name, uen: sponsoredCharity.charity_uen, icon: '💚', ipc: !!ipcOverrides[sponsoredCharity.charity_uen] }
                      setSelectedCharity(c)
                      setSelectedCause(null)
                      setAmount('')
                      setPaymentRef('')
                      setDonationNote('')
                      goTo('donate')
                    }}
                  >
                    Donate Now
                  </button>
                </div>
              </div>
            )}

            {/* RECENT ACTIVITY */}
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}>Recent Activity</div>
              {donations.length > 10 && (
                <div style={{ fontSize: 12, color: C.sage, fontWeight: 600, cursor: 'pointer' }} onClick={() => goTo('receipts')}>View All →</div>
              )}
            </div>
            <div style={{ padding: '0 16px 24px' }}>
              {donationsLoading && (
                <div style={styles.emptyState}>Loading your donations...</div>
              )}
              {!donationsLoading && donations.length === 0 && (
                <div style={styles.emptyState}>No donations yet. Browse charities to get started!</div>
              )}
              {donations.slice(0, 10).map(d => (
                <div key={d.id} style={{ ...styles.activityItem, cursor: 'pointer' }} onClick={() => goTo('receipts')}>
                  <div style={styles.activityIcon}>{d.icon}</div>
                  <div style={styles.activityInfo}>
                    <div style={styles.activityName}>{d.charity}</div>
                    <div style={styles.activityDate}>{d.date}</div>
                    {d.notes && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic', marginTop: 2 }}>📝 {d.notes}</div>}
                    {d.paymentRef && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Ref: {d.paymentRef}</div>}
                  </div>
                  <div style={styles.activityRight}>
                    <div style={styles.activityAmount}>${Number(d.amount).toLocaleString()}</div>
                    {d.paymentStatus !== 'confirmed' ? (
                      <div style={styles.badgePending}>Awaiting Confirmation</div>
                    ) : d.receipt ? (
                      <div style={styles.badgeIssued}>✓ Receipt Issued</div>
                    ) : (
                      <div style={styles.badgePending}>Pending Receipt</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



{/* ── CAUSES ── */}
{screen === 'causes' && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 20 }}>💚</div>  
              <div style={styles.name}>Causes & Events</div>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', fontStyle: 'italic' }}>Limited-time campaigns from charities that need your help</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              {['All', '⏰ Ending Soon', '✨ New', '🔥 Almost Funded', '💰 Big Goal'].map(f => (
                <div
                  key={f}
                  style={{
                    ...(causeFilter === f ? styles.pillActive : styles.pill),
                    fontSize: 11, padding: '5px 12px',
                  }}
                  onClick={() => setCauseFilter(f)}
                >{f}</div>
              ))}
            </div>
          </div>
          <div style={styles.scrollArea}>
            {causes.length === 0 ? (
              <div style={styles.emptyState}>No active causes right now. Check back soon!</div>
            ) : (
              <div style={{ padding: '8px 16px 24px' }}>
                {causes.filter(cause => {
                  const daysLeft = cause.end_date ? Math.ceil((new Date(cause.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
                  const raised = cause.raised_total || 0
                  const progress = cause.target_amount > 0 ? (raised / cause.target_amount) * 100 : 0
                  const ageInDays = Math.ceil((new Date() - new Date(cause.created_at)) / (1000 * 60 * 60 * 24))
                  if (causeFilter === '⏰ Ending Soon') return daysLeft !== null && daysLeft <= 7
                  if (causeFilter === '✨ New') return ageInDays <= 7
                  if (causeFilter === '🔥 Almost Funded') return progress >= 75
                  if (causeFilter === '💰 Big Goal') return cause.target_amount >= 10000
                  return true
                }).map(cause => {
                  const daysLeft = cause.end_date ? Math.ceil((new Date(cause.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
                  const raised = cause.raised_total || 0
                  const progress = cause.target_amount > 0 ? Math.min((raised / cause.target_amount) * 100, 100) : 0
                  return (
                    <div key={cause.id} style={{ background: C.white, borderRadius: 20, border: `1.5px solid ${C.border}`, marginBottom: 16, overflow: 'hidden' }}>
                      {/* Header */}
                      <div style={{ background: C.forest, padding: '20px 18px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 18, width: 28, height: 28, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {liveCharities.find(c => c.uen === cause.charity_uen)?.icon || cause.charity_name?.charAt(0).toUpperCase() || '💚'}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{cause.charity_name}</div>
                        </div>
                          {daysLeft !== null && (
                            <div style={{
                              background: daysLeft <= 3 ? C.red : daysLeft <= 7 ? '#A07010' : C.sage,
                              color: 'white', fontSize: 11, fontWeight: 700,
                              padding: '3px 10px', borderRadius: 20
                            }}>
                              {daysLeft <= 0 ? 'Ended' : daysLeft === 1 ? 'Last day!' : `${daysLeft} days left`}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: 6 }}>{cause.title}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{cause.description}</div>
                      </div>
                      {/* Progress */}
                      <div style={{ padding: '16px 18px' }}>
                        {cause.target_amount > 0 && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>${raised.toLocaleString()} raised</span>
                              <span style={{ fontSize: 13, color: C.textMuted }}>of ${cause.target_amount.toLocaleString()}</span>
                            </div>
                            <div style={{ background: C.ivoryDark, borderRadius: 10, height: 8, overflow: 'hidden', marginBottom: 12 }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${C.sage}, ${C.gold})`, borderRadius: 10, transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>{progress.toFixed(0)}% of goal reached</div>
                          </>
                        )}
                        <button
                          style={{ ...styles.payBtn, margin: 0, width: '100%', background: C.gold, color: C.forest, fontWeight: 800 }}
                          onClick={() => {
                            const c = liveCharities.find(c => c.uen === cause.charity_uen) || { name: cause.charity_name, uen: cause.charity_uen, icon: '💚' }
                            setSelectedCharity(c)
                            setSelectedCause(cause)
                            setAmount('')
                            setPaymentRef('')
                            setDonationNote('')
                            goTo('donate')
                          }}
                        >
                          Donate to this Cause
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BROWSE ── */}
      {screen === 'browse' && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={styles.name}>Find a Charity</div>
          </div>
          <div style={{ position: 'relative', margin: '0 16px 12px', flexShrink: 0 }}>
            <input  
              style={{ ...styles.searchInput, margin: 0, width: '100%', paddingRight: 40 }}
              placeholder="🔍 Search charities..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onBlur={() => {
                const hasResults = liveCharities.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                if (hasResults) addRecentSearch(searchTerm)
              }}
            />
            {searchTerm !== '' && (
              <div
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.textMuted, cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}
                onClick={() => setSearchTerm('')}
              >✕</div>
            )}
          </div>
          {searchTerm === '' && recentSearches.length > 0 && (
            <div style={{ padding: '0 16px 12px' }}>
              <div style={styles.recentLabel}>Recent Searches</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {recentSearches.map((s, i) => (
                  <div key={i} style={styles.recentChip} onClick={() => setSearchTerm(s)}>🕐 {s}</div>
                ))}
              </div>
            </div>
          )}
          <div style={styles.pills}>
            {dynamicCategories.map(cat => (
              <div key={cat} style={cat === selectedCat ? styles.pillActive : styles.pill} onClick={() => setSelectedCat(cat)}>{cat}</div>
            ))}
          </div>  
          <div style={styles.charityList}>
            {charitiesLoading && <div style={styles.emptyState}>Loading charities...</div>}
            {!charitiesLoading && filteredCharities.map(c => (
              <div key={c.id} style={styles.charityRow}>
                <div style={styles.charityIcon} onClick={() => { addRecentSearch(searchTerm); setSelectedCharity(c); setSelectedCause(null); setAmount(''); setPaymentRef(''); setDonationNote(''); goTo('donate') }}>{c.icon}</div>
                <div style={styles.charityInfo} onClick={() => { addRecentSearch(searchTerm); setSelectedCharity(c); setSelectedCause(null); setAmount(''); setPaymentRef(''); setDonationNote(''); goTo('donate') }}>
                  <div style={styles.charityName}>{c.name}</div>
                  <div style={styles.charityCat}>{c.cat} · {c.ipc ? 'IPC Registered' : 'Registered Charity'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={() => toggleFavourite(c)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, opacity: favourites.find(f => f.uen === c.uen) ? 1 : 0.3 }}>❤️</div>
                    <div style={{ fontSize: 9, color: favourites.find(f => f.uen === c.uen) ? C.red : C.border, fontWeight: 600 }}>
                      {favourites.find(f => f.uen === c.uen) ? 'Saved' : 'Save'}
                    </div>
                  </div>
                  <div style={styles.arrow} onClick={() => { setSelectedCharity(c); setSelectedCause(null); setAmount(''); setPaymentRef(''); setDonationNote(''); goTo('donate') }}>›</div>
                </div>
              </div>
            ))}
          </div>
          {!charitiesLoading && filteredCharities.length === 0 && searchTerm !== '' && (
            <div style={{ margin: '8px 0 24px', background: '#EEF6F1', border: `1.5px solid ${C.sageLight}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 4 }}>Can't find your charity?</div>
              <div style={{ fontSize: 12, color: C.sage, marginBottom: 12, lineHeight: 1.5 }}>We're always adding new charities. Let us know which one you'd like to see.</div>
              <button
                style={{ padding: '10px 20px', background: C.sage, color: C.white, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => window.location.href = `mailto:hello@givingtree.sg?subject=Add a Charity&body=Hi, I would like to suggest adding the following charity:%0A%0ACharity Name: ${encodeURIComponent(searchTerm)}%0AUEN:%0AWebsite:%0A%0AThank you!`}
              >✉️ Suggest a Charity for us</button>
            </div>
          )}
        </div>
      )}

      {/* ── DONATE ── */}
      {screen === 'donate' && selectedCharity && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={styles.backBtn} onClick={() => goTo('browse')}>←</span>
              <div style={styles.name}>Donate</div>
            </div>
          </div>
          <div style={styles.scrollArea}>
            {selectedCause && (
              <div style={{ margin: '10px 16px 0', background: '#FDF8EC', border: '1.5px solid #E8CC7A', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#A07010', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Donating to Cause</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginTop: 2 }}>{selectedCause.title}</div>
                </div>
                <span style={{ fontSize: 11, color: '#A07010', textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }} onClick={() => setSelectedCause(null)}>Remove</span>
              </div>
            )}
            <div style={styles.donateCard}>
              <div style={styles.donateIcon}>{selectedCharity.icon}</div>
              <div>
                <div style={styles.donateName}>{selectedCharity.name}</div>
                <div style={styles.donateUen}>UEN: {selectedCharity.uen}</div>
                <div style={styles.ipcBadge}>{selectedCharity.ipc ? '✓ IPC Registered' : '✓ Registered Charity'}</div>
                {getCharityIpcState(selectedCharity.uen) === 'unknown' && (
                  <div style={{ fontSize: 10, color: '#A07010', marginTop: 4, lineHeight: 1.4 }}>⚠ IPC status pending verification for this charity — tax deductibility will be confirmed before any receipt is issued.</div>
                )}
                {getCharityIpcState(selectedCharity.uen) === 'ipc' && (
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, lineHeight: 1.4 }}>IPC status means donations here qualify for Singapore's 250% tax deduction.</div>
                )}
              </div>
            </div>
            <div style={styles.amountSection}>
              <div style={styles.amountLabel}>Choose Amount (SGD)</div>
              <div style={styles.presets}>
                {[10, 25, 50, 100].map(p => (
                  <div key={p} style={amount == p ? styles.presetActive : styles.preset} onClick={() => setAmount(p.toString())}>${p}</div>
                ))}
              </div>
              <div style={styles.inputWrap}>
                <span style={styles.inputCurrency}>SGD</span>
                <input style={styles.amountInput} type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => {
                  const val = e.target.value
                  if (val.includes('.') && val.split('.')[1]?.length > 2) return
                  setAmount(val)
                }} onBlur={e => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val > 0) setAmount(val.toFixed(2))
                }} />
              </div>
            </div>
            {getCharityIpcState(selectedCharity.uen) === 'ipc' ? (
              <div style={styles.taxPreview}>
                💡 Est. tax savings: <strong>${taxSaving}*</strong> (assumes 22% tax rate; your actual savings depend on your income tax bracket)
              </div>
            ) : getCharityIpcState(selectedCharity.uen) === 'unknown' ? (
              <div style={{ ...styles.taxPreview, background: '#FDF3DC', border: '1.5px solid #E8CC7A', color: '#A07010' }}>
                ⚠️ We're still verifying this charity's IPC status. We'll confirm tax-deductibility before issuing your receipt.
              </div>
            ) : (
              <div style={{ ...styles.taxPreview, background: C.ivoryDark, border: `1.5px solid ${C.border}`, color: C.textMuted }}>
                ℹ️ This charity is registered but not an IPC, so this donation isn't tax-deductible.
              </div>
            )}

            <div style={{ margin: '0 16px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Referral / Note (Optional)</div>
              <input
                style={{ ...styles.searchInput, margin: 0, width: '100%' }}
                placeholder="e.g. Referred by John Tan"
                value={donationNote}
                onChange={e => setDonationNote(e.target.value)}
                maxLength={200}
              />
            </div>

            <button style={{ ...styles.payBtn, background: C.gold, color: C.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 16 }} onClick={async () => {
              if (!amount || parseFloat(amount) <= 0) { showToast('Please enter a donation amount.'); return }
              if (selectedCharity.ipc && !hasNric) {
                const proceedWithoutNric = await showConfirm({
                  title: 'No NRIC on File',
                  body: `${selectedCharity.name} won't be able to submit this donation to IRAS for your 250% tax deduction. Add your NRIC in Profile first, or continue without it.`,
                  confirmLabel: 'Continue Without NRIC',
                  cancelLabel: 'Go to Profile',
                })
                if (!proceedWithoutNric) {
                  setAmount('')
                  setDonationNote('')
                  setPaymentRef('')
                  goTo('profile')
                  return
                }
              }
              if (parseFloat(amount) >= 1000) {
                const confirmedLargeAmount = await showConfirm({
                  title: 'Confirm Large Donation',
                  body: `You're about to donate SGD $${parseFloat(amount).toLocaleString()} to ${selectedCharity.name}. Please confirm this is correct before proceeding.`,
                  confirmLabel: 'Confirm & Continue',
                  cancelLabel: 'Go Back',
                })
                if (!confirmedLargeAmount) return
              }
              const ref = 'GT' + Math.random().toString(36).substring(2, 10).toUpperCase()
              setPaymentRef(ref)
              await createPendingDonation(ref)
              goTo('qr')
            }}>
              Generate PayNow QR Code
            </button>
            <div style={{ height: 12 }} />
          </div>
        </div>
      )}

      {/* ── PAYNOW QR ── */}
      {screen === 'qr' && selectedCharity && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={styles.backBtn} onClick={async () => {
                if (pendingDonationId) {
                  const alreadyPaid = await showConfirm({
                    title: 'Have you already paid?',
                    body: "If you've already sent payment via PayNow, don't go back — tap \"I've Completed Payment\" instead. Going back will cancel this donation.",
                    confirmLabel: "I haven't paid, cancel it",
                    cancelLabel: 'Stay here',
                  })
                  if (!alreadyPaid) return
                  await supabase
                    .from('donations')
                    .update({ status: 'cancelled_by_donor' })
                    .eq('id', pendingDonationId)
                    .eq('status', 'awaiting_donor_confirmation')
                  setPendingDonationId(null)
                  setSelectedCause(null)
                }
                setPaymentRef('')
                setDonationNote('')
                goTo('donate')
              }}>←</span>
              <div style={styles.name}>Scan to Pay</div>
            </div>
          </div>
          <div style={{ ...styles.scrollArea, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 24px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.forest, marginBottom: 2, textAlign: 'center' }}>{selectedCharity.name}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.forest, marginBottom: 12, textAlign: 'center' }}>SGD ${amount}</div>
            <div style={{ background: C.white, borderRadius: 20, padding: 16, border: `1.5px solid ${C.border}`, marginBottom: 12 }}>
              <QRCodeSVG id="qr-code-svg" value={`https://www.paynow.com.sg/pay?uen=${selectedCharity.uen}&amount=${amount}&ref=${paymentRef}`} size={150} level="H" />
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 10, lineHeight: 1.5 }}>
              Open your <strong style={{ color: C.forest }}>banking app</strong> and scan this QR code
            </div>
            <div style={{ background: '#EEF6F1', border: `1.5px solid ${C.sageLight}`, borderRadius: 12, padding: '8px 16px', fontSize: 11, color: C.sage, marginBottom: 14, textAlign: 'center', width: '100%' }}>
              💡 Paying to UEN: <strong>{selectedCharity.uen}</strong><br/>
              Reference: <strong>{paymentRef}</strong>
            </div>
            <div style={{ width: '100%', background: '#FDF3DC', border: '1.5px solid #E8CC7A', borderRadius: 12, padding: '10px 14px', marginBottom: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#A07010' }}>⚠ Last step</div>
              <div style={{ fontSize: 11, color: '#A07010', lineHeight: 1.4, marginTop: 2 }}>After you pay in your banking app, come back and tap below — your donation isn't recorded until you confirm.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <button style={{ ...styles.payBtn, margin: 0, width: '100%', padding: 16, opacity: submitting ? 0.6 : 1, fontSize: 17 }} onClick={handleDonate} disabled={submitting}>{submitting ? 'Saving...' : "✓ I've Completed Payment"}</button>
              <div style={{ textAlign: 'center', fontSize: 12, color: C.sage, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: '4px 0' }} onClick={saveQR}>💾 Save QR code image instead</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {screen === 'success' && (
        <div style={{ ...styles.screen, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: C.forest }}>Thank You!</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.sage, marginBottom: 8 }}>${amount}</div>
          <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 16 }}>donated to {selectedCharity?.name}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
            Your receipt will appear once issued by the charity.
          </div>
          <button style={{ ...styles.payBtn, marginBottom: 12, background: C.sage }} onClick={() => shareOnSocial({ charity: selectedCharity?.name, amount: parseFloat(amount) })}>
            📲 Share My Donation
          </button>
          <button style={styles.payBtn} onClick={() => { setAmount(''); setSelectedCharity(null); setSelectedCause(null); goTo('home') }}>Back to Home</button>
        </div>
      )}

      {/* ── RECEIPTS ── */}
      {screen === 'receipts' && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={styles.name}>My Receipts</div>
          </div>
          <div style={styles.scrollArea}>
            <div style={styles.taxSummary}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Total Donated</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.white }}>${totalDonated.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>${(totalDonated * 2.5 * 0.22).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>est. tax saved*</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
            <select style={styles.filterSelect} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="All">All Years</option>
                {[...new Set(donations.map(d => d.year))].sort((a,b) => b-a).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select style={styles.filterSelect} value={filterCharity} onChange={e => setFilterCharity(e.target.value)}>
                <option value="All">All Charities</option>
                {uniqueCharities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '0 16px 16px' }}>
              <button style={{ ...styles.exportBtn, margin: 0, flex: 1, opacity: exporting ? 0.6 : 1 }} onClick={exportIRASPDF} disabled={exporting}>{exporting ? '⏳ Exporting...' : '📄 PDF'}</button>
              <button style={{ ...styles.exportBtn, margin: 0, flex: 1, opacity: exporting ? 0.6 : 1 }} onClick={exportIRASExcel} disabled={exporting}>{exporting ? '⏳ Exporting...' : '📊 Excel'}</button>
            </div>
            <div style={{ padding: '0 16px 4px', fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>
              *Estimated tax savings assume a flat 22% rate for illustration only. Singapore's actual personal income tax is progressive — your real savings depend on your income tax bracket and may be lower.
            </div>
            <div style={{ padding: '0 16px 24px' }}>
              {filteredDonations.length === 0 && (
                <div style={styles.emptyState}>No donations found.</div>
              )}
              {filteredDonations.map(d => (
                <div key={d.id} style={styles.receiptItem}>
                  <div style={styles.receiptIcon}>{d.icon}</div>
                  <div style={styles.receiptInfo}>
                    <div style={styles.receiptName}>{d.charity}</div>
                    <div style={styles.receiptDate}>{d.date}</div>
                    {d.notes && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic', marginTop: 2 }}>📝 {d.notes}</div>}
                    {d.paymentRef && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Ref: {d.paymentRef}</div>}
                  </div>
                  <div style={styles.activityRight}>
                  <div style={styles.activityAmount}>${Number(d.amount).toLocaleString()}</div>
                  {d.paymentStatus !== 'confirmed' ? <div style={styles.badgePending}>Awaiting Confirmation</div> : !d.receipt && <div style={styles.badgePending}>Pending Receipt</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
                    {d.receipt && (
                      <div style={{ ...styles.badgeIssued, opacity: exporting ? 0.6 : 1, cursor: exporting ? 'default' : 'pointer' }} onClick={() => { if (!exporting) exportSingleReceiptPDF(d) }}>📄 View Receipt</div>
                    )}
                    {d.canCancel && (
                      <div
                        style={{ fontSize: 10, fontWeight: 600, color: C.red, background: '#FBE9E7', padding: '2px 8px', borderRadius: 8, cursor: 'pointer' }}
                        onClick={async () => {
                          const confirmed = await showConfirm({ title: 'Cancel this donation?', body: 'This cannot be undone.', confirmLabel: 'Cancel Donation', cancelLabel: 'Keep It' })
                          if (confirmed) cancelDonation(d.id)
                        }}
                      >✕ Cancel</div>
                    )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE ── */}
      {screen === 'profile' && (
        <div style={{ ...styles.screen, minWidth: '100%' }}>
          <div style={styles.fixedHeader}>
            <div style={styles.name}>My Profile</div>
          </div>
          <div style={{ ...styles.scrollArea, padding: '0 16px 24px', width: '100%', boxSizing: 'border-box' }}>

            {/* Compact profile card */}
            <div style={{ background: C.teal, borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, background: C.sage, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {donorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{donorName}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{session?.user?.email}</div>
              </div>
            </div>

            {profileMsg !== '' && (
              <div style={{ background: '#EEF6F1', color: C.forest, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{profileMsg}</div>
            )}

            {!session?.user?.email_confirmed_at && (
              <div style={{ background: '#FDF3DC', border: '1.5px solid #E8CC7A', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#A07010', marginBottom: 4 }}>⚠️ Email Not Verified</div>
                <div style={{ fontSize: 12, color: '#A07010', marginBottom: 10, lineHeight: 1.5 }}>You need to verify your email before you can donate. Check your inbox for a confirmation link.</div>
                <button
                  style={{ background: '#A07010', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={resendVerificationEmail}
                >Resend Verification Email</button>
              </div>
            )}

            {/* Name + NRIC row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={styles.fieldLabel}>Full Name</div>
                <input style={styles.profileInput} placeholder="As per NRIC" value={profileName} onChange={e => setProfileName(e.target.value)} />
              </div>
              <div>
                <div style={styles.fieldLabel}>NRIC / FIN</div>
                {hasNric && !editingNric ? (
                  <div style={{ ...styles.profileInput, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default' }}>
                    <span>{profileNric}</span>
                    <span style={{ color: C.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => { setProfileNric(''); setEditingNric(true) }}>Edit</span>
                  </div>
                ) : (
                  <>
                    <input style={styles.profileInput} placeholder={editingNric ? 'Re-enter full NRIC to update' : 'e.g. S1234567A'} value={profileNric} onChange={e => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      setProfileNric(val)
                    }} maxLength={9} />
                    {editingNric && (
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>For security, please type your full NRIC again — it can't be pre-filled.</div>
                    )}
                    {profileNric.length > 0 && profileNric.length < 9 && (
                      <div style={{ fontSize: 10, color: C.red, marginTop: 3 }}>Must be 9 characters</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Email + Goal row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={styles.fieldLabel}>Email</div>
                <div style={{ ...styles.profileInput, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, fontSize: 12 }}>{session?.user?.email}</div>
              </div>
              <div>
                <div style={styles.fieldLabel}>Giving Goal (SGD)</div>
                <input style={styles.profileInput} type="text" value={profileGoalInput} onChange={e => {
                  setProfileGoalInput(e.target.value.replace(/[^0-9]/g, ''))
                }} onBlur={() => {
                  const g = parseInt(profileGoalInput) || 0
                  if (g !== givingGoal) saveGivingGoal(g)
                  setProfileGoalInput(g.toLocaleString())
                }} />
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginBottom: 16 }}>🔒 NRIC is masked and stored securely for IRAS tax deductions</div>

            <button style={{ ...styles.payBtn, margin: 0, width: '100%', marginBottom: 10, opacity: savingProfile ? 0.6 : 1 }} onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Changes'}</button>
            <button style={{ ...styles.payBtn, margin: 0, width: '100%', background: C.red, marginBottom: 24 }} onClick={() => { localStorage.removeItem('giveback_searches'); localStorage.removeItem('giveback_screen'); setRecentSearches([]); supabase.auth.signOut() }}>Sign Out</button>

            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2D9CC', padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 8 }}>Account</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                To delete your Giving Tree account and all associated data, email us at <span style={{ color: C.forest, fontWeight: 600 }}>hello@givingtree.sg</span> with the subject line "Account Deletion Request". We will process your request within 7 business days.
              </div>
              <a href={`mailto:hello@givingtree.sg?subject=Account Deletion Request&body=Please delete my Giving Tree donor account (email: ${session?.user?.email}).`}
                style={{ fontSize: 12, fontWeight: 700, color: C.red, textDecoration: 'none', display: 'inline-block', padding: '8px 14px', border: `1.5px solid ${C.red}`, borderRadius: 10, background: '#FBE9E7' }}>
                🗑️ Request Account Deletion
              </a>
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: C.textMuted, lineHeight: 2, paddingBottom: 8 }}>
              <a href="https://givingtree.sg/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.textMuted, textDecoration: 'underline' }}>Privacy Policy</a>
              {' · '}
              <a href="https://givingtree.sg/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.textMuted, textDecoration: 'underline' }}>Terms of Use</a>
            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARDING OVERLAY ── */}
      {showOnboarding && screen === 'home' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,36,25,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: '24px 24px 0 0', padding: '28px 24px', width: '100%', maxWidth: 430, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, justifyContent: 'center' }}>
              {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === onboardingStep ? C.sage : C.border, transition: 'background 0.2s' }} />
              ))}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.forest, marginBottom: 8, textAlign: 'center' }}>{ONBOARDING_STEPS[onboardingStep].title}</div>
            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>{ONBOARDING_STEPS[onboardingStep].body}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {onboardingStep > 0 && (
                <button style={{ ...styles.payBtn, margin: 0, flex: 1, background: C.ivoryDark, color: C.forest }} onClick={() => setOnboardingStep(s => s - 1)}>Back</button>
              )}
              <button style={{ ...styles.payBtn, margin: 0, flex: 1, background: C.sage }} onClick={() => {
                if (onboardingStep < ONBOARDING_STEPS.length - 1) setOnboardingStep(s => s + 1)
                else finishOnboarding()
              }}>{onboardingStep < ONBOARDING_STEPS.length - 1 ? 'Next' : "Let's Go!"}</button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <span style={{ fontSize: 12, color: C.textMuted, cursor: 'pointer', textDecoration: 'underline' }} onClick={finishOnboarding}>Skip</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,36,25,0.75)', zIndex: 998, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: '24px 24px 0 0', padding: '28px 24px', width: '100%', maxWidth: 430, boxSizing: 'border-box' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.forest, marginBottom: 8, textAlign: 'center' }}>{confirmModal.title}</div>
            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>{confirmModal.body}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...styles.payBtn, margin: 0, flex: 1, background: C.ivoryDark, color: C.forest }} onClick={confirmModal.onCancel}>{confirmModal.cancelLabel}</button>
              <button style={{ ...styles.payBtn, margin: 0, flex: 1, background: C.sage }} onClick={confirmModal.onConfirm}>{confirmModal.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? C.sage : C.red,
          color: 'white', padding: '14px 20px', borderRadius: 14,
          fontSize: 13, fontWeight: 600, zIndex: 999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 12,
          maxWidth: 'calc(100% - 48px)', width: 360,
        }}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.msg}</span>
          <span
            onClick={() => setToast(null)}
            style={{ cursor: 'pointer', opacity: 0.8, fontSize: 16, lineHeight: 1, flexShrink: 0 }}
          >✕</span>
        </div>
      )}

      {/* ── GLOBAL BOTTOM NAV ── */}
      <div style={styles.bottomNav}>
        <div style={{ ...styles.navTab, ...(screen === 'home' ? styles.navTabActive : {}) }} onClick={() => goTo('home')}>
          <div>🏠</div><div style={{ ...styles.navLabel, ...(screen === 'home' ? { color: C.sage } : {}) }}>Home</div>
        </div>
        <div style={{ ...styles.navTab, ...(screen === 'browse' ? styles.navTabActive : {}) }} onClick={() => goTo('browse')}>
          <div>🔍</div><div style={{ ...styles.navLabel, ...(screen === 'browse' ? { color: C.sage } : {}) }}>Browse</div>
        </div>
        <div style={{ ...styles.navTab, ...(screen === 'causes' ? styles.navTabActive : {}) }} onClick={() => goTo('causes')}>
          <div>💚</div><div style={{ ...styles.navLabel, ...(screen === 'causes' ? { color: C.sage } : {}) }}>Causes</div>
        </div>
        <div style={{ ...styles.navTab, ...(screen === 'receipts' ? styles.navTabActive : {}) }} onClick={() => goTo('receipts')}>
          <div>🧾</div><div style={{ ...styles.navLabel, ...(screen === 'receipts' ? { color: C.sage } : {}) }}>Receipts</div>
        </div>
        <div style={{ ...styles.navTab, ...(screen === 'profile' ? styles.navTabActive : {}) }} onClick={() => goTo('profile')}>
          <div>👤</div><div style={{ ...styles.navLabel, ...(screen === 'profile' ? { color: C.sage } : {}) }}>Profile</div>
        </div>
      </div>

    </div>
    </div>
  )
}

const styles = {
  app: { width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#FAF7F2', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden', alignSelf: 'stretch', overscrollBehavior: 'none', margin: '0 auto' },
  screen: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', width: '100%' },
  fixedHeader: { padding: '24px 20px 16px', background: '#FAF7F2', flexShrink: 0 },
  scrollArea: { flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'auto', width: '100%' },
  quote: { fontSize: 11, color: '#40916C', fontWeight: 600, fontStyle: 'italic', textAlign: 'center' },
  name: { fontSize: 22, fontWeight: 800, color: '#1B4332', textAlign: 'center' },
  backBtn: { fontSize: 18, fontWeight: 700, color: '#1B4332', cursor: 'pointer' },

  // HERO CARD — sage green with dark text
  card: { margin: '0 16px 16px', background: '#1B4332', borderRadius: 20, padding: 20 },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  cardAmount: { fontSize: 34, fontWeight: 800, letterSpacing: -1, color: '#FFFFFF' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)' },
  cardStat: { fontSize: 18, fontWeight: 700, color: '#FFFFFF' },
  cardStatLabel: { fontSize: 14, fontWeight: 500, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 },
  taxBadge: { background: '#D4A017', color: '#1B4332', fontSize: 10, fontWeight: 700, padding: '5px 9px', borderRadius: 20, whiteSpace: 'nowrap' },

  // GOAL CARD
  goalCard: { margin: '0 16px 16px', background: '#FFFFFF', borderRadius: 16, padding: 16, border: '1.5px solid #E2D9CC' },
  goalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalTitle: { fontSize: 13, fontWeight: 700, color: '#1B4332' },
  goalEdit: { fontSize: 12, color: '#40916C', fontWeight: 600, cursor: 'pointer' },
  goalInput: { width: 80, padding: '4px 8px', border: '1.5px solid #E2D9CC', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' },
  goalBarBg: { background: '#F0EBE1', borderRadius: 10, height: 10, overflow: 'hidden', marginBottom: 6 },
  goalMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7A6E62' },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 10px' },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#1B4332' },
  sectionMeta: { fontSize: 12, color: '#7A6E62' },

  favScroll: { display: 'flex', gap: 10, padding: '0 16px 16px', overflowX: 'auto', scrollbarWidth: 'none' },
  favCard: { background: '#FFFFFF', border: '1.5px solid #E2D9CC', borderRadius: 16, padding: 14, minWidth: 120, flexShrink: 0, cursor: 'pointer' },
  favName: { fontSize: 11, fontWeight: 600, color: '#1B4332', lineHeight: 1.3, marginBottom: 8 },
  favBtn: { background: '#40916C', color: 'white', fontSize: 11, fontWeight: 700, padding: '5px 8px', borderRadius: 8, textAlign: 'center' },

  emptyState: { textAlign: 'center', color: '#7A6E62', fontSize: 13, padding: '40px 0' },

  activityItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F0EBE1' },
  activityIcon: { width: 40, height: 40, background: '#EEF6F1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 13, fontWeight: 600, color: '#1B4332', textAlign: 'left' },
  activityDate: { fontSize: 11, color: '#7A6E62', marginTop: 2, textAlign: 'left' },
  activityRight: { textAlign: 'right' },
  activityAmount: { fontSize: 14, fontWeight: 700, color: '#1B4332' },
  badgeIssued: { fontSize: 10, fontWeight: 600, color: '#40916C', background: '#EEF6F1', padding: '2px 8px', borderRadius: 8, marginTop: 3, display: 'inline-block' },
  badgePending: { fontSize: 10, fontWeight: 600, color: '#A07010', background: '#FDF3DC', padding: '2px 8px', borderRadius: 8, marginTop: 3, display: 'inline-block' },

  bottomNav: { display: 'flex', borderTop: '1px solid #E2D9CC', background: '#FFFFFF', padding: '8px 0', flexShrink: 0, zIndex: 10, width: '100%' },
  navTab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0', cursor: 'pointer', fontSize: 20 },
  navTabActive: { color: '#40916C' },
  navLabel: { fontSize: 10, fontWeight: 600, color: '#7A6E62' },

  searchInput: { margin: '0 16px 12px', padding: '12px 16px', border: '1.5px solid #E2D9CC', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 'calc(100% - 32px)', flexShrink: 0, background: '#FFFFFF', color: '#1C1C1C' },
  recentLabel: { fontSize: 11, color: '#7A6E62', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  recentChip: { padding: '5px 12px', background: '#F0EBE1', borderRadius: 20, fontSize: 12, color: '#7A6E62', cursor: 'pointer', border: '1px solid #E2D9CC' },

  pills: { display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' },
  pill: { padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: '1.5px solid #E2D9CC', background: '#FFFFFF', color: '#7A6E62', flexShrink: 0 },
  pillActive: { padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: '1.5px solid #1B4332', background: '#1B4332', color: 'white', flexShrink: 0 },

  charityList: { flex: 1, padding: '0 16px', overflowY: 'auto', minHeight: 0 },
  charityRow: { display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#FFFFFF', borderRadius: 14, marginBottom: 10, border: '1.5px solid #E2D9CC' },
  charityIcon: { fontSize: 28, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2', borderRadius: 12, flexShrink: 0, cursor: 'pointer' },
  charityInfo: { flex: 1, cursor: 'pointer' },
  charityName: { fontSize: 13, fontWeight: 700, color: '#1B4332' },
  charityCat: { fontSize: 11, color: '#7A6E62', marginTop: 2 },
  arrow: { fontSize: 20, color: '#E2D9CC', cursor: 'pointer' },

  donateCard: { margin: '10px 16px', background: '#FFFFFF', borderRadius: 18, padding: 14, border: '1.5px solid #E2D9CC', display: 'flex', alignItems: 'center', gap: 14 },
  donateIcon: { fontSize: 32, width: 52, height: 52, background: '#FAF7F2', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  donateName: { fontSize: 15, fontWeight: 700, color: '#1B4332' },
  donateUen: { fontSize: 11, color: '#7A6E62', marginTop: 3 },
  ipcBadge: { display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 600, color: '#40916C', background: '#EEF6F1', padding: '3px 8px', borderRadius: 10 },

  amountSection: { padding: '0 16px 10px' },
  amountLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#7A6E62', marginBottom: 10 },
  presets: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 },
  preset: { padding: '10px 6px', background: '#FFFFFF', border: '1.5px solid #E2D9CC', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', cursor: 'pointer', color: '#1B4332' },
  presetActive: { padding: '10px 6px', background: '#1B4332', border: '1.5px solid #1B4332', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', cursor: 'pointer', color: 'white' },
  inputWrap: { display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1.5px solid #E2D9CC', borderRadius: 12, overflow: 'hidden' },
  inputCurrency: { padding: '0 14px', fontSize: 16, fontWeight: 700, color: '#7A6E62', borderRight: '1.5px solid #E2D9CC', height: 52, display: 'flex', alignItems: 'center', background: '#FAF7F2' },
  amountInput: { flex: 1, padding: '0 16px', height: 52, border: 'none', outline: 'none', fontSize: 26, fontWeight: 800, color: '#1B4332', background: 'transparent', width: 0 },

  taxPreview: { margin: '0 16px 10px', background: '#FDF8EC', border: '1.5px solid #E8CC7A', borderRadius: 12, padding: '10px 16px', fontSize: 12, color: '#A07010', lineHeight: 1.4 },
 
  payBtn: { margin: '0 16px', padding: 18, background: '#1B4332', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', width: 'calc(100% - 32px)', fontFamily: 'inherit' },

  taxSummary: { margin: '0 16px 12px', background: '#1A3C34', borderRadius: 18, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  filterSelect: { flex: 1, padding: '8px 12px', border: '1.5px solid #E2D9CC', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#FFFFFF', color: '#1C1C1C' },
  exportBtn: { margin: '0 16px 16px', padding: '12px', background: '#FFFFFF', border: '1.5px solid #E2D9CC', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#1B4332', textAlign: 'center', display: 'block', fontFamily: 'inherit' },

  receiptItem: { display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#FFFFFF', borderRadius: 14, marginBottom: 10, border: '1.5px solid #E2D9CC' },
  receiptIcon: { fontSize: 22, width: 40, height: 40, background: '#FAF7F2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  receiptInfo: { flex: 1, textAlign: 'left' },
  receiptName: { fontSize: 13, fontWeight: 600, color: '#1B4332', textAlign: 'left' },
  receiptDate: { fontSize: 11, color: '#7A6E62', marginTop: 2, textAlign: 'left' },

  profileCard: { background: '#1A3C34', borderRadius: 20, padding: 24, marginBottom: 24, textAlign: 'center', color: 'white', width: '100%', boxSizing: 'border-box' },
  profileAvatar: { width: 64, height: 64, background: '#40916C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, margin: '0 auto 12px', color: 'white' },
  profileName: { fontSize: 18, fontWeight: 800, marginBottom: 4, color: 'white' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  fieldLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#7A6E62', marginBottom: 6, marginTop: 4 },
  profileInput: { width: '100%', padding: '12px 16px', border: '1.5px solid #E2D9CC', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 6, boxSizing: 'border-box', background: '#FFFFFF', color: '#1C1C1C', textAlign: 'center', display: 'block' },
}