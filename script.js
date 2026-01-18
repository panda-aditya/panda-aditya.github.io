// set year
document.getElementById('year').textContent = new Date().getFullYear();

// theme toggle (persistent)
const tBtn = document.getElementById('themeToggle');
const current = localStorage.getItem('theme') || 'light';
if(current === 'dark') document.documentElement.setAttribute('data-theme','dark');
tBtn.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});
