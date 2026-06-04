import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from './assets/logo.png'
import * as XLSX from 'xlsx'
import './App.css'

const CHARITIES = [
  { id: 1, name: "Food Bank Singapore", cat: "Relief", icon: "🥫", uen: "T12CC0035G", desc: "Fighting hunger by redistributing surplus food." },
  { id: 2, name: "SPCA Singapore", cat: "Animals", icon: "🐾", uen: "T08CC0104K", desc: "Animal welsrc/assets/logo.pnfare, rescue and responsible ownership." },
  { id: 3, name: "Singapore Cancer Society", cat: "Health", icon: "🎗️", uen: "196900494K", desc: "Cancer awareness, patient support and research." },
  { id: 4, name: "National Kidney Foundation", cat: "Health", icon: "💙", uen: "199603200Z", desc: "Subsidised dialysis and kidney disease prevention." },
  { id: 5, name: "Alzheimer's Disease Association", cat: "Health", icon: "🧠", uen: "T08CC1132A", desc: "Dementia care, support and research." },
  { id: 6, name: "Children's Cancer Foundation", cat: "Children", icon: "🎈", uen: "T04CC0026E", desc: "Holistic support for children with cancer." },
  { id: 7, name: "TOUCH Community Services", cat: "Elderly", icon: "🤝", uen: "T03CC0245J", desc: "Eldercare, family and youth services." },
  { id: 8, name: "Nature Society Singapore", cat: "Environment", icon: "🌿", uen: "T08CC0226E", desc: "Conservation of nature and biodiversity." },
  { id: 9, name: "Samaritans of Singapore", cat: "Social", icon: "📞", uen: "S72SS0056F", desc: "24/7 crisis helpline for those in distress." },
  { id: 10, name: "Dyslexia Association of Singapore", cat: "Education", icon: "📚", uen: "T08CC0067G", desc: "Support and resources for children with dyslexia." },
  { id: 11, name: "Singapore Red Cross", cat: "Relief", icon: "🆘", uen: "00218R", desc: "Humanitarian aid, blood services and disaster relief." },
  { id: 12, name: "Cat Welfare Society", cat: "Animals", icon: "🐈", uen: "T07CC0128A", desc: "Trap-neuter-return and community cat programmes." },
  { id: 13, name: "Willing Hearts", cat: "Social", icon: "🥘", uen: "T09CC0062C", desc: "Daily meals delivered to over 3,000 beneficiaries." },
  { id: 14, name: "Singapore Heart Foundation", cat: "Health", icon: "❤️", uen: "196900164W", desc: "Heart health education and cardiac patient support." },
  { id: 15, name: "Beyond Social Services", cat: "Children", icon: "🌟", uen: "T13CC0105G", desc: "Empowering youth from low-income families." },
]

const CATEGORIES = ["All", "Health", "Children", "Elderly", "Education", "Animals", "Environment", "Relief", "Social"]

