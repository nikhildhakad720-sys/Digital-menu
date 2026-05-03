import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'
import { collection, addDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const COLORS = [
  { name: 'Red', val: '#e23744' }, { name: 'Purple', val: '#7c3aed' },
  { name: 'Ocean', val: '#0ea5e9' }, { name: 'Green', val: '#16a34a' },
  { name: 'Orange', val: '#ea580c' }, { name: 'Dark', val: '#1c1c1c' },
  { name: 'Pink', val: '#db2777' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('special')
  const [menuItems, setMenuItems] = useState([])
  const [special, setSpecial] = useState({ tag: "Today's special", title: "Freshly crafted just for you", sub: "Table service · Scan & browse", color: '#e23744', showDish: false, dishId: null })
  const [toast, setToast] = useState('')
  const [fName, setFName] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fPrice, setFPrice] = useState('')
  const [fCat, setFCat] = useState('Starters')
  const [fType, setFType] = useState('veg')
  const [fBest, setFBest] = useState(false)
  const [fPhoto, setFPhoto] = useState('')
  const [selectedColor, setSelectedColor] = useState('#e23744')
  const [bannerTag, setBannerTag] = useState("Today's special")
  const [bannerTitle, setBannerTitle] = useState("Freshly crafted just for you")
  const [bannerSub, setBannerSub] = useState("Table service · Scan & browse")
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => { setUser(u); setLoading(false) })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'menuItems'), snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const unsubS = onSnapshot(doc(db, 'settings', 'special'), snap => {
      if (snap.exists()) {
        const d = snap.data()
        setSpecial(d)
        setSelectedColor(d.color || '#e23744')
        setBannerTag(d.tag || "Today's special")
        setBannerTitle(d.title || "Freshly crafted just for you")
        setBannerSub(d.sub || "Table service · Scan & browse")
      }
    })
    return () => { unsub(); unsubS() }
  }, [user])

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const login = async () => {
    if (!email || !password) { setLoginError('Please fill in both fields.'); return }
    setLoggingIn(true); setLoginError('')
    try { await signInWithEmailAndPassword(auth, email, password) }
    catch (e) { setLoginError('Incorrect email or password.') }
    setLoggingIn(false)
  }
  const logout = async () => { await signOut(auth); navigate('/') }
  const sendReset = async () => {
    try { await sendPasswordResetEmail(auth, user.email); setResetSent(true); showToast('Reset link sent!') }
    catch (e) { showToast('Error sending email.') }
  }
  const saveBanner = async () => {
    const data = { ...special, tag: bannerTag, title: bannerTitle, sub: bannerSub, color: selectedColor }
    await setDoc(doc(db, 'settings', 'special'), data)
    setSpecial(data); showToast('Banner updated!')
  }
  const applyFeaturedDish = async () => {
    const dishId = document.getElementById('dishPicker').value
    if (!dishId) { showToast('Please select a dish first'); return }
    const data = { ...special, dishId }
    await setDoc(doc(db, 'settings', 'special'), data)
    setSpecial(data); showToast('Featured dish updated!')
  }
  const toggleShowDish = async () => {
    const data = { ...special, showDish: !special.showDish }
    await setDoc(doc(db, 'settings', 'special'), data)
    setSpecial(data)
  }
  const addItem = async () => {
    if (!fName || !fPrice) { showToast('Please fill name and price'); return }
    await addDoc(collection(db, 'menuItems'), { name: fName, desc: fDesc, price: parseInt(fPrice), cat: fCat, type: fType, best: fBest, photo: fPhoto || null })
    setFName(''); setFDesc(''); setFPrice(''); setFPhoto(''); setFBest(false)
    showToast('Item added!')
  }
  const deleteItem = async id => { await deleteDoc(doc(db, 'menuItems', id)); showToast('Item removed') }
  const handlePhotoUpload = e => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#93959f' }}>Loading...</div>

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 360 }}>
        <div style={{ width: 52, height: 52, background: '#fff3f3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e23744" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>Admin Access</div>
        <div style={{ fontSize: 13, color: '#93959f', textAlign: 'center', marginBottom: 24 }}>Enter your credentials to continue</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gmail</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@gmail.com" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #d4d5d9', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} type={showPass ? 'text' : 'password'} placeholder="Enter password" style={{ width: '100%', padding: '11px 40px 11px 14px', border: '1.5px solid #d4d5d9', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>{showPass ? '🙈' : '👁'}</button>
          </div>
        </div>
        {loginError && <div style={{ fontSize: 12, color: '#e23744', textAlign: 'center', marginBottom: 10, fontWeight: 500 }}>{loginError}</div>}
        <button onClick={login} disabled={loggingIn} style={{ background: '#e23744', color: '#fff', border: 'none', padding: 13, width: '100%', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loggingIn ? 0.7 : 1 }}>{loggingIn ? 'Verifying...' : 'Login to Dashboard'}</button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span onClick={() => { if (!email) { setLoginError('Enter your Gmail above first.'); return } sendPasswordResetEmail(auth, email).then(() => showToast('Check your Gmail!')).catch(() => setLoginError('Something went wrong.')) }} style={{ fontSize: 13, color: '#e23744', cursor: 'pointer', textDecoration: 'underline' }}>Forgot password? Reset via Gmail</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span onClick={() => navigate('/')} style={{ fontSize: 13, color: '#93959f', cursor: 'pointer' }}>← Back to Menu</span>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1c1c1c', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#f2f2f2', minHeight: '100vh' }}>
      <div style={{ background: '#1c1c1c', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Menu Dashboard</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff', cursor: 'pointer' }}>View Menu</button>
          <button onClick={logout} style={{ background: '#e23744', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e23744', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>A</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.email}</div>
            <div style={{ fontSize: 11, color: '#93959f' }}>Administrator · Full Access</div>
          </div>
          <button onClick={sendReset} style={{ background: 'none', border: '1px solid #d4d5d9', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#686b78', cursor: 'pointer' }}>Reset Password</button>
        </div>
        {resetSent && <div style={{ background: '#e8f4e8', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#2d7a35', fontWeight: 500 }}>✅ Reset link sent! Check your Gmail inbox.</div>}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          {[['special', "⭐ Today's Special"], ['menu', '🍽️ Menu Items']].map(([key, label]) => (
            <div key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, padding: '9px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', background: activeTab === key ? '#e23744' : 'transparent', color: activeTab === key ? '#fff' : '#686b78', transition: 'all 0.15s' }}>{label}</div>
          ))}
        </div>
        {activeTab === 'special' && (
          <>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e23744', marginBottom: 14 }}>✏️ Banner Editor</div>
              {[['Banner Tag', bannerTag, setBannerTag, "Today's Special"], ['Banner Title', bannerTitle, setBannerTitle, "Chef's Picks Are Here!"], ['Banner Subtitle', bannerSub, setBannerSub, "Table service · Scan & browse"]].map(([label, val, setter, ph]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                  <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d4d5d9', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Banner Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(c => <div key={c.val} onClick={() => setSelectedColor(c.val)} style={{ width: 28, height: 28, borderRadius: '50%', background: c.val, cursor: 'pointer', border: selectedColor === c.val ? '3px solid #1c1c1c' : '3px solid transparent' }} />)}
                </div>
              </div>
              <div style={{ borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedColor, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 3 }}>{bannerTag}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{bannerTitle}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{bannerSub}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <button onClick={saveBanner} style={{ background: '#e23744', color: '#fff', border: 'none', padding: 11, width: '100%', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Apply to Menu Banner</button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#b8860b', marginBottom: 12 }}>⭐ Feature a Dish</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f2f2f2', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Show Featured Dish Card</div>
                  <div style={{ fontSize: 11, color: '#93959f' }}>Displays below the banner</div>
                </div>
                <div onClick={toggleShowDish} style={{ width: 36, height: 20, borderRadius: 10, background: special.showDish ? '#3d9142' : '#d4d5d9', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: special.showDish ? 18 : 2, transition: 'left 0.2s' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pick a dish</label>
                <select id="dishPicker" defaultValue={special.dishId || ''} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d4d5d9', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">— Select a dish —</option>
                  {menuItems.map(i => <option key={i.id} value={i.id}>{i.name} (₹{i.price})</option>)}
                </select>
              </div>
              <button onClick={applyFeaturedDish} style={{ background: '#b8860b', color: '#fff', border: 'none', padding: 11, width: '100%', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Feature This Dish</button>
            </div>
          </>
        )}
        {activeTab === 'menu' && (
          <>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Add New Item</div>
              {[['Item name', fName, setFName, 'e.g. Masala Chai', 'text'], ['Description', fDesc, setFDesc, 'Short description...', 'text'], ['Price (₹)', fPrice, setFPrice, '89', 'number']].map(([label, val, setter, ph, type]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                  <input value={val} onChange={e => setter(e.target.value)} type={type} placeholder={ph} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d4d5d9', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              ))}
              {[['Category', fCat, setFCat, [['Starters', 'Starters'], ['Main Course', 'Main Course'], ['Desserts', 'Desserts'], ['Drinks', 'Drinks']]], ['Type', fType, setFType, [['veg', 'Veg'], ['nonveg', 'Non-Veg']]]].map(([label, val, setter, opts]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                  <select value={val} onChange={e => setter(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d4d5d9', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bestseller?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={() => setFBest(!fBest)} style={{ width: 36, height: 20, borderRadius: 10, background: fBest ? '#e23744' : '#d4d5d9', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: fBest ? 18 : 2, transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#686b78' }}>{fBest ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#686b78', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Photo <span style={{ fontSize: 10, background: '#e8f4e8', color: '#2d7a35', borderRadius: 4, padding: '2px 6px', fontWeight: 500 }}>auto-fetched if skipped</span></label>
                {fPhoto && <img src={fPhoto} alt="preview" style={{ width: 72, height: 60, borderRadius: 8, objectFit: 'cover', marginBottom: 6, display: 'block' }} />}
                <div onClick={() => document.getElementById('photoUpload').click()} style={{ width: '100%', padding: 18, border: '1.5px dashed #d4d5d9', borderRadius: 8, textAlign: 'center', cursor: 'pointer', color: '#93959f', fontSize: 12 }}>
                  Tap to upload photo<br /><span style={{ fontSize: 11, color: '#bbb' }}>or leave empty for auto</span>
                </div>
                <input id="photoUpload" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </div>
              <button onClick={addItem} style={{ background: '#e23744', color: '#fff', border: 'none', padding: 12, width: '100%', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Add to Menu</button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#686b78', marginBottom: 8 }}>All items ({menuItems.length})</div>
              {menuItems.length === 0 && <div style={{ fontSize: 13, color: '#93959f', textAlign: 'center', padding: '20px 0' }}>No items yet. Add your first item above.</div>}
              {menuItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: '1px solid #f2f2f2' }}>
                  {item.photo ? <img src={item.photo} alt={item.name} style={{ width: 40, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 40, height: 36, borderRadius: 6, background: '#f2f2f2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍽️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#93959f' }}>{item.cat}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>₹{item.price}</span>
                  <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: '1px solid #d4d5d9', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#93959f', cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1c1c1c', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', zIndex: 999 }}>{toast}</div>}
    </div>
  )
}