
document.addEventListener("DOMContentLoaded", () => {
  // --- Variabel DOM ---
  const form = document.getElementById('userForm');
  const notifyToggle = document.getElementById('notifyToggle');
  const toggleLabel = document.getElementById('toggleLabel');
  const countdownTimer = document.getElementById('countdownTimer');
  const timerDisplay = document.getElementById('timerDisplay');
  const suggestionBox = document.getElementById('suggestionBox');
  const suggestionList = document.getElementById('suggestionList');
  const resetButton = document.getElementById('resetButton');
  const reminderSound = document.getElementById('reminderSound');
  const recordedAudio = document.getElementById('recordedAudio');
  const deleteAudioBtn = document.getElementById('deleteAudioBtn');
  const recordStatus = document.getElementById('recordStatus');
  const startRecordBtn = document.getElementById('startRecord');
  const stopRecordBtn = document.getElementById('stopRecord');
  const openNoteModalBtn = document.getElementById("openNoteModal");
  const noteModal = document.getElementById("noteModal");
  const closeModalBtn = noteModal?.querySelector(".close");
  const saveNoteBtn = document.getElementById("saveNote");
  const noteInput = document.getElementById("noteInput");

  let countdownInterval, remainingSeconds = 0;
  let userData = null;
  let mediaRecorder, audioChunks = [];

  // --- Kalkulasi kebutuhan air ---
  function calculateWaterNeed(weight, usia, aktivitas, cuaca, kondisi) {
    let kebutuhan = weight * 30;
    if (usia === 'remaja') kebutuhan *= 1.1;
    else if (usia === 'wanita_dewasa') kebutuhan *= 1.0;
    else if (usia === 'pria_dewasa') kebutuhan *= 1.2;

    const activityMultiplier = {
      tidak_aktif: 1.0, ringan: 1.1, sedang: 1.2, tinggi: 1.4, sangat_tinggi: 1.6
    };
    kebutuhan *= activityMultiplier[aktivitas] || 1.0;
    if (cuaca === 'panas') kebutuhan *= 1.2;
    if (kondisi === 'hamil') kebutuhan *= 1.3;
    else if (kondisi === 'menyusui') kebutuhan *= 1.5;
    return (kebutuhan / 1000).toFixed(2);
  }

  function displaySuggestion(liter) {
    const suggestions = [
      `Minumlah sekitar <strong>${liter} liter</strong> air per hari.`,
      "Minum secara teratur, jangan tunggu haus.",
      "Tambahkan buah atau daun mint untuk variasi rasa.",
      "Kurangi minuman berkafein dan manis."
    ];
    suggestionList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join("");
    suggestionBox.style.display = "block";
  }

  function checkEndTime() {
    if (!userData || !userData.endTime) return false;
    const now = new Date();
    const [h, m] = userData.endTime.split(':').map(Number);
    return now >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  }

  function startCountdown(seconds) {
    clearInterval(countdownInterval);
    remainingSeconds = seconds;
    updateTimerDisplay();

    countdownInterval = setInterval(() => {
      if (checkEndTime()) {
        alert("Waktu pengingat telah berakhir.");
        notifyToggle.checked = false;
        toggleLabel.textContent = "Notifikasi Nonaktif";
        countdownTimer.style.display = 'none';
        clearInterval(countdownInterval);
        return;
      }
      remainingSeconds--;
      updateTimerDisplay();
      if (remainingSeconds <= 0) {
        notifyUser();
        remainingSeconds = seconds;
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const s = String(remainingSeconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
  }

  function notifyUser() {
    const note = localStorage.getItem("catatan") || '';
    const body = `Waktunya minum air! 💧${note ? '\n📝 Catatan: ' + note : ''}`;
    if (Notification.permission === "granted") {
      new Notification("HydroCare Reminder", {
        body: body,
        icon: "/static/logoku2.png"
      });
    }
    if (reminderSound.src) reminderSound.play();
  }

  function saveFormData(data) {
    localStorage.setItem('userData', JSON.stringify(data));
  }

  function loadFormData() {
    try {
      return JSON.parse(localStorage.getItem('userData')) || null;
    } catch {
      return null;
    }
  }

  function fillForm(data) {
    Object.entries(data).forEach(([k, v]) => {
      if (form[k]) form[k].value = v;
    });
  }

  function resetAll() {
    clearInterval(countdownInterval);
    localStorage.clear();
    form.reset();
    notifyToggle.checked = false;
    notifyToggle.disabled = true;
    toggleLabel.textContent = "Notifikasi Mati";
    countdownTimer.style.display = 'none';
    suggestionBox.style.display = 'none';
    recordedAudio.src = '';
    recordedAudio.style.display = 'none';
    deleteAudioBtn.style.display = 'none';
    recordStatus.style.display = 'none';
    reminderSound.src = '';
  }

  resetButton.addEventListener('click', resetAll);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
      name: form.name.value.trim(),
      weight: parseFloat(form.weight.value),
      interval: parseInt(form.interval.value),
      usia: form.usia.value,
      aktivitas: form.activity.value,
      cuaca: form.cuaca.value,
      kondisi: form.kondisi.value,
      startTime: form.startTime.value,
      endTime: form.endTime.value
    };
    if (!formData.name || isNaN(formData.weight) || isNaN(formData.interval) || formData.interval < 1) {
      alert("Mohon isi data dengan benar!");
      return;
    }

    const [sH, sM] = formData.startTime.split(':').map(Number);
    const [eH, eM] = formData.endTime.split(':').map(Number);
    const diff = ((eH * 60 + eM) - (sH * 60 + sM));
    if (diff < 2) {
      alert("Waktu akhir harus minimal 2 menit setelah mulai.");
      return;
    }

    userData = formData;
    saveFormData(formData);
    displaySuggestion(calculateWaterNeed(formData.weight, formData.usia, formData.aktivitas, formData.cuaca, formData.kondisi));
    notifyToggle.disabled = false;
    notifyToggle.checked = false;
    toggleLabel.textContent = "Notifikasi Nonaktif";
    countdownTimer.style.display = 'none';
  });

  notifyToggle.addEventListener('change', () => {
    if (notifyToggle.checked) {
      const now = new Date();
      const [sH, sM] = userData.startTime.split(':').map(Number);
      const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM);
      if (now < startDateTime) {
        alert(`Pengingat baru aktif mulai ${userData.startTime}`);
        notifyToggle.checked = false;
        return;
      }
      toggleLabel.textContent = "Notifikasi Aktif";
      countdownTimer.style.display = 'block';
      startCountdown(userData.interval * 60);
    } else {
      toggleLabel.textContent = "Notifikasi Nonaktif";
      clearInterval(countdownInterval);
      countdownTimer.style.display = 'none';
    }
  });

  // --- Rekaman Suara ---
  startRecordBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        recordedAudio.src = url;
        recordedAudio.style.display = 'block';
        deleteAudioBtn.style.display = 'inline-block';
        reminderSound.src = url;
      };

      mediaRecorder.start();
      recordStatus.style.display = 'flex';
      startRecordBtn.disabled = true;
      stopRecordBtn.disabled = false;
    } catch (e) {
      alert("Gagal mengakses mikrofon.");
    }
  });

  stopRecordBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
    recordStatus.style.display = 'none';
  });

  deleteAudioBtn.addEventListener('click', () => {
    recordedAudio.src = '';
    recordedAudio.style.display = 'none';
    deleteAudioBtn.style.display = 'none';
    reminderSound.src = '/static/default_sound.mp3';
  });

  // --- Modal Catatan ---
  openNoteModalBtn?.addEventListener('click', () => {
    noteModal.style.display = 'block';
    noteInput.value = localStorage.getItem('catatan') || '';
  });
  closeModalBtn?.addEventListener('click', () => noteModal.style.display = 'none');
  saveNoteBtn?.addEventListener('click', () => {
    const note = noteInput.value.trim();
    if (note) {
      localStorage.setItem('catatan', note);
      alert("Catatan disimpan!");
      noteModal.style.display = 'none';
    } else {
      alert("Catatan kosong!");
    }
  });
  window.addEventListener('click', (e) => {
    if (e.target === noteModal) noteModal.style.display = 'none';
  });

  // --- On Load ---
  const saved = loadFormData();
  if (saved) {
    fillForm(saved);
    userData = saved;
    notifyToggle.disabled = false;

    const now = new Date();
    const [sH, sM] = saved.startTime.split(':').map(Number);
    const [eH, eM] = saved.endTime.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eH, eM);
    if (now >= start && now <= end) {
      notifyToggle.checked = true;
      toggleLabel.textContent = "Notifikasi Aktif";
      countdownTimer.style.display = 'block';
      startCountdown(saved.interval * 60);
    }
  }
  reminderSound.src = "/static/default_sound.mp3";
});