const QUOTES = [
  '"Giving is not just about making a donation, it\'s about making a difference."',
  '"No act of kindness, no matter how small, is ever wasted."',
  '"We make a living by what we get, but a life by what we give."',
  '"The meaning of life is to find your gift. The purpose is to give it away."',
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
  const [screen, setScreen] = useState(localStorage.getItem('giveback_screen') || 'home')
  const [selectedCharity, setSelectedCharity] = useState(null)
  const [amount, setAmount] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [profileName, setProfileName] = useState('')
  const [profileNric, setProfileNric] = useState('')
  const [profileMsg, setProfileMsg] = useState('')
  const [favourites, setFavourites] = useState([])
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  const [filterCharity, setFilterCharity] = useState('All')
  const [givingGoal, setGivingGoal] = useState(0)
  const [editingGoal, setEditingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [recentSearches, setRecentSearches] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  function goTo(screenName) {
    localStorage.setItem('giveback_screen', screenName)
    setScreen(screenName)
  }

  useEffect(() => {
    if (session) {
      loadDonations()
      setProfileName(session.user.user_metadata?.full_name || '')
      setProfileNric(session.user.user_metadata?.nric_masked || '')
      const saved = localStorage.getItem('giveback_favourites')
      if (saved) setFavourites(JSON.parse(saved))
      const goal = localStorage.getItem('giveback_goal')
      if (goal) setGivingGoal(parseInt(goal))
      const searches = localStorage.getItem('giveback_searches')
      if (searches) setRecentSearches(JSON.parse(searches))
    }
  }, [session])

  async function loadDonations() {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_email', session.user.email)
      .order('created_at', { ascending: false })
    if (error) { console.error(error); setSubmitting(false); return }
    setDonations(data.map(d => ({
      id: d.id,
      charity: d.charity_name,
      charity_uen: d.charity_uen,
      icon: CHARITIES.find(c => c.uen === d.charity_uen)?.icon || '💚',
      amount: d.amount,
      date: new Date(d.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }),
      year: new Date(d.created_at).getFullYear().toString(),
      receipt: d.receipt_issued
    })))
  }

  function toggleFavourite(charity) {
    const isFav = favourites.find(f => f.uen === charity.uen)
    const updated = isFav
      ? favourites.filter(f => f.uen !== charity.uen)
      : [...favourites, charity]
    setFavourites(updated)
    localStorage.setItem('giveback_favourites', JSON.stringify(updated))
  }

  function addRecentSearch(term) {
    if (!term.trim()) return
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('giveback_searches', JSON.stringify(updated))
  }

  const filteredCharities = CHARITIES.filter(c => {
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
  const donorName = session?.user?.user_metadata?.full_name || session?.user?.email || 'Donor'
  const goalProgress = givingGoal > 0 ? Math.min((totalAllTime / givingGoal) * 100, 100) : 0
  const uniqueCharities = [...new Set(donations.map(d => d.charity))]
  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length]

  async function handleDonate() {
    if (!amount || parseFloat(amount) < 1) return
    if (submitting) return
    setSubmitting(true)
    const newDonation = {
      donor_name: donorName,
      donor_email: session?.user?.email,
      donor_nric: session?.user?.user_metadata?.nric || null,
      charity_name: selectedCharity.name,
      charity_uen: selectedCharity.uen,
      amount: parseFloat(amount),
      status: 'confirmed',
      payment_status: 'pending',
      receipt_issued: false,
    }
    const { data, error } = await supabase
      .from('donations')
      .insert([newDonation])
      .select()
    if (error) { console.error(error); setSubmitting(false); return }
    setDonations([{
      id: data[0].id,
      charity: selectedCharity.name,
      charity_uen: selectedCharity.uen,
      icon: selectedCharity.icon,
      amount: parseFloat(amount),
      date: new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }),
      year: new Date().getFullYear().toString(),
      receipt: false
    }, ...donations])
    setSubmitting(false)
    goTo('success')
  }

  async function saveProfile() {
    if (!profileName) { setProfileMsg('Please enter your name'); return }
    const updates = { full_name: profileName }
    if (profileNric.length === 9) {
      const validNric = /^[STFG]\d{7}[A-Z]$/.test(profileNric)
      if (!validNric) { setProfileMsg('Invalid NRIC format. Should be like S1234567A'); return }
      updates.nric_masked = profileNric.slice(0, 1) + '×××××' + profileNric.slice(-2)
      updates.nric = profileNric
    }
    const { error } = await supabase.auth.updateUser({ data: updates })
    if (error) { setProfileMsg('Error saving. Please try again.'); return }
    setProfileMsg('Profile saved successfully!')
    setTimeout(() => setProfileMsg(''), 3000)
  }

  function exportIRASPDF() {
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
    doc.text(`Tax Deductible (250%): SGD $${(totalDonated * 2.5).toFixed(2)}`, 14, 60)
    doc.text(`Est. Tax Savings (22%): SGD $${(totalDonated * 2.5 * 0.22).toFixed(2)}`, 14, 67)
    autoTable(doc, {
      startY: 76,
      head: [['Charity', 'Amount (SGD)', 'Date', 'Receipt']],
      body: filteredDonations.map(d => [d.charity, `$${d.amount.toFixed(2)}`, d.date, d.receipt ? 'Issued' : 'Pending']),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [64, 145, 108], textColor: [255, 255, 255] },
    })
    const totalY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text(`Total: SGD $${totalDonated}`, 14, totalY)
    doc.text(`250% Deductible: SGD $${(totalDonated * 2.5).toFixed(2)}`, 14, totalY + 7)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('All charities are IPC-registered. Submit with your IRAS tax return.', 14, totalY + 18)
    doc.save(`GivingTree-IRAS-${filterYear}.pdf`)
  }

  function exportIRASExcel() {
    const data = filteredDonations.map(d => ({
      'Charity': d.charity, 'Amount (SGD)': d.amount, 'Date': d.date,
      'Receipt': d.receipt ? 'Issued' : 'Pending', 'Tax Deductible (250%)': d.amount * 2.5,
    }))
    const summary = [
      {}, { 'Charity': 'SUMMARY' },
      { 'Charity': 'Donor', 'Amount (SGD)': donorName },
      { 'Charity': 'Total Donated', 'Amount (SGD)': totalDonated },
      { 'Charity': 'Tax Deductible', 'Amount (SGD)': totalDonated * 2.5 },
      { 'Charity': 'Est. Tax Savings', 'Amount (SGD)': totalDonated * 2.5 * 0.22 },
    ]
    const ws = XLSX.utils.json_to_sheet([...data, ...summary])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `IRAS ${filterYear}`)
    XLSX.writeFile(wb, `GivingTree-IRAS-${filterYear}.xlsx`)
  }

  function exportSingleReceiptPDF(donation) {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Official Donation Receipt', 14, 25)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Giving Tree Platform', 14, 35)
    doc.line(14, 40, 196, 40)
    doc.text(`Donor: ${donorName}`, 14, 52)
    doc.text(`Charity: ${donation.charity}`, 14, 62)
    doc.text(`Amount: SGD $${donation.amount.toFixed(2)}`, 14, 72)
    doc.text(`Date: ${donation.date}`, 14, 82)
    doc.line(14, 90, 196, 90)
    doc.setFont('helvetica', 'bold')
    doc.text(`Tax Deductible (250%): SGD $${(donation.amount * 2.5).toFixed(2)}`, 14, 102)
    doc.text(`Est. Tax Savings: SGD $${(donation.amount * 2.5 * 0.22).toFixed(2)}`, 14, 112)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('IPC-registered. Eligible for 250% tax deduction under Singapore tax law.', 14, 130)
    doc.save(`Receipt-${donation.charity}.pdf`)
  }

  function shareOnSocial(donation) {
    const text = `I just donated SGD $${donation.amount} to ${donation.charity} via Giving Tree! 💚 #GivingTree #Singapore`
    if (navigator.share) {
      navigator.share({ title: 'I donated via Giving Tree!', text, url: 'https://givingtree.sg' })
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Donation message copied to clipboard! Paste it anywhere to share.'))
    }
  }

  function saveQR() {
    const svg = document.querySelector('#qr-code-svg')
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
    img.src = 'data:image/svg+xml;base64,' + btoa(svgStr)
  }

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: 'Segoe UI', fontSize: 16, color: C.textMuted }}>
      Loading...
    </div>
  )

  if (!session) return <Auth />

  return (
    <div style={styles.app}>

      {/* ── HOME ── */}
      {screen === 'home' && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={styles.quote}>{todayQuote}
            <div style={{ height: 10 }} />
            <div><img src="/src/assets/logo.png" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
          </div>
            
            
            <div style={styles.name}> {(() => { const name = session?.user?.user_metadata?.full_name?.split(' ')[0]; if (!name) return 'Your'; return name.endsWith('s') ? `${name}'` : `${name}'s`; })()} Giving Journey</div>
          </div>
          <div style={styles.scrollArea}>

            {/* HERO CARD — sage green */}
            <div style={styles.card}>
            <div style={styles.cardLabel}>Total Given · {new Date().getFullYear()}</div>
              <div style={styles.cardAmount}>SGD {totalAllTime.toLocaleString()}</div>
              <div style={styles.cardBottom}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={styles.cardStat}>{donations.length}</div>
                  <div style={styles.cardStatLabel}>Donations</div>
                </div>
                <div style={styles.taxBadge}>
                250% deductible ~${(totalAllTime * 2.5 * 0.22).toLocaleString()} saved
                </div>
              </div>
            </div>

            {/* GIVING GOAL */}
            <div style={styles.goalCard}>
              <div style={styles.goalHeader}>
                <div style={styles.goalTitle}>🎯 Giving Goal</div>
                {!editingGoal ? (
                  <div style={styles.goalEdit} onClick={() => { setEditingGoal(true); setNewGoal(givingGoal.toString()) }}>Edit</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={styles.goalInput} value={newGoal} onChange={e => setNewGoal(e.target.value)} type="number" />
                    <div style={styles.goalEdit} onClick={() => { const g = parseInt(newGoal) || 1000; setGivingGoal(g); localStorage.setItem('giveback_goal', g.toString()); setEditingGoal(false) }}>Save</div>
                  </div>
                )}
              </div>
              <div style={styles.goalBarBg}>
                <div style={{ height: '100%', width: `${goalProgress}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.sage})`, borderRadius: 10, transition: 'width 0.5s', minWidth: 8 }} />
              </div>
              <div style={styles.goalMeta}>
              <span>${totalAllTime.toLocaleString()} donated</span>
              <span>{goalProgress.toFixed(0)}% of ${givingGoal.toLocaleString()}</span>
              </div>
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
                    <div key={c.uen} style={styles.favCard} onClick={() => { setSelectedCharity(c); setAmount(''); goTo('donate') }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                      <div style={styles.favName}>{c.name}</div>
                      <div style={styles.favBtn}>Give Again</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SPONSORED BANNER */}
            <div style={{ margin: '0 16px 16px', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
              <div style={{ background: C.ivoryDark, padding: '4px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Sponsored</div>
              </div>
              <div style={{ background: C.white, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ fontSize: 36, width: 56, height: 56, background: '#FFF5E6', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎗️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Featured Charity</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.forest, marginBottom: 3 }}>Singapore Cancer Society</div>
                  <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>Supporting cancer patients and their families across Singapore.</div>
                </div>
              </div>
              <div style={{ padding: '0 16px 14px' }}>
                <button
                  style={{ width: '100%', padding: '10px', background: C.gold, color: C.forest, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => { setSelectedCharity(CHARITIES.find(c => c.uen === '196900494K')); setAmount(''); goTo('donate') }}
                >
                  Donate Now
                </button>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}>Recent Activity</div>
            </div>
            <div style={{ padding: '0 16px 24px' }}>
              {donations.length === 0 && (
                <div style={styles.emptyState}>No donations yet. Browse charities to get started!</div>
              )}
              {donations.slice(0, 10).map(d => (
                <div key={d.id} style={styles.activityItem}>
                  <div style={styles.activityIcon}>{d.icon}</div>
                  <div style={styles.activityInfo}>
                    <div style={styles.activityName}>{d.charity}</div>
                    <div style={styles.activityDate}>{d.date}</div>
                  </div>
                  <div style={styles.activityRight}>
                  <div style={styles.activityAmount}>${Number(d.amount).toLocaleString()}</div>
                    
                  </div>
                </div>
              ))}
            </div>
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
              onBlur={() => addRecentSearch(searchTerm)}
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
            {CATEGORIES.map(cat => (
              <div key={cat} style={cat === selectedCat ? styles.pillActive : styles.pill} onClick={() => setSelectedCat(cat)}>{cat}</div>
            ))}
          </div>
          <div style={styles.charityList}>
            {filteredCharities.map(c => (
              <div key={c.id} style={styles.charityRow}>
                <div style={styles.charityIcon} onClick={() => { setSelectedCharity(c); setAmount(''); goTo('donate') }}>{c.icon}</div>
                <div style={styles.charityInfo} onClick={() => { setSelectedCharity(c); setAmount(''); goTo('donate') }}>
                  <div style={styles.charityName}>{c.name}</div>
                  <div style={styles.charityCat}>{c.cat} · IPC Registered</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={() => toggleFavourite(c)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, opacity: favourites.find(f => f.uen === c.uen) ? 1 : 0.3 }}>❤️</div>
                    <div style={{ fontSize: 9, color: favourites.find(f => f.uen === c.uen) ? C.red : C.border, fontWeight: 600 }}>
                      {favourites.find(f => f.uen === c.uen) ? 'Saved' : 'Save'}
                    </div>
                  </div>
                  <div style={styles.arrow} onClick={() => { setSelectedCharity(c); setAmount(''); goTo('donate') }}>›</div>
                </div>
              </div>
            ))}
          </div>
          {filteredCharities.length === 0 && searchTerm !== '' && (
            <div style={{ margin: '8px 0 24px', background: '#EEF6F1', border: `1.5px solid ${C.sageLight}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 4 }}>Can't find your charity?</div>
              <div style={{ fontSize: 12, color: C.sage, marginBottom: 12, lineHeight: 1.5 }}>We're always adding new charities. Let us know which one you'd like to see.</div>
              <button
                style={{ padding: '10px 20px', background: C.sage, color: C.white, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => window.location.href = 'mailto:hello@givingtree.sg?subject=Add a Charity&body=Hi, I would like to suggest adding the following charity:%0A%0ACharity Name:%0AUEN:%0AWebsite:%0A%0AThank you!'}
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
            <div style={styles.donateCard}>
              <div style={styles.donateIcon}>{selectedCharity.icon}</div>
              <div>
                <div style={styles.donateName}>{selectedCharity.name}</div>
                <div style={styles.donateUen}>UEN: {selectedCharity.uen}</div>
                <div style={styles.ipcBadge}>✓ IPC Registered</div>
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
                <input style={styles.amountInput} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
            </div>
            <div style={styles.taxPreview}>
              💡 This donation saves you <strong>${taxSaving}</strong> in taxes (250% deductible)
            </div>
            
            <button style={{ ...styles.payBtn, background: C.gold, color: C.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 16 }} onClick={() => goTo('qr')}>
              Generate PayNow QR Code
            </button>
            <div style={{ height: 24 }} />
          </div>
        </div>
      )}

      {/* ── PAYNOW QR ── */}
      {screen === 'qr' && selectedCharity && (
        <div style={styles.screen}>
          <div style={styles.fixedHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={styles.backBtn} onClick={() => goTo('donate')}>←</span>
              <div style={styles.name}>Scan to Pay</div>
            </div>
          </div>
          <div style={{ ...styles.scrollArea, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.forest, marginBottom: 4, textAlign: 'center' }}>{selectedCharity.name}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.forest, marginBottom: 24, textAlign: 'center' }}>SGD ${amount}</div>
            <div style={{ background: C.white, borderRadius: 24, padding: 24, border: `1.5px solid ${C.border}`, marginBottom: 20 }}>
              <QRCodeSVG id="qr-code-svg" value={`https://www.paynow.com.sg/pay?uen=${selectedCharity.uen}&amount=${amount}&ref=GIVEBACK`} size={200} level="H" />
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 1.6 }}>
              Open your <strong style={{ color: C.forest }}>banking app</strong> and scan this QR code
            </div>
            <div style={{ background: '#EEF6F1', border: `1.5px solid ${C.sageLight}`, borderRadius: 12, padding: '10px 16px', fontSize: 12, color: C.sage, marginBottom: 24, textAlign: 'center', width: '100%' }}>
              💡 Paying to UEN: <strong>{selectedCharity.uen}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <button style={{ ...styles.payBtn, background: C.sage }} onClick={saveQR}>💾 Save QR Code Image</button>
              <button style={{ ...styles.payBtn, opacity: submitting ? 0.6 : 1 }} onClick={handleDonate} disabled={submitting}>{submitting ? 'Saving...' : "✓ I've Completed Payment"}</button>
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
          <button style={styles.payBtn} onClick={() => goTo('home')}>Back to Home</button>
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
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>tax saved (est.)</div>
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
              <button style={{ ...styles.exportBtn, margin: 0, flex: 1 }} onClick={exportIRASPDF}>📄 PDF</button>
              <button style={{ ...styles.exportBtn, margin: 0, flex: 1 }} onClick={exportIRASExcel}>📊 Excel</button>
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
                  </div>
                  <div style={styles.activityRight}>
                  <div style={styles.activityAmount}>${Number(d.amount).toLocaleString()}</div>
                  {!d.receipt && <div style={styles.badgePending}>Pending Receipt</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
                    {d.receipt && (
                      <div style={styles.badgeIssued} onClick={() => exportSingleReceiptPDF(d)}>📄 View Receipt</div>
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
            <div style={styles.profileCard}>
              <div style={styles.profileAvatar}>{donorName.charAt(0).toUpperCase()}</div>
              <div style={styles.profileName}>{donorName}</div>
              <div style={styles.profileEmail}>{session?.user?.email}</div>
            </div>
            {profileMsg !== '' && (
              <div style={{ background: '#EEF6F1', color: C.forest, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{profileMsg}</div>
            )}
            <div style={styles.fieldLabel}>Full Name</div>
            <input style={styles.profileInput} placeholder="Full name as per NRIC" value={profileName} onChange={e => setProfileName(e.target.value)} />
            <div style={styles.fieldLabel}>NRIC / FIN</div>
            <input style={styles.profileInput} placeholder="e.g. S1234567A" value={profileNric} onChange={e => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
              setProfileNric(val)
            }} maxLength={9} />
            {profileNric.length > 0 && profileNric.length < 9 && (
              <div style={{ fontSize: 11, color: C.red, marginBottom: 8 }}>NRIC must be 9 characters (e.g. S1234567A)</div>
            )}
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16 }}>🔒 Only the masked version is stored (e.g. S×××××7A)</div>
            <div style={styles.fieldLabel}>Email Address</div>
            <div style={{ ...styles.profileInput, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48 }}>{session?.user?.email}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 24 }}>Email cannot be changed</div>
            <div style={styles.fieldLabel}>Giving Goal (SGD)</div>
            <input style={styles.profileInput} type="text" value={givingGoal.toLocaleString()} onChange={e => { const g = parseInt(e.target.value.replace(/,/g, '')) || 0; setGivingGoal(g); localStorage.setItem('giveback_goal', g.toString()) }} />
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 24 }}>Your annual giving target</div>
            <button style={{ ...styles.payBtn, margin: 0, width: '100%' }} onClick={saveProfile}>Save Changes</button>
            <button style={{ ...styles.payBtn, margin: 0, marginTop: 12, width: '100%', background: C.red }} onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
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
        <div style={{ ...styles.navTab, ...(screen === 'receipts' ? styles.navTabActive : {}) }} onClick={() => goTo('receipts')}>
          <div>🧾</div><div style={{ ...styles.navLabel, ...(screen === 'receipts' ? { color: C.sage } : {}) }}>Receipts</div>
        </div>
        <div style={{ ...styles.navTab, ...(screen === 'profile' ? styles.navTabActive : {}) }} onClick={() => goTo('profile')}>
          <div>👤</div><div style={{ ...styles.navLabel, ...(screen === 'profile' ? { color: C.sage } : {}) }}>Profile</div>
        </div>
      </div>

    </div>
  )
}

const styles = {
  app: { width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#FAF7F2', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden', alignSelf: 'stretch' },
  screen: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', width: '100%' },
  fixedHeader: { padding: '24px 20px 16px', background: '#FAF7F2', flexShrink: 0 },
  scrollArea: { flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', width: '100%' },
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
  taxBadge: { background: '#D4A017', color: '#1B4332', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 20, whiteSpace: 'nowrap' },

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

  donateCard: { margin: '12px 16px', background: '#FFFFFF', borderRadius: 18, padding: 18, border: '1.5px solid #E2D9CC', display: 'flex', alignItems: 'center', gap: 14 },
  donateIcon: { fontSize: 32, width: 52, height: 52, background: '#FAF7F2', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  donateName: { fontSize: 15, fontWeight: 700, color: '#1B4332' },
  donateUen: { fontSize: 11, color: '#7A6E62', marginTop: 3 },
  ipcBadge: { display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 600, color: '#40916C', background: '#EEF6F1', padding: '3px 8px', borderRadius: 10 },

  amountSection: { padding: '0 16px 16px' },
  amountLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#7A6E62', marginBottom: 10 },
  presets: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 },
  preset: { padding: '10px 6px', background: '#FFFFFF', border: '1.5px solid #E2D9CC', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', cursor: 'pointer', color: '#1B4332' },
  presetActive: { padding: '10px 6px', background: '#1B4332', border: '1.5px solid #1B4332', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center', cursor: 'pointer', color: 'white' },
  inputWrap: { display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1.5px solid #E2D9CC', borderRadius: 12, overflow: 'hidden' },
  inputCurrency: { padding: '0 14px', fontSize: 16, fontWeight: 700, color: '#7A6E62', borderRight: '1.5px solid #E2D9CC', height: 52, display: 'flex', alignItems: 'center', background: '#FAF7F2' },
  amountInput: { flex: 1, padding: '0 16px', height: 52, border: 'none', outline: 'none', fontSize: 26, fontWeight: 800, color: '#1B4332', background: 'transparent', width: 0 },

  taxPreview: { margin: '0 16px 16px', background: '#FDF8EC', border: '1.5px solid #E8CC7A', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#A07010', lineHeight: 1.5 },
 
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