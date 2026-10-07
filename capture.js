(() => {
  const root = document.querySelector('#app');
  if (!root || !document.body.classList.contains('activity-page')) return;

  const grade = document.body.dataset.grade === 'inspire' ? 'Grade_3' : 'Grade_2';
  const panel = document.createElement('section');
  panel.className = 'page-capture';
  panel.innerHTML = `
    <div>
      <h2>Finished your work?</h2>
      <p>Save a picture of this whole page, including your answers and graphs. The picture downloads to this device as a PNG.</p>
    </div>
    <button class="action-button primary" type="button" data-save-page-picture>📷 Save page picture</button>
    <p class="page-capture-status" role="status" aria-live="polite"></p>`;
  const expectations = root.querySelector('#expectations');
  if (expectations) expectations.before(panel);
  else root.append(panel);

  const button = panel.querySelector('[data-save-page-picture]');
  const status = panel.querySelector('.page-capture-status');

  function safeFilenamePart(value) {
    return value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, '_').slice(0, 45);
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The picture could not be created.')), 'image/png');
      } catch (error) {
        reject(error);
      }
    });
  }

  async function renderPage(omitArtwork, width, height, scale) {
    const options = {
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      scale,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      onclone(clone) {
        // Student-work pictures should not expose the teacher's assessment notes.
        clone.querySelectorAll('.page-capture,.teacher-record-bar,.cat-note-panel,.cat-note-button').forEach(item => item.remove());
        if (omitArtwork) {
          clone.querySelectorAll('img').forEach(image => image.remove());
          clone.querySelectorAll('.route-card-picture').forEach(picture => {
            picture.style.backgroundImage = 'none';
          });
        }
      }
    };
    const canvas = await window.html2canvas(document.body, options);
    return canvasBlob(canvas);
  }

  button.addEventListener('click', async () => {
    if (typeof window.html2canvas !== 'function') {
      status.textContent = 'Picture tool did not load. Reload the page and try again.';
      return;
    }

    button.disabled = true;
    status.textContent = 'Preparing your page picture…';
    const originalScroll = window.scrollY;
    document.body.classList.add('capture-mode');

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await nextFrame();
      const width = Math.ceil(Math.max(document.body.scrollWidth, document.documentElement.scrollWidth));
      const height = Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
      const scale = Math.min(1, 28000 / height, 12000 / width, Math.sqrt(70_000_000 / (width * height)));
      if (!Number.isFinite(scale) || scale <= 0) throw new Error('The page size could not be measured.');

      let blob;
      let artworkOmitted = false;
      try {
        blob = await renderPage(false, width, height, scale);
      } catch (error) {
        // Some file:// browsers do not allow local artwork to be copied into a canvas.
        status.textContent = 'Retrying the picture without decorative artwork…';
        blob = await renderPage(true, width, height, scale);
        artworkOmitted = true;
      }

      const student = safeFilenamePart(document.querySelector('[data-student-name]')?.value || 'Student') || 'Student';
      const filename = `Game_Day_${grade}_${student}_Page.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      status.textContent = artworkOmitted
        ? `Saved ${filename}. This browser left out decorative artwork, but your answers are included.`
        : `Saved ${filename}.`;
    } catch (error) {
      status.textContent = `Could not save the picture: ${error?.message || 'Please try again.'}`;
    } finally {
      document.body.classList.remove('capture-mode');
      window.scrollTo({ top: originalScroll, behavior: 'instant' });
      button.disabled = false;
    }
  });
})();
