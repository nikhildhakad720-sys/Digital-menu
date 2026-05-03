import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, onSnapshot, doc } from 'firebase/firestore'

const UNSPLASH_KEY = '_olt2HdCKmk_lyFGPpMoT8b7bPdwDwxeG9gLFVi8nRw'
const photoCache = {}

export default function MenuPage() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState([])
  const [special, setSpecial] = useState({ tag: "Today's special", title: "Freshly crafted just for you", sub: "Table service · Scan & browse", color: "#e23744", showDish: false, dishId: null })
  const [vegOnly, setVegOnly] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [photos, setPhotos] = useState({})

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menuItems'), snap => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubS = onSnapshot(doc(db, 'settings', 'special'), snap => {
      if (snap.exists()) setSpecial(snap.data())
    })
    return () => { unsub(); unsubS() }
  }, [])

  useEffect(() => {
    menuItems.forEach(async item => {
      if (item.photo) return
      if (photoCache[item.name]) { setPhotos(p => ({ ...p, [item.id]: photoCache[item.name] })); return }
      try {
        const r = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(item.name + ' food')}&orientation=squarish&client_id=${UNSPLASH_KEY}`)
        const d = await r.json()
        photoCache[item.name] = d.urls?.small || ''
        setPhotos(p => ({ ...p, [item.id]: d.urls?.small || '' }))
      } catch { }
    })
  }, [menuItems])

  const categories = ['All', ...new Set(menuItems.map(i => i.cat))]
  const filtered = menuItems.filter(i => {
    if (vegOnly && i.type !== 'veg') return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.desc?.toLowerCase().includes(search.toLowerCase())) return false
    if (activeCategory !== 'All' && i.cat !== activeCategory) return false
    return true
  })
  const catGroups = [...new Set(filtered.map(i => i.cat))]
  const featuredDish = special.showDish && special.dishId ? menuItems.find(i => i.id === special.dishId) : null

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', background: '#f2f2f2', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e23744', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Table {tableId || '1'}</span>
          <span style={{ fontSize: 11, color: '#686b78', marginLeft: 2 }}>· Digital Menu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f2f2f2', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93959f" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search from our menu..." style={{ border: 'none', background: 'none', fontSize: 14, color: '#1c1c1c', outline: 'none', flex: 1 }} />
        </div>
      </div>
      <div style={{ background: special.color, padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, transition: 'background 0.4s' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', marginBottom: 4 }}>{special.tag}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>{special.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{special.sub}</div>
        </div>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {featuredDish && (featuredDish.photo || photos[featuredDish.id])
            ? <img src={featuredDish.photo || photos[featuredDish.id]} alt={featuredDish.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '50%' }} />
            : <svg viewBox="0 0 64 64" fill="none" width="38" height="38"><circle cx="32" cy="28" r="16" fill="rgba(255,255,255,0.2)"/><circle cx="25" cy="24" r="3" fill="white" opacity="0.7"/><circle cx="39" cy="24" r="3" fill="white" opacity="0.7"/></svg>
          }
        </div>
      </div>
      {featuredDish && (
        <div style={{ margin: '0 12px 8px', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          {(featuredDish.photo || photos[featuredDish.id]) && <img src={featuredDish.photo || photos[featuredDish.id]} alt={featuredDish.name} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />}
          <div style={{ background: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#e23744', marginBottom: 2 }}>⭐ Today's Special</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{featuredDish.name}</div>
              <div style={{ fontSize: 12, color: '#93959f', marginTop: 2 }}>{featuredDish.desc}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>₹{featuredDish.price}</div>
          </div>
        </div>
      )}
      <div style={{ background: '#fff', margin: '0 0 8px', padding: '14px 16px', display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93959f" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: 12, color: '#686b78' }}><strong>11am–11pm</strong> open now</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#48c479', borderRadius: 4, padding: '2px 6px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>4.5</span>
          </span>
          <span style={{ fontSize: 12, color: '#686b78', marginLeft: 4 }}>rated</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#686b78' }}><strong>Dine-in</strong> only</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f2f2f2' }}>
        <div onClick={() => setVegOnly(!vegOnly)} style={{ width: 36, height: 20, borderRadius: 10, background: vegOnly ? '#3d9142' : '#d4d5d9', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: vegOnly ? 18 : 2, transition: 'left 0.2s' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Veg only</span>
      </div>
      <div style={{ padding: '10px 16px 8px', display: 'flex', gap: 8, overflowX: 'auto', background: '#fff', scrollbarWidth: 'none' }}>
        {categories.map(c => (
          <div key={c} onClick={() => setActiveCategory(c)} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer', border: `1.5px solid ${activeCategory === c ? '#e23744' : '#d4d5d9'}`, background: activeCategory === c ? '#e23744' : '#fff', color: activeCategory === c ? '#fff' : '#686b78', transition: 'all 0.15s' }}>{c}</div>
        ))}
      </div>
      <div style={{ height: 8, background: '#f2f2f2' }} />
      {catGroups.length === 0
        ? <div style={{ padding: '40px 16px', textAlign: 'center', color: '#93959f', fontSize: 14 }}>No items found</div>
        : catGroups.map((cat, ci) => (
          <div key={cat}>
            <div style={{ background: '#fff', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, padding: '16px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                {cat} <span style={{ fontSize: 12, fontWeight: 400, color: '#93959f' }}>({filtered.filter(i => i.cat === cat).length})</span>
              </div>
              {filtered.filter(i => i.cat === cat).map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, padding: 16, borderTop: '1px solid #f2f2f2', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <div style={{ width: 14, height: 14, border: `1.5px solid ${item.type === 'veg' ? '#3d9142' : '#e43b4f'}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.type === 'veg' ? '#3d9142' : '#e43b4f' }} />
                      </div>
                      {item.best && <span style={{ background: '#fef3d0', color: '#8b5e00', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3 }}>Bestseller</span>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{item.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>₹{item.price}</div>
                    <div style={{ fontSize: 12, color: '#93959f', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.desc}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {(item.photo || photos[item.id])
                      ? <img src={item.photo || photos[item.id]} alt={item.name} style={{ width: 96, height: 84, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: 96, height: 84, borderRadius: 10, background: '#f5e6e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍽️</div>
                    }
                  </div>
                </div>
              ))}
            </div>
            {ci < catGroups.length - 1 && <div style={{ height: 8, background: '#f2f2f2' }} />}
          </div>
        ))
      }
      <div style={{ height: 8, background: '#f2f2f2' }} />
      <button onClick={() => navigate('/admin')} style={{ background: '#1c1c1c', color: '#fff', border: 'none', padding: '12px 16px', width: '100%', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Admin Login
      </button>
    </div>
  )
}