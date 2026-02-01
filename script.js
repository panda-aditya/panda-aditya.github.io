/* script.js - updated to include theme toggle, persistent preference,
   and the existing celebration + countdown behavior.
*/

(function () {
  var yesBtn = document.getElementById('yesBtn')
  var noBtn = document.getElementById('noBtn')
  var announce = document.getElementById('announce')
  var celebrationOverlay = document.getElementById('celebration')
  var confettiCanvas = document.getElementById('confetti-canvas')
  var pageRoot = document.getElementById('pageRoot')

  // elements for countdown/heart
  var countdownEl = document.getElementById('countdown')
  var countDisplay = document.getElementById('countDisplay')
  var countAnnounce = document.getElementById('countAnnounce')
  var heartEl = document.getElementById('popHeart')

  // theme toggle
  var themeToggle = document.getElementById('themeToggle')

  if (!yesBtn || !noBtn || !announce || !celebrationOverlay || !confettiCanvas || !pageRoot) {
    console.warn('Missing required DOM elements for script.js to run.')
    return
  }

  /* -------------------------
     THEME TOGGLE LOGIC
     - reads saved preference from localStorage
     - falls back to system preference
     - toggles 'dark' class on body
     ------------------------- */
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark')
      if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', 'true')
      }
    } else {
      document.body.classList.remove('dark')
      if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', 'false')
      }
    }
  }

  function readSavedTheme() {
    try {
      return localStorage.getItem('pref-theme')
    } catch (e) {
      return null
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem('pref-theme', theme)
    } catch (e) {}
  }

  function detectSystemPrefersDark() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch (e) {
      return false
    }
  }

  function toggleTheme() {
    var isDark = document.body.classList.contains('dark')
    var next = isDark ? 'light' : 'dark'
    applyTheme(next)
    saveTheme(next)
  }

  if (themeToggle) {
    // initialize theme on load
    var saved = readSavedTheme()
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved)
    } else {
      // no saved preference, use system
      applyTheme(detectSystemPrefersDark() ? 'dark' : 'light')
    }

    themeToggle.addEventListener('click', function (e) {
      e.preventDefault()
      toggleTheme()
    })
    themeToggle.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        toggleTheme()
      }
    })
  }

  /* -------------------------
     Canvas sizing for confetti
     ------------------------- */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1
    confettiCanvas.width = Math.floor(confettiCanvas.clientWidth * dpr)
    confettiCanvas.height = Math.floor(confettiCanvas.clientHeight * dpr)
    var ctx = confettiCanvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  confettiCanvas.style.width = '100%'
  confettiCanvas.style.height = '100%'
  fitCanvas()
  window.addEventListener('resize', fitCanvas)

  /* -------------------------
     Sound and confetti helpers
     ------------------------- */
  function playCheer() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      var ctx = new AudioContext()
      var o = ctx.createOscillator()
      var g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.value = 0.0001
      o.connect(g)
      g.connect(ctx.destination)

      g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02)
      o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7)
      o.start()
      o.stop(ctx.currentTime + 0.8)

      setTimeout(function () {
        if (ctx && typeof ctx.close === 'function') ctx.close().catch(function () {})
      }, 1000)
    } catch (err) {
      console.warn('Audio unavailable', err)
    }
  }

  function runConfetti(duration) {
    duration = typeof duration === 'number' ? duration : 4200
    var ctx = confettiCanvas.getContext('2d')
    if (!ctx) return
    var w = confettiCanvas.clientWidth
    var h = confettiCanvas.clientHeight
    var area = Math.max(1, w * h)
    var count = Math.max(18, Math.floor(area / 5000))
    var colors = ['#FF7AA2', '#FFD1DC', '#FFB6C1', '#FF9FB5', '#FFE1E8', '#FAD6E2']
    var pieces = []

    for (var i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * w,
        y: -10 - Math.random() * h * 0.15,
        w: 6 + Math.random() * 10,
        h: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        velX: (Math.random() - 0.5) * 8,
        velY: 2 + Math.random() * 8,
        rotVel: (Math.random() - 0.5) * 12
      })
    }

    var start = performance.now()
    function frame(now) {
      var t = now - start
      ctx.clearRect(0, 0, w, h)
      for (var j = 0; j < pieces.length; j++) {
        var p = pieces[j]
        p.x += p.velX
        p.y += p.velY
        p.velY += 0.06
        p.rotation += p.rotVel
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation * Math.PI / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (t < duration) {
        requestAnimationFrame(frame)
      } else {
        setTimeout(function () {
          ctx.clearRect(0, 0, w, h)
        }, 300)
      }
    }
    requestAnimationFrame(frame)
  }

  /* -------------------------
     Navigation helper
     ------------------------- */
  var _navigated = false
  function navigateToLetter() {
    if (_navigated) return
    _navigated = true
    setTimeout(function () {
      window.location.href = 'letter.html'
    }, 200)
  }

  /* -------------------------
     Countdown logic
     ------------------------- */
  function startCountdown(seconds) {
    seconds = typeof seconds === 'number' && seconds >= 0 ? Math.floor(seconds) : 3
    if (!countdownEl) return
    var current = seconds
    if (countDisplay) countDisplay.textContent = String(current)
    if (countAnnounce) countAnnounce.textContent = String(current)
    countdownEl.setAttribute('aria-hidden', 'false')

    // reset heart classes
    if (heartEl) {
      heartEl.classList.remove('pop')
      heartEl.classList.remove('grow')
    }

    var interval = setInterval(function () {
      current -= 1
      if (current >= 0) {
        if (countDisplay) countDisplay.textContent = String(current)
        if (countAnnounce) countAnnounce.textContent = String(current)
        if (heartEl) {
          heartEl.classList.add('grow')
          setTimeout(function () { if (heartEl) heartEl.classList.remove('grow') }, 350)
        }
      }
      if (current <= 0) {
        clearInterval(interval)
        if (heartEl) heartEl.classList.add('pop')
        playCheer()
        runConfetti(1400)
        announce.textContent = 'Opening the letter now'
        setTimeout(function () {
          navigateToLetter()
        }, 700)
      }
    }, 1000)
  }

  /* -------------------------
     Celebration flow
     ------------------------- */
  function celebrate() {
    if (celebrationOverlay.classList.contains('show')) {
      navigateToLetter()
      return
    }

    document.body.classList.add('body-celebrate')
    celebrationOverlay.classList.add('show')
    celebrationOverlay.setAttribute('aria-hidden', 'false')
    announce.textContent = 'Yippieeee! She said yes!'

    var ct = document.getElementById('celebrateText')
    if (ct) {
      try {
        ct.setAttribute('tabindex', '-1')
        ct.focus({ preventScroll: true })
      } catch (e) {
        try { ct.focus() } catch (err) {}
      }
    }

    // initial confetti and sound
    playCheer()
    runConfetti(2000)

    // start small countdown after a short delay
    setTimeout(function () {
      startCountdown(3)
    }, 700)
  }

  /* -------------------------
     Convert No -> Yes and handlers
     ------------------------- */
  function convertNoToYes() {
    return new Promise(function (resolve) {
      noBtn.classList.remove('wiggle')
      noBtn.classList.add('converted')
      noBtn.disabled = true

      setTimeout(function () {
        noBtn.textContent = 'Yes'
        noBtn.style.transition = 'transform .22s ease'
        noBtn.style.transform = 'scale(1.06)'
      }, 120)

      setTimeout(function () {
        noBtn.style.transform = ''
        noBtn.disabled = false

        var clone = noBtn.cloneNode(true)
        clone.id = 'noBtn'
        noBtn.parentNode.replaceChild(clone, noBtn)
        noBtn = clone

        clone.addEventListener('click', function (ev) {
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault()
          celebrate()
        })
        clone.addEventListener('keydown', function (ke) {
          if (ke.key === 'Enter' || ke.key === ' ') {
            ke.preventDefault()
            celebrate()
          }
        })

        resolve(clone)
      }, 360)
    })
  }

  function handleNo(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    convertNoToYes().then(function (convertedBtn) {
      announce.textContent = 'The No button turned into Yes — click it to confirm!'
      try { convertedBtn.focus() } catch (err) {}
    })
  }

  function handleYes(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    celebrate()
  }

  // Attach listeners
  yesBtn.addEventListener('click', handleYes)
  noBtn.addEventListener('click', handleNo)

  noBtn.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      handleNo(ev)
    }
  })
  yesBtn.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      handleYes(ev)
    }
  })

  noBtn.classList.add('wiggle')

  // initial theme focus and UX
  try { yesBtn.focus() } catch (e) {}
}())
