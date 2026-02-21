import sys

file_path = 'App.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Remove AIChat from MainSiteShell
content = content.replace('      <Footer />\n      <AIChat />', '      <Footer />')

# Add AIChat to top level App
search_app = '''        <Routes>
          <Route path="/beto-carrero" element={<Suspense fallback={<LandingRouteFallback />}><BetoCarreroLanding /></Suspense>} />
          <Route path="/lollapalooza-2026" element={<Suspense fallback={<LandingRouteFallback />}><LollapaloozaLanding /></Suspense>} />
          <Route path="/orlando" element={<Suspense fallback={<LandingRouteFallback />}><OrlandoLanding /></Suspense>} />
          <Route path="/*" element={<MainSiteShell />} />
        </Routes>'''

replace_app = '''        <Routes>
          <Route path="/beto-carrero" element={<Suspense fallback={<LandingRouteFallback />}><BetoCarreroLanding /></Suspense>} />
          <Route path="/lollapalooza-2026" element={<Suspense fallback={<LandingRouteFallback />}><LollapaloozaLanding /></Suspense>} />
          <Route path="/orlando" element={<Suspense fallback={<LandingRouteFallback />}><OrlandoLanding /></Suspense>} />
          <Route path="/*" element={<MainSiteShell />} />
        </Routes>
        <AIChat />'''

if search_app in content:
    content = content.replace(search_app, replace_app)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Successfully patched App.tsx")
else:
    print("Could not find search text in App.tsx")
