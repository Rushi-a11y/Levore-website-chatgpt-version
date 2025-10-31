import React, { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const containerRef = useRef(null)
  const [legacyLoaded, setLegacyLoaded] = useState(false)
  const [legacyError, setLegacyError] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // Function: fetch, inject and execute legacy HTML (including scripts)
  async function loadLegacyHtml() {
    try {
      setLegacyError(null)
      const resp = await fetch('/legacy.html', { cache: 'no-store' })
      if (!resp.ok) throw new Error('Failed to load legacy.html')
      const text = await resp.text()

      // parse HTML string into document fragments
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')

      // Extract head content (styles / link tags) and move them into current head
      // (avoid duplicates by checking for existing link/script with same href/src)
      const moveHeadNodes = (selector, attrName) => {
        doc.querySelectorAll(selector).forEach((node) => {
          const key = node.getAttribute(attrName)
          if (!key) return
          const exists = Array.from(document.head.querySelectorAll(selector))
            .some(h => h.getAttribute(attrName) === key)
          if (!exists) {
            const clone = document.createElement(node.tagName.toLowerCase())
            // copy attributes
            for (let i = 0; i < node.attributes.length; i++) {
              const a = node.attributes[i]
              clone.setAttribute(a.name, a.value)
            }
            document.head.appendChild(clone)
          }
        })
      }

      moveHeadNodes('link', 'href')
      moveHeadNodes('meta', 'name') // optional

      // Now inject body content
      if (!containerRef.current) throw new Error('Missing container')
      containerRef.current.innerHTML = '' // clear
      // move non-script nodes first
      Array.from(doc.body.childNodes).forEach((child) => {
        if (child.tagName && child.tagName.toLowerCase() === 'script') return
        containerRef.current.appendChild(document.importNode(child, true))
      })

      // Now handle scripts: inline and external.
      // We append them as new script elements so they execute.
      const scripts = doc.querySelectorAll('script')
      for (const s of Array.from(scripts)) {
        const newScript = document.createElement('script')
        // copy attributes like src, type, async, crossorigin
        for (let i = 0; i < s.attributes.length; i++) {
          const a = s.attributes[i]
          newScript.setAttribute(a.name, a.value)
        }
        if (s.src) {
          // external script; append to container so it executes in page context
          // ensure it loads sequentially to preserve order if needed
          await new Promise((resolve, reject) => {
            newScript.onload = () => resolve()
            newScript.onerror = () => {
              console.warn('legacy script failed to load', s.src)
              resolve() // resolve anyway to continue
            }
            // Append to body to execute
            document.body.appendChild(newScript)
          })
        } else {
          // inline script
          newScript.text = s.textContent
          // append to body to execute
          document.body.appendChild(newScript)
        }
      }

      setLegacyLoaded(true)
    } catch (err) {
      console.error(err)
      setLegacyError(err.message)
    }
  }

  // Demonstration: fetch some rows from supabase 'public_table' (client anon key).
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('public_table').select('*').limit(10)
        if (error) throw error
        setRows(data || [])
      } catch (err) {
        console.warn('Supabase read failed', err.message || err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Your Vite + Supabase site</h1>
        <nav>
          <a href="/" style={{ marginRight: 12 }}>Home</a>
          <a href="#legacy" onClick={(e) => { e.preventDefault(); loadLegacyHtml(); window.location.hash = 'legacy' }}>Open legacy store</a>
        </nav>
      </header>

      <main style={{ marginTop: 20 }}>
        <section>
          <h2>Client data (Supabase demo)</h2>
          {loading ? <p>Loading rows...</p> : (
            rows.length ? <ul>{rows.map(r => <li key={r.id}>{JSON.stringify(r)}</li>)}</ul> : <p>No sample rows (check 'public_table' in Supabase)</p>
          )}
        </section>

        <section style={{ marginTop: 24 }}>
          <h2>Legacy (original) site</h2>
          <p>
            Click <button onClick={loadLegacyHtml}>Load legacy site</button> or open <a href="#legacy" onClick={(e)=>{e.preventDefault(); loadLegacyHtml(); window.location.hash='legacy'}}>Open legacy</a>.
            The legacy HTML will be injected below and its scripts executed.
          </p>

          {legacyError && <div style={{ color: 'red' }}>Legacy load error: {legacyError}</div>}
          {!legacyLoaded && <div style={{ color: '#666' }}>Legacy not loaded yet.</div>}

          <div ref={containerRef} id="legacy-container" style={{ marginTop: 12, border: '1px solid #eee', padding: 12 }} />
        </section>

        <section style={{ marginTop: 24 }}>
          <h3>Serverless admin demo</h3>
          <p>
            <a href="/.netlify/functions/supabaseAdmin" target="_blank" rel="noreferrer">Call serverless supabase admin function</a>
          </p>
          <p style={{ fontSize: 12, color: '#666' }}>This uses the server-side SUPABASE_SERVICE_ROLE key stored in Netlify env vars.</p>
        </section>
      </main>
    </div>
  )
}
