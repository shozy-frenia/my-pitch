(function(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const repoUrl = 'https://github.com/shozy-frenia/my-pitch';
  const copyBtn = document.getElementById('copyRepo');
  if (copyBtn){
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(repoUrl);
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = 'Copy repo URL', 1500);
      } catch (e) {
        alert('Could not copy automatically — the repo URL is: ' + repoUrl);
      }
    });
  }

  const form = document.getElementById('contactForm');
  if (form){
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = form.message.value.trim();
      if (!message) {
        status.textContent = 'Please add a short message before sending.';
        status.style.color = '#d97706';
        return;
      }
      status.textContent = 'Thanks! Your message was noted — please open an issue in the repository if you want a reply.';
      status.style.color = '#059669';
      form.reset();
      setTimeout(()=> status.textContent = '', 5000);
    });
  }
})();
