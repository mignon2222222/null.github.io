document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Auth & Screens
  const gateScreen = document.getElementById('gate-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('login-form');
  const accessCodeInput = document.getElementById('access-code');
  const enterBtn = document.getElementById('enter-btn');
  const attemptCountSpan = document.getElementById('attempt-count');
  const loginContainer = document.querySelector('.login-container');

  // DOM Elements - Navigation Views
  const systemView = document.getElementById('system-view');
  const systemPageView = document.getElementById('system-page-view');
  const observationView = document.getElementById('observation-view');
  const subjectObservationView = document.getElementById('subject-observation-view');
  const analysisView = document.getElementById('analysis-view');
  const navSystem = document.getElementById('nav-system');
  const navObservation = document.getElementById('nav-observation');
  const navAnalysis = document.getElementById('nav-analysis');
  const submenuItems = document.querySelectorAll('.submenu-item');

  // DOM Elements - System View Clocks & Stats
  const timeDisplaySpan = document.getElementById('time-display');

  // DOM Elements - Observation View Clocks & Feed
  const obsPageTitle = document.getElementById('obs-page-title');
  const obsTimeStampDate = document.getElementById('obs-time-stamp-date');
  const focusTimeOverlay = document.getElementById('focus-time-overlay');
  const uptimeDisplayObs = document.getElementById('uptime-display-obs');
  
  // Interactive Camera Feed Selection
  const mainFeedImg = document.getElementById('main-feed-img');
  const mainChannelId = document.getElementById('main-channel-id');
  const mainCameraId = document.getElementById('main-camera-id');
  const mainCameraLoc = document.getElementById('main-camera-loc');
  const mainCameraUnit = document.getElementById('main-camera-unit');
  const sideFeedCards = document.querySelectorAll('.side-feed-card');
  
  // HUD Data telemetries
  const focusSubjectId = document.getElementById('focus-subject-id');
  const focusZone = document.getElementById('focus-zone');
  const focusPos = document.getElementById('focus-pos');
  const focusTime = document.getElementById('focus-time');
  const focusDuration = document.getElementById('focus-duration');
  const focusTrackId = document.getElementById('focus-track-id');
  const focusDir = document.getElementById('focus-dir');
  const focusSpeed = document.getElementById('focus-speed');
  const focusInteraction = document.getElementById('focus-interaction');
  const focusDensity = document.getElementById('focus-density');
  const focusAnomaly = document.getElementById('focus-anomaly');
  const focusConfidence = document.getElementById('focus-confidence');
  const focusConfidenceFill = document.getElementById('focus-confidence-fill');
  const croppedSubjectView = document.getElementById('cropped-subject-view');

  // System Logs Table
  const logTableBody = document.querySelector('#log-table tbody');

  // State Variables
  let attempts = 0;
  let clockInterval = null;
  let logInterval = null;
  let currentUptime = { days: 72, hours: 14, minutes: 3, seconds: 21 };
  let introTimeout = null;

  function startAutoIntroSequence() {
    if (introTimeout) clearTimeout(introTimeout);
    introTimeout = setTimeout(() => {
      if (isSystemViewActive() && currentSlide === 1) {
        transitionToSlide(2);
      }
    }, 2500); // 2.5 seconds delay before automatically scrolling to slide 2
  }

  // ==========================================================================
  // VIEW ROUTING LOGIC (SPA Router)
  // ==========================================================================
  function switchView(viewName) {
    if (introTimeout) clearTimeout(introTimeout); // Clear auto scroll timer on view switch

    // Hide all views
    systemView.classList.add('hidden');
    systemPageView.classList.add('hidden');
    observationView.classList.add('hidden');
    if (subjectObservationView) subjectObservationView.classList.add('hidden');
    if (analysisView) analysisView.classList.add('hidden');

    // Pause main page video when switching views
    const surveillanceVideo = document.getElementById('main-surveillance-video');
    if (surveillanceVideo) {
      surveillanceVideo.pause();
    }
    
    // Reset active nav indicators
    navSystem.classList.remove('active');
    navObservation.classList.remove('active');
    if (navAnalysis) navAnalysis.classList.remove('active');

    // Reset active submenu indicators
    submenuItems.forEach(item => item.classList.remove('active'));

    // Reset hidden slides (show by default)
    if (heroSec) heroSec.classList.remove('hidden');
    if (surveillanceSection) surveillanceSection.classList.remove('hidden');

    if (viewName === 'home') {
      systemView.classList.remove('hidden');
      navSystem.classList.add('active');
      const subMain = document.getElementById('sub-system-main');
      if (subMain) subMain.classList.add('active');
      sessionStorage.setItem('lab_active_view', 'home');

      // Reset hero text styles to fully visible
      const heroTitleNull = document.querySelector('.hero-title-null');
      const heroTitleLab = document.querySelector('.hero-title-lab');
      const heroDesc = document.querySelector('.hero-desc');
      const heroNote = document.querySelector('.hero-note');
      if (heroTitleNull) { heroTitleNull.style.transform = 'scale(1)'; heroTitleNull.style.opacity = '1'; }
      if (heroTitleLab) { heroTitleLab.style.transform = 'scale(1)'; heroTitleLab.style.opacity = '1'; }
      if (heroDesc) { heroDesc.style.transform = 'scale(1)'; heroDesc.style.opacity = '1'; }
      if (heroNote) { heroNote.style.transform = 'scale(1)'; heroNote.style.opacity = '1'; }

      // Reset video opacity to 0
      const surveillanceVideo = document.getElementById('main-surveillance-video');
      if (surveillanceVideo) {
        surveillanceVideo.style.transition = 'none';
        surveillanceVideo.style.opacity = '0';
      }

      // Start the auto scroll intro sequence
      startAutoIntroSequence();
    } else if (viewName === 'system') {
      systemPageView.classList.remove('hidden');
      navSystem.classList.add('active');
      const subLab = document.getElementById('sub-system-lab');
      if (subLab) subLab.classList.add('active');
      sessionStorage.setItem('lab_active_view', 'system');
    } else if (viewName === 'analysis') {
      if (analysisView) analysisView.classList.remove('hidden');
      if (navAnalysis) navAnalysis.classList.add('active');
      const subAnalysis = document.getElementById('sub-ana-analysis');
      if (subAnalysis) subAnalysis.classList.add('active');
      sessionStorage.setItem('lab_active_view', 'analysis');
    } else if (viewName === 'sub-observation') {
      if (subjectObservationView) subjectObservationView.classList.remove('hidden');
      navObservation.classList.add('active');
      const subSubject = document.getElementById('sub-obs-subject');
      if (subSubject) subSubject.classList.add('active');
      sessionStorage.setItem('lab_active_view', 'sub-observation');
    } else {
      observationView.classList.remove('hidden');
      
      // Handle sub-pages
      if (viewName === 'behavior-observation') {
        obsPageTitle.textContent = 'BEHAVIOR OBSERVATION';
        if (navAnalysis) navAnalysis.classList.add('active');
        const subBehavior = document.getElementById('sub-ana-behavior');
        if (subBehavior) subBehavior.classList.add('active');
        sessionStorage.setItem('lab_active_view', 'behavior-observation');
        adjustObsTelemetry('behavior');
        switchCameraFeed(3);
      } else {
        obsPageTitle.textContent = 'OBSERVATION';
        navObservation.classList.add('active');
        const subWall = document.getElementById('sub-obs-wall');
        if (subWall) subWall.classList.add('active');
        sessionStorage.setItem('lab_active_view', 'observation');
        adjustObsTelemetry('main');
        switchCameraFeed(1);
      }
    }
    
    // Toggle global watermark visibility (show on all views except 'home')
    const globalWatermark = document.querySelector('.dashboard-screen > .watermark-image-bg');
    if (globalWatermark) {
      if (viewName === 'home') {
        globalWatermark.classList.add('hidden');
      } else {
        globalWatermark.classList.remove('hidden');
      }
    }

    if (typeof updateSnapScrollState === 'function') {
      updateSnapScrollState();
    }
  }

  // Adjust telemetry data based on view
  function adjustObsTelemetry(type) {
    if (type === 'sub') {
      // Modify active feed subjects count and telemetry indicator slightly
      document.querySelector('.stat-card:nth-child(2) .stat-value').innerHTML = '252 <span class="stat-arrow text-red">↑ 18%</span>';
      document.querySelector('.stat-card:nth-child(3) .stat-value').innerHTML = '05 <span class="stat-arrow text-red">↑ 30%</span>';
    } else if (type === 'behavior') {
      // Scale anomaly levels and emphasize vectors
      document.querySelector('.stat-card:nth-child(2) .stat-value').innerHTML = '211 <span class="stat-arrow text-red">↓ 4%</span>';
      document.querySelector('.stat-card:nth-child(3) .stat-value').innerHTML = '11 <span class="stat-arrow text-red">↑ 90%</span>';
      // Flash vector chart
      const vectorChart = document.getElementById('behavior-vector-chart');
      if (vectorChart) {
        vectorChart.style.boxShadow = '0 0 15px rgba(233, 7, 2, 0.2)';
        setTimeout(() => { vectorChart.style.boxShadow = 'none'; }, 1000);
      }
    } else {
      // Reset to default Figma values
      document.querySelector('.stat-card:nth-child(2) .stat-value').innerHTML = '237 <span class="stat-arrow text-red">↑ 12%</span>';
      document.querySelector('.stat-card:nth-child(3) .stat-value').innerHTML = '03 <span class="stat-arrow text-red">↑ 25%</span>';
    }
  }

  // Bind view controls
  navSystem.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('home');
  });

  navObservation.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('observation');
  });

  if (navAnalysis) {
    navAnalysis.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('analysis');
    });
  }

  // Bind submenu item clicks
  submenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const id = item.getAttribute('id');
      if (id === 'sub-system-main') {
        switchView('home');
      } else if (id === 'sub-system-lab') {
        switchView('system');
      } else if (id === 'sub-obs-wall') {
        switchView('observation');
      } else if (id === 'sub-obs-subject') {
        switchView('sub-observation');
      } else if (id === 'sub-ana-behavior') {
        switchView('behavior-observation');
      } else if (id === 'sub-ana-analysis') {
        switchView('analysis');
      }
    });
  });

  // Bind logo click to go to Home landing page
  const navLogo = document.querySelector('.nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('home');
    });
  }

  // Bind Subject Observation bottom banner to navigate to Analysis
  const subNextBanner = document.querySelector('.sub-next-banner');
  if (subNextBanner) {
    subNextBanner.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('analysis');
    });
  }

  // Bind Analysis page feature cards to navigate to respective views
  const anaFeatCards = document.querySelectorAll('.ana-feature-card');
  if (anaFeatCards.length >= 3) {
    // Card 01 -> Observation
    anaFeatCards[0].addEventListener('click', (e) => {
      e.preventDefault();
      switchView('observation');
    });
    // Card 02 -> Sub-Observation
    anaFeatCards[1].addEventListener('click', (e) => {
      e.preventDefault();
      switchView('sub-observation');
    });
    // Card 03 -> System page (Lab identity)
    anaFeatCards[2].addEventListener('click', (e) => {
      e.preventDefault();
      switchView('system');
    });
  }

  // ==========================================================================
  // CLOCK & TIME SYNC LOGIC
  // ==========================================================================
  function startClock() {
    updateClock();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
  }

  function updateClock() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // System view clock
    if (timeDisplaySpan) {
      timeDisplaySpan.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Observation view logs clock
    const timestampStr = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    if (obsTimeStampDate) obsTimeStampDate.textContent = timestampStr;
    if (focusTimeOverlay) focusTimeOverlay.textContent = timestampStr;

    // Analysis view local clock
    const anaLocal = document.getElementById('ana-local');
    if (anaLocal) anaLocal.textContent = `${hours}:${minutes}:${seconds}`;

    // Subject Observation CCTV clock
    const subCctvTime = document.querySelector('.sub-cctv-time .time');
    const subCctvDate = document.querySelector('.sub-cctv-time .date');
    if (subCctvTime) subCctvTime.textContent = `${hours}:${minutes}:${seconds}`;
    if (subCctvDate) subCctvDate.textContent = `${year}-${month}-${date}`;

    // Increment Uptime
    tickUptime();
  }

  function tickUptime() {
    currentUptime.seconds++;
    if (currentUptime.seconds >= 60) {
      currentUptime.seconds = 0;
      currentUptime.minutes++;
      if (currentUptime.minutes >= 60) {
        currentUptime.minutes = 0;
        currentUptime.hours++;
        if (currentUptime.hours >= 24) {
          currentUptime.hours = 0;
          currentUptime.days++;
        }
      }
    }
    const dStr = String(currentUptime.days).padStart(2, '0');
    const hStr = String(currentUptime.hours).padStart(2, '0');
    const mStr = String(currentUptime.minutes).padStart(2, '0');
    const sStr = String(currentUptime.seconds).padStart(2, '0');
    
    // Update all uptime clock displays
    const uptimeStr = `${dStr}:${hStr}:${mStr}:${sStr}`;
    const uptimeDisplay = document.getElementById('uptime-display');
    if (uptimeDisplay) uptimeDisplay.textContent = uptimeStr;
    if (uptimeDisplayObs) uptimeDisplayObs.textContent = uptimeStr;

    // Uptime for Analysis view (HH:MM:SS format to fit widget)
    const anaUptime = document.getElementById('ana-uptime');
    if (anaUptime) {
      const totalHours = currentUptime.days * 24 + currentUptime.hours;
      const totalHoursStr = String(totalHours).padStart(2, '0');
      anaUptime.textContent = `${totalHoursStr}:${mStr}:${sStr}`;
    }
  }

  // ==========================================================================
  // BEHAVIOR VECTOR BARCODE CHART GENERATION
  // ==========================================================================
  function generateBehaviorVector() {
    const chart = document.getElementById('behavior-vector-chart');
    if (!chart) return;
    chart.innerHTML = '';
    
    const barCount = 45;
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.classList.add('behavior-bar');
      
      // Random height between 4px and 22px
      const height = Math.floor(Math.random() * 19) + 4;
      bar.style.height = `${height}px`;
      
      // Randomly make some bars red
      if (Math.random() < 0.2) {
        bar.classList.add('red');
      }
      
      chart.appendChild(bar);
    }
  }

  // Regenerate behavior vectors occasionally for telemetry animation
  setInterval(generateBehaviorVector, 3000);

  // ==========================================================================
  // INTERACTIVE CAMERA CHANNEL FEED SWITCHING
  // ==========================================================================
  const channelData = {
    1: {
      id: 'CH-01',
      loc: 'CONCOURSE A',
      unit: 'NULL-OPS-17',
      subject: 'SUBJECT_009',
      zone: 'A1',
      pos: '32, 7741, -96.7970',
      time: '14:27:31:08',
      duration: '00:00:12:14',
      track: 'TRK_8891',
      dir: 'NORTH',
      speed: '1.2m/s',
      interaction: 'NONE',
      density: 'MEDIUM',
      anomaly: '0.12',
      confidence: '87%',
      cropStyle: 'scale(1.8) translate(0%, 0%)',
      mainStyle: 'scale(1) translate(0%, 0%)'
    },
    2: {
      id: 'CH-02',
      loc: 'STATION LOBBY',
      unit: 'NULL-OPS-03',
      subject: 'SUBJECT_077',
      zone: 'B2',
      pos: '14, 5529, -12.4491',
      time: '14:27:31:08',
      duration: '00:04:32:02',
      track: 'TRK_3341',
      dir: 'WEST',
      speed: '0.8m/s',
      interaction: 'SUBJECT_142',
      density: 'HIGH',
      anomaly: '0.04',
      confidence: '94%',
      cropStyle: 'scale(2.2) translate(15%, -10%)',
      mainStyle: 'scale(1.3) translate(5%, -10%)'
    },
    3: {
      id: 'CH-03',
      loc: 'BAGGAGE RECLAIM',
      unit: 'NULL-OPS-11',
      subject: 'SUBJECT_142',
      zone: 'C3',
      pos: '88, 1204, -45.0089',
      time: '14:27:31:08',
      duration: '00:02:11:09',
      track: 'TRK_4502',
      dir: 'SOUTH',
      speed: '1.5m/s',
      interaction: 'SUBJECT_077',
      density: 'LOW',
      anomaly: '0.29',
      confidence: '71%',
      cropStyle: 'scale(2.5) translate(-15%, 5%)',
      mainStyle: 'scale(1.6) translate(-15%, 5%)'
    },
    4: {
      id: 'CH-04',
      loc: 'GATE D22 WALKWAY',
      unit: 'NULL-OPS-22',
      subject: 'SUBJECT_305',
      zone: 'D4',
      pos: '45, 9081, -73.1102',
      time: '14:27:31:08',
      duration: '00:01:04:17',
      track: 'TRK_0910',
      dir: 'EAST',
      speed: '1.9m/s',
      interaction: 'NONE',
      density: 'MEDIUM',
      anomaly: '0.67',
      confidence: '64%',
      cropStyle: 'scale(1.9) translate(10%, 15%)',
      mainStyle: 'scale(1.2) translate(10%, 15%)'
    }
  };

  function switchCameraFeed(chNum) {
    const data = channelData[chNum];
    if (!data) return;

    // Remove active state from all side feeds
    sideFeedCards.forEach(card => card.classList.remove('active'));

    // Highlight the clicked card if it exists in the side feeds
    const activeCard = document.querySelector(`.side-feed-card[data-channel="${chNum}"]`);
    if (activeCard) {
      activeCard.classList.add('active');
    }

    // Swap main feed styling/labels
    if (mainChannelId) mainChannelId.textContent = data.id;
    if (mainCameraId) mainCameraId.textContent = data.id;
    if (mainCameraLoc) mainCameraLoc.textContent = data.loc;
    if (mainCameraUnit) mainCameraUnit.textContent = data.unit;

    // Apply digital zooming effects to give illusion of multiple channels
    mainFeedImg.style.transform = data.mainStyle;
    
    // Swap focus subject crop view image position
    const cropImg = croppedSubjectView.querySelector('.cropped-subject-img');
    if (cropImg) {
      cropImg.style.transform = data.cropStyle;
    }

    // Swap Focus Extraction Telemetry Cards data
    focusSubjectId.textContent = data.subject;
    focusZone.textContent = data.zone;
    focusPos.textContent = data.pos;
    focusTime.textContent = data.time;
    focusDuration.textContent = data.duration;
    focusTrackId.textContent = data.track;
    focusDir.textContent = data.dir;
    focusSpeed.textContent = data.speed;
    focusInteraction.textContent = data.interaction;
    focusDensity.textContent = data.density;
    focusAnomaly.textContent = data.anomaly;
    focusConfidence.textContent = data.confidence;
    focusConfidenceFill.style.width = data.confidence;

    // Emphasize feedback on click
    mainChannelId.style.transform = 'scale(1.05)';
    setTimeout(() => { mainChannelId.style.transform = 'scale(1)'; }, 200);

    generateBehaviorVector();
  }

  // Bind click listeners on side feed thumbnails
  sideFeedCards.forEach(card => {
    card.addEventListener('click', () => {
      const channelNum = parseInt(card.getAttribute('data-channel'));
      
      // Let's swap: Clicked card becomes CH-01 in UI details
      // Swap card UI active indicator
      card.classList.add('active');
      
      // Trigger feed switch
      switchCameraFeed(channelNum);
    });
  });

  // ==========================================================================
  // REAL-TIME SYSTEM LOG LIST UPDATER
  // ==========================================================================
  const initialLogs = [
    { time: '14:27:31', ch: 'CH-01', subj: 'SUBJECT_009', action: 'TRACKING' },
    { time: '14:27:29', ch: 'CH-03', subj: 'SUBJECT_142', action: 'CLASSIFIED' },
    { time: '14:27:28', ch: 'CH-02', subj: 'SUBJECT_077', action: 'TRACKING' },
    { time: '14:27:27', ch: 'CH-04', subj: 'SUBJECT_305', action: 'CLASSIFIED' },
    { time: '14:27:26', ch: 'CH-01', subj: 'SUBJECT_118', action: 'EXIT ZONE' }
  ];

  function populateInitialLogs() {
    if (!logTableBody) return;
    logTableBody.innerHTML = '';
    initialLogs.forEach(entry => addLogEntry(entry.time, entry.ch, entry.subj, entry.action));
  }

  function addLogEntry(time, ch, subj, action) {
    const row = document.createElement('tr');
    row.classList.add('log-row');
    
    // Highlight action colors
    let actionStyle = 'color: #a1a1a1;';
    if (action === 'TRACKING') actionStyle = 'color: #00ff66;';
    else if (action === 'CLASSIFIED') actionStyle = 'color: #3b82f6;';
    else if (action === 'EXIT ZONE') actionStyle = 'color: #f59e0b;';
    else if (action === 'CRITICAL_EVENT' || action === 'VIOLATION') actionStyle = 'color: var(--accent-red);';

    row.innerHTML = `
      <td class="log-cell time">${time}</td>
      <td class="log-cell channel">${ch}</td>
      <td class="log-cell subject">${subj}</td>
      <td class="log-cell action" style="${actionStyle}">${action}</td>
    `;
    
    logTableBody.prepend(row);
  }

  const mockLogActions = ['TRACKING', 'CLASSIFIED', 'EXIT ZONE', 'DETECTED', 'ANALYZED'];
  const mockLogChannels = ['CH-01', 'CH-02', 'CH-03', 'CH-04'];
  const mockLogSubjects = ['SUBJECT_009', 'SUBJECT_118', 'SUBJECT_077', 'SUBJECT_142', 'SUBJECT_305', 'SUBJECT_041', 'SUBJECT_208'];

  function generateRandomLog() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    const ch = mockLogChannels[Math.floor(Math.random() * mockLogChannels.length)];
    const subj = mockLogSubjects[Math.floor(Math.random() * mockLogSubjects.length)];
    const action = mockLogActions[Math.floor(Math.random() * mockLogActions.length)];

    // Prepend new log
    addLogEntry(timeStr, ch, subj, action);

    // Limit log rows to 6
    const rows = logTableBody.querySelectorAll('.log-row');
    if (rows.length > 6) {
      logTableBody.removeChild(rows[rows.length - 1]);
    }
  }

  // ==========================================================================
  // AUTHENTICATION LOGIC (GATE LOG IN)
  // ==========================================================================
  function handleSuccess() {
    accessCodeInput.disabled = true;
    enterBtn.disabled = true;
    enterBtn.textContent = 'GRANTED';
    enterBtn.style.backgroundColor = '#00ff66';
    enterBtn.style.borderColor = '#00ff66';
    enterBtn.style.color = '#000000';
    enterBtn.style.boxShadow = '0 0 20px rgba(0, 255, 102, 0.6)';
    
    sessionStorage.setItem('lab_authenticated', 'true');
    sessionStorage.removeItem('lab_active_view'); // Reset active view to landing default (system) on login
    
    setTimeout(() => {
      gateScreen.classList.add('fade-out');
      
      setTimeout(() => {
        gateScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        dashboardScreen.classList.add('fade-in');
        
        initializeDashboard();
      }, 500);
    }, 400);
  }

  function handleFailure() {
    attempts++;
    attemptCountSpan.textContent = attempts;
    loginContainer.classList.add('shake');
    accessCodeInput.value = '';
    enterBtn.classList.remove('active');
    
    setTimeout(() => {
      loginContainer.classList.remove('shake');
      accessCodeInput.disabled = false;
      accessCodeInput.focus();
    }, 400);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = accessCodeInput.value.trim();
      if (code === '009') {
        handleSuccess();
      } else {
        handleFailure();
      }
    });
  }

  if (accessCodeInput) {
    accessCodeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
      if (e.target.value.trim().length > 0) {
        enterBtn.classList.add('active');
      } else {
        enterBtn.classList.remove('active');
      }
    });
  }

  // Initialize all active widgets once user enters dashboard
  function initializeDashboard() {
    startClock();
    generateBehaviorVector();
    populateInitialLogs();
    
    // Set active sub-view router (checks persisted session view, default to home)
    const activeView = sessionStorage.getItem('lab_active_view') || 'home';
    switchView(activeView);

    // Live log generator interval
    if (logInterval) clearInterval(logInterval);
    logInterval = setInterval(generateRandomLog, 6000);
  }

  // Check existing session state on load
  function checkSession() {
    const isAuthenticated = sessionStorage.getItem('lab_authenticated') === 'true';
    if (isAuthenticated) {
      gateScreen.classList.add('hidden');
      dashboardScreen.classList.remove('hidden');
      dashboardScreen.classList.add('fade-in');
      initializeDashboard();
    } else {
      if (accessCodeInput) {
        accessCodeInput.focus();
      }
    }
  }

  // ==========================================================================
  // SURVEILLANCE SNAP SCROLL & FULLSCREEN RECOIL (SYSTEM VIEW ONLY)
  // ==========================================================================
  const surveillanceSection = document.getElementById('surveillance-section');
  const surveillanceWrapper = document.getElementById('surveillance-wrapper');
  const heroSec = document.getElementById('hero-section');
  const dashboardContentSec = document.getElementById('dashboard-content-section');

  // Select the main page video and add ended transition listener
  const surveillanceVideo = document.getElementById('main-surveillance-video');
  if (surveillanceVideo) {
    surveillanceVideo.addEventListener('ended', () => {
      if (isSystemViewActive() && currentSlide === 2) {
        transitionToSlide(3);
      }
    });
  }
  
  let currentSlide = 1;
  let isTransitioning = false;

  function isSystemViewActive() {
    const isAuth = sessionStorage.getItem('lab_authenticated') === 'true';
    const activeView = sessionStorage.getItem('lab_active_view') || 'home';
    return isAuth && activeView === 'home';
  }

  function updateBackToTopVisibility() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;
    
    if (isSystemViewActive() && currentSlide > 1) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  function updateSnapScrollState() {
    if (isSystemViewActive()) {
      document.body.classList.add('snap-scroll-enabled');
      currentSlide = 1;
      isTransitioning = false;
      ignoreWheelUntilPause = false;
      window.scrollTo(0, 0);
    } else {
      document.body.classList.remove('snap-scroll-enabled');
    }
    updateBackToTopVisibility();
  }

  let ignoreWheelUntilPause = false;
  let wheelTimeout = null;

  function transitionToSlide(slideNum) {
    if (isTransitioning) return;
    if (introTimeout) clearTimeout(introTimeout); // Prevent conflict on manual navigation

    isTransitioning = true;
    ignoreWheelUntilPause = true;
    currentSlide = slideNum;
    
    updateBackToTopVisibility();

    // Shrink and fade hero texts if transitioning to Slide 2 or 3
    const heroTitleNull = document.querySelector('.hero-title-null');
    const heroTitleLab = document.querySelector('.hero-title-lab');
    const heroDesc = document.querySelector('.hero-desc');
    const heroNote = document.querySelector('.hero-note');
    if (slideNum === 2 || slideNum === 3) {
      if (heroTitleNull) {
        heroTitleNull.classList.remove('animate-in'); // Remove so forwards animation doesn't block fade
        heroTitleNull.style.transition = 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
        heroTitleNull.style.transform = 'scale(0.85)';
        heroTitleNull.style.opacity = '0';
      }
      if (heroTitleLab) { heroTitleLab.style.transform = 'scale(0.85)'; heroTitleLab.style.opacity = '0'; }
      if (heroDesc) { heroDesc.style.transform = 'scale(0.85)'; heroDesc.style.opacity = '0'; }
      if (heroNote) { heroNote.style.transform = 'scale(0.85)'; heroNote.style.opacity = '0'; }
    } else if (slideNum === 1) {
      if (heroTitleNull) { heroTitleNull.style.transform = 'scale(1)'; heroTitleNull.style.opacity = '1'; }
      if (heroTitleLab) { heroTitleLab.style.transform = 'scale(1)'; heroTitleLab.style.opacity = '1'; }
      if (heroDesc) { heroDesc.style.transform = 'scale(1)'; heroDesc.style.opacity = '1'; }
      if (heroNote) { heroNote.style.transform = 'scale(1)'; heroNote.style.opacity = '1'; }
    }

    // Play or pause the main surveillance video based on active slide
    const surveillanceVideo = document.getElementById('main-surveillance-video');
    if (surveillanceVideo) {
      if (slideNum === 2) {
        surveillanceVideo.style.transition = 'none';
        surveillanceVideo.style.opacity = '0';
        void surveillanceVideo.offsetWidth; // Trigger reflow
        surveillanceVideo.style.transition = 'opacity 1.5s ease-out';
        surveillanceVideo.style.opacity = '1';
        
        surveillanceVideo.currentTime = 0;
        surveillanceVideo.play().catch(err => console.log("Video auto-play failed/interrupted:", err));
      } else {
        surveillanceVideo.pause();
        surveillanceVideo.style.transition = 'none';
        surveillanceVideo.style.opacity = '0';
      }
    }
    
    let targetElement = null;
    if (slideNum === 1) {
      targetElement = heroSec;
    } else if (slideNum === 2) {
      targetElement = surveillanceSection;
    } else if (slideNum === 3) {
      targetElement = dashboardContentSec;
    }
    
    if (slideNum === 1) {
      const navbar = document.querySelector('.navbar');
      const heroTitleNull = document.querySelector('.hero-title-null');
      if (navbar) {
        navbar.classList.remove('animate-in');
        void navbar.offsetWidth; // Trigger reflow
        navbar.classList.add('animate-in');
      }
      if (heroTitleNull) {
        heroTitleNull.classList.remove('animate-in');
        void heroTitleNull.offsetWidth; // Trigger reflow
        heroTitleNull.classList.add('animate-in');
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetElement) {
      if (slideNum === 2) {
        if (surveillanceWrapper) {
          surveillanceWrapper.classList.remove('recoil-active');
          void surveillanceWrapper.offsetWidth; // Trigger reflow
          surveillanceWrapper.classList.add('recoil-active');
        }
      }
      
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    setTimeout(() => {
      isTransitioning = false;
    }, 1000);
  }

  function handleScrollDown() {
    if (currentSlide === 1) {
      transitionToSlide(2);
    } else if (currentSlide === 2) {
      transitionToSlide(3);
    }
  }

  function handleScrollUp() {
    if (currentSlide === 2) {
      transitionToSlide(1);
    } else if (currentSlide === 3) {
      transitionToSlide(2);
    }
  }

  // Intercept wheel events
  window.addEventListener('wheel', (e) => {
    if (!isSystemViewActive()) return;
    
    // Clear and reset the pause timeout to filter inertia
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      ignoreWheelUntilPause = false;
    }, 200);
    
    if (currentSlide === 1 || currentSlide === 2) {
      e.preventDefault();
      if (isTransitioning || ignoreWheelUntilPause) return;
      if (e.deltaY > 0) {
        handleScrollDown();
      } else if (e.deltaY < 0) {
        handleScrollUp();
      }
    } else if (currentSlide === 3) {
      if (window.scrollY <= 5 && e.deltaY < 0) {
        e.preventDefault();
        if (isTransitioning || ignoreWheelUntilPause) return;
        handleScrollUp();
      }
    }
  }, { passive: false });

  // Intercept touch events
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (!isSystemViewActive()) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isSystemViewActive()) return;
    
    const touchEndY = e.touches[0].clientY;
    const diffY = touchStartY - touchEndY; // positive is scroll down (swipe up)
    
    if (currentSlide === 1 || currentSlide === 2) {
      if (e.cancelable) e.preventDefault();
    } else if (currentSlide === 3) {
      if (window.scrollY <= 5 && diffY < 0) {
        if (e.cancelable) e.preventDefault();
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (!isSystemViewActive()) return;
    if (isTransitioning) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    const threshold = 50;
    
    if (Math.abs(diffY) > threshold) {
      if (diffY > 0) {
        if (currentSlide === 1 || currentSlide === 2) {
          handleScrollDown();
        }
      } else {
        if (currentSlide === 2) {
          handleScrollUp();
        } else if (currentSlide === 3) {
          if (window.scrollY <= 5) {
            handleScrollUp();
          }
        }
      }
    }
  }, { passive: true });

  // Keep state in sync with scroll position
  function syncCurrentSlideOnScroll() {
    if (!isSystemViewActive() || isTransitioning) return;
    
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const threshold = vh / 2;
    
    const survTop = surveillanceSection.offsetTop;
    const dashTop = dashboardContentSec.offsetTop;
    
    const prevSlide = currentSlide;
    if (scrollY < survTop - threshold) {
      currentSlide = 1;
    } else if (scrollY < dashTop - threshold) {
      currentSlide = 2;
    } else {
      currentSlide = 3;
    }
    
    if (prevSlide !== currentSlide) {
      updateBackToTopVisibility();
    }
  }

  window.addEventListener('scroll', syncCurrentSlideOnScroll);

  // Bind Back to Top button click event
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      if (isSystemViewActive()) {
        transitionToSlide(1);
      }
    });
  }

  window.updateSnapScrollState = updateSnapScrollState;

  // Run initial state checking
  checkSession();
});
