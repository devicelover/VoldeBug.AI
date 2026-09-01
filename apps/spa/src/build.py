"""Build the single-file SPA into apps/spa/dist/.

Everything is inlined into one HTML file on purpose: the app has to survive
being opened from a memory stick, a school intranet or a phone with no
connection, and a build with separate CSS/JS assets does not. The static
files that cannot be inlined (manifest, service worker, icons) are copied
alongside it.

Paths are resolved relative to this script, not the shell's working
directory, so `python3 apps/spa/src/build.py` works from the repo root.
"""

import pathlib
import shutil

SRC = pathlib.Path(__file__).resolve().parent
SPA = SRC.parent
DIST = SPA / 'dist'

css = (SRC / 'styles.css').read_text(encoding='utf-8')
js = (SRC / 'app.js').read_text(encoding='utf-8')
tpl = (SRC / 'index.template.html').read_text(encoding='utf-8')

# Guard: a literal </script> inside the JS would close the tag early.
assert '</script>' not in js, 'JS contains a literal closing script tag'

out = tpl.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)

DIST.mkdir(parents=True, exist_ok=True)
dest = DIST / 'index.html'
dest.write_text(out, encoding='utf-8')

# The PWA files are served from the same /app/ directory as index.html, so
# they have to land in dist/ too — a manifest that 404s makes the install
# prompt disappear with no error anywhere.
extras = ['manifest.json', 'sw.js'] + sorted(p.name for p in SPA.glob('icon-*.png'))
for name in extras:
    src_file = SPA / name
    if src_file.exists():
        shutil.copyfile(src_file, DIST / name)

# Fonts are self-hosted (see the comment in index.template.html). The
# stylesheet lands beside index.html at /app/fonts.css and the woff2 files
# under /app/fonts/, which is exactly what the @font-face src urls and the
# service worker's cache-first branch both assume. A missing font file here
# is invisible in review and obvious on a phone, so the count is printed.
fonts_src = SPA / 'fonts'
fonts_css = fonts_src / 'fonts.css'
woff2 = sorted(fonts_src.glob('*.woff2')) if fonts_src.is_dir() else []
if fonts_css.exists():
    shutil.copyfile(fonts_css, DIST / 'fonts.css')
if woff2:
    fonts_dist = DIST / 'fonts'
    fonts_dist.mkdir(parents=True, exist_ok=True)
    for f in woff2:
        shutil.copyfile(f, fonts_dist / f.name)

print(f'built {dest}  ({len(out):,} bytes)')
print('copied ' + ', '.join(extras))
print(f'copied fonts.css + {len(woff2)} woff2 files')
