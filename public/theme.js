const root = document.documentElement;
try {
  const saved = localStorage.getItem('code-anime-theme');
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
} catch {
  // Storage can be unavailable in private or embedded browsers.
}
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-theme');
  const update = () => {
    const dark = root.dataset.theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  };
  update();
  toggle.onclick = () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    update();
    try {
      localStorage.setItem('code-anime-theme', root.dataset.theme);
    } catch {
      // The toggle still works when the preference cannot be saved.
    }
  };
});
