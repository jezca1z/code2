
/* =========================
   DOM
========================= */

const pages = document.querySelectorAll(".page");

const startBtn = document.getElementById("startBtn");
const storyNextBtn = document.getElementById("storyNextBtn");
const restartBtn = document.getElementById("restartBtn");
const audioToggle = document.getElementById("audioToggle");
const travelerImage = document.getElementById("travelerImage");
const travelerForm = document.getElementById("travelerForm");
const travelerNameInput = document.getElementById("travelerName");
const travelerGradeSelect = document.getElementById("travelerGrade");
const travelerProvinceInput = document.getElementById("travelerProvince");
const travelerInterestSelect = document.getElementById("travelerInterest");

const storyText = document.getElementById("storyText");
const storyCounter = document.getElementById("storyCounter");
const storyTitle = document.getElementById("storyTitle");
const storyImage = document.getElementById("storyImage");
const storyGuideName = document.getElementById("storyGuideName");
const travelerNameDisplay = document.getElementById("travelerNameDisplay");
const travelerPassCard = document.getElementById("travelerPassCard");
const travelerPassGrade = document.getElementById("travelerPassGrade");
const travelerPassProvince = document.getElementById("travelerPassProvince");
const travelerPassInterest = document.getElementById("travelerPassInterest");

const questionCount = document.getElementById("questionCount");
const questionIntro = document.getElementById("questionIntro");
const questionText = document.getElementById("questionText");
const questionArtwork = document.getElementById("questionArtwork");
const answerList = document.getElementById("answerList");
const questionProgress = document.getElementById("questionProgress");

const resultColor = document.getElementById("resultColor");
const resultTitle = document.getElementById("resultTitle");
const resultSubtitle = document.getElementById("resultSubtitle");
const resultDescription = document.getElementById("resultDescription");
const resultCareers = document.getElementById("resultCareers");

/* =========================
   AUDIO
========================= */

let audioEnabled = true;
let audioContext = null;
let masterGain = null;
let musicInterval = null;
let musicNoteIndex = 0;

const musicPattern = [
  { note: 523.25, chord: [261.63, 329.63, 392] },
  { note: 659.25 },
  { note: 783.99, sparkle: true },
  { note: 659.25 },
  { note: 587.33, chord: [196, 246.94, 293.66] },
  { note: 523.25 },
  { note: 392, sparkle: true },
  { note: 523.25 }
];

function updateAudioToggle() {
  audioToggle.textContent = audioEnabled ? "♫ เปิดเสียง" : "♫ ปิดเสียง";
  audioToggle.setAttribute("aria-label", audioEnabled ? "ปิดเสียง" : "เปิดเสียง");
  audioToggle.setAttribute("aria-pressed", String(audioEnabled));
}

function playTone(frequency, duration, volume, waveform, attack, delay = 0) {
  const startedAt = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, startedAt);
  gain.gain.setValueAtTime(0.0001, startedAt);
  gain.gain.linearRampToValueAtTime(volume, startedAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + duration + 0.02);
}

function playMusicStep() {
  if (!audioEnabled || !audioContext || audioContext.state !== "running") return;

  const step = musicPattern[musicNoteIndex];
  playTone(step.note, 0.56, 0.09, "triangle", 0.025);

  if (step.chord) {
    step.chord.forEach(frequency => {
      playTone(frequency, 1.3, 0.018, "sine", 0.18);
    });
  }
  if (step.sparkle) {
    playTone(step.note * 2, 0.38, 0.016, "sine", 0.04, 0.05);
  }

  musicNoteIndex = (musicNoteIndex + 1) % musicPattern.length;
}

function stopBackgroundMusic() {
  if (musicInterval !== null) {
    window.clearInterval(musicInterval);
    musicInterval = null;
  }

  if (audioContext && masterGain) {
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.04);
  }
}

async function setAudioEnabled(enabled) {
  audioEnabled = enabled;

  if (!audioEnabled) {
    stopBackgroundMusic();
    updateAudioToggle();
    return;
  }

  try {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      throw new Error("Web Audio API is not supported in this browser.");
    }

    if (!audioContext) {
      audioContext = new AudioContextConstructor();
      masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0, audioContext.currentTime);
      masterGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    if (!audioEnabled) return;
    if (audioContext.state !== "running") {
      throw new Error("AudioContext did not enter the running state.");
    }

    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0.24, audioContext.currentTime, 0.18);
    if (musicInterval === null) {
      playMusicStep();
      musicInterval = window.setInterval(playMusicStep, 720);
    }
    updateAudioToggle();
  } catch (error) {
    console.error("Could not start background audio.", error);
    audioEnabled = false;
    updateAudioToggle();
  }
}

function playAnswerClick() {
  if (!audioEnabled || !audioContext || audioContext.state !== "running") return;

  playTone(740, 0.08, 0.42, "triangle", 0.003);
  playTone(1040, 0.045, 0.16, "sine", 0.002);
}

function playCelebrationSound() {
  if (!audioEnabled || !audioContext || audioContext.state !== "running") return;

  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    playTone(frequency, 0.65, 0.22, "sine", 0.018, index * 0.11);
  });
}

audioToggle.addEventListener("click", () => {
  setAudioEnabled(!audioEnabled);
});
updateAudioToggle();

/* =========================
   DRAGGABLE ARTWORK
========================= */

const artworkDragStates = new WeakMap();

function setArtworkTransform(image, state, rotation = 0, skew = 0, scaleX = 1, scaleY = 1) {
  image.style.setProperty("--drag-x", `${state.offsetX}px`);
  image.style.setProperty("--drag-y", `${state.offsetY}px`);
  image.style.setProperty("--drag-rotation", `${rotation}deg`);
  image.style.setProperty("--drag-skew", `${skew}deg`);
  image.style.setProperty("--drag-scale-x", scaleX);
  image.style.setProperty("--drag-scale-y", scaleY);
}

function resetArtworkPosition(image) {
  const state = artworkDragStates.get(image);

  if (!state) return;

  state.releaseAnimation?.cancel();
  state.releaseAnimation = null;
  state.offsetX = 0;
  state.offsetY = 0;
  setArtworkTransform(image, state);
}

function makeArtworkDraggable(image) {
  const state = {
    offsetX: 0,
    offsetY: 0,
    pointerId: null,
    velocityX: 0,
    velocityY: 0,
    releaseAnimation: null
  };

  artworkDragStates.set(image, state);

  image.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    state.releaseAnimation?.cancel();
    state.releaseAnimation = null;

    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startOffsetX = state.offsetX;
    state.startOffsetY = state.offsetY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastTime = event.timeStamp;
    state.velocityX = 0;
    state.velocityY = 0;

    image.classList.add("is-dragging");
    image.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  image.addEventListener("pointermove", event => {
    if (event.pointerId !== state.pointerId) return;

    const elapsed = Math.max(event.timeStamp - state.lastTime, 1);
    state.velocityX = (event.clientX - state.lastX) / elapsed;
    state.velocityY = (event.clientY - state.lastY) / elapsed;
    state.offsetX = state.startOffsetX + event.clientX - state.startX;
    state.offsetY = state.startOffsetY + event.clientY - state.startY;

    const speed = Math.hypot(state.velocityX, state.velocityY);
    const rotation = Math.max(-14, Math.min(14, state.velocityX * 1.3 + state.velocityY * 0.35));
    const skew = Math.max(-5, Math.min(5, state.velocityX * 0.2));
    const stretch = Math.min(speed / 35, 0.07);

    setArtworkTransform(
      image,
      state,
      rotation,
      skew,
      1 + stretch,
      1 - stretch * 0.65
    );

    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastTime = event.timeStamp;
  });

  const releaseArtwork = event => {
    if (event.pointerId !== state.pointerId) return;

    state.pointerId = null;
    image.classList.remove("is-dragging");

    const speed = Math.hypot(state.velocityX, state.velocityY);
    const rotation = Math.max(-14, Math.min(14, state.velocityX * 1.3 + state.velocityY * 0.35));
    const overshootX = Math.max(-12, Math.min(12, state.velocityX * 7));
    const overshootY = Math.max(-12, Math.min(12, state.velocityY * 7));
    const settledTransform = `translate3d(${state.offsetX}px, ${state.offsetY}px, 0) rotate(0deg) skewX(0deg) scale(1, 1)`;
    const animation = image.animate([
      { transform: getComputedStyle(image).transform },
      {
        transform: `translate3d(${state.offsetX + overshootX}px, ${state.offsetY + overshootY}px, 0) rotate(${-rotation * 0.22}deg) scale(1.055, 0.95)`
      },
      {
        transform: `translate3d(${state.offsetX}px, ${state.offsetY}px, 0) rotate(${rotation * 0.12}deg) scale(0.98, 1.025)`
      },
      { transform: settledTransform }
    ], {
      duration: Math.min(650, 420 + speed * 35),
      easing: "cubic-bezier(0.2, 0.8, 0.25, 1)"
    });
    state.releaseAnimation = animation;

    animation.onfinish = () => {
      setArtworkTransform(image, state);
      animation.cancel();
      state.releaseAnimation = null;
    };
  };

  image.addEventListener("pointerup", releaseArtwork);
  image.addEventListener("pointercancel", releaseArtwork);
}

makeArtworkDraggable(storyImage);
makeArtworkDraggable(questionArtwork);
makeArtworkDraggable(travelerImage);


/* =========================
   STORY
========================= */

const branchOrder = ["DGA", "DGD", "IGD", "AFX", "DEN"];

const branches = {
  DGA: {
    district: "ย่านศิลป์ — ตรอกจินตนาการ",
    major: "Digital Arts",
    title: "ศิลปินผู้สร้างโลกใหม่",
    color: "#D9A7FF",
    guide: "ศิลปินสูงวัยยื่นขวดสีวิเศษให้ แล้วชวนมองหาตัวละครและโลกที่ยังไม่มีใครวาด",
    careerPrompt: "เธออยากเป็นคนแบบไหนในเมืองนี้?",
    careers: ["Character Designer", "Concept Artist / Background Artist", "Webtoon / Comic / Storyboard Artist", "Illustrator / Art Toy / Sticker Creator"],
    ending: "ภาพวาดของเธอเป็นสีแรกที่แต้มชีวิตให้เมือง ทุกคนเงยหน้ามองและเห็นโลกที่เคยฝันถึง"
  },
  DGD: {
    district: "ย่านดีไซน์ — ถนนเอกลักษณ์",
    major: "Digital Graphic Design",
    title: "นักออกแบบอัตลักษณ์เมือง",
    color: "#77D8FF",
    guide: "นักออกแบบยืนหน้าร้านที่ยังไม่มีป้าย และชวนทำให้ผู้คนจำเมืองนี้ได้",
    careerPrompt: "เธออยากฝากลายเซ็นไว้ตรงไหนในเมืองนี้?",
    careers: ["Brand Identity Designer", "UI Designer", "Packaging Designer", "Art Director / Key Visual Designer"],
    ending: "ป้ายและภาพลักษณ์ใหม่ทำให้ทั้งเมืองมีเอกลักษณ์ ผู้คนรู้ทันทีว่ากำลังอยู่ที่ Imagine City"
  },
  IGD: {
    district: "ย่านเกม — สนามแห่งการเล่น",
    major: "Interactive and Game Design",
    title: "นักออกแบบโลกแห่งเกม",
    color: "#FFE77A",
    guide: "หัวหน้าสนามเกมชวนเพื่อน ๆ มาสร้างกติกาและโลกที่ทุกคนอยากเข้าไปเล่น",
    careerPrompt: "เกมของเธอจะเริ่มจากอะไร?",
    careers: ["Game Designer / Level Designer", "Game Artist", "VR / AR Designer", "Game Producer"],
    ending: "เมืองทั้งเมืองกลายเป็นสนามเล่น ผู้คนหัวเราะและผจญภัยไปด้วยกันจนไม่อยากให้เกมจบ"
  },
  AFX: {
    district: "ย่านภาพยนตร์ — กำแพงแห่งเรื่องราว",
    major: "Computer Animation and Visual Effects",
    title: "นักสร้างภาพเคลื่อนไหว",
    color: "#FF9F9F",
    guide: "ผู้กำกับลึกลับยื่นสคริปต์ให้ แล้วเปิดฉากที่รอภาพเคลื่อนไหวและเอฟเฟกต์จากเธอ",
    careerPrompt: "เธออยากสร้างส่วนไหนของเรื่องราวให้มีชีวิต?",
    careers: ["3D Animator / Rigging Artist", "3D Modeler / Texture Artist", "VFX Artist", "Compositor"],
    ending: "ภาพเคลื่อนไหวของเธอทำให้ท้องฟ้าสว่างวาบ ทั้งเมืองได้เห็นสิ่งที่เคยคิดว่าเป็นไปไม่ได้"
  },
  DEN: {
    district: "ย่านบันเทิง — เวทีแห่งตัวตน",
    major: "Digital Entertainment",
    title: "ผู้เล่าเรื่องบนเวที",
    color: "#92EBC1",
    guide: "พิธีกรประจำเมืองยื่นไมค์ให้ แล้วชวนรวมผู้คนมาเป็นส่วนหนึ่งของเรื่องเดียวกัน",
    careerPrompt: "บทบาทไหนทำให้เธออยากก้าวขึ้นเวที?",
    careers: ["Content Creator / Scriptwriter", "Event / Show Producer", "Virtual Talent / Streaming Producer", "Entertainment Marketer / Community Manager"],
    ending: "เธอไม่ได้ขึ้นเวทีคนเดียว แต่ทำให้เพื่อน ๆ และผู้คนทั้งเมืองได้ร่วมสร้างช่วงเวลานี้ไปด้วยกัน"
  }
};

const storyChapters = [
  {
    title: "ตื่นขึ้นในเมืองไร้สี",
    text: "Imagine City เคยเต็มไปด้วยภาพวาด ป้ายไฟ เสียงเพลง และเกมที่ใครก็เล่นได้ แต่คืนนี้ทุกอย่างซีดเป็นสีเทา เธอตื่นขึ้นกลางจัตุรัสโดยไม่รู้ว่ามาถึงได้อย่างไร โมจิ แมวลายขาวดำก้าวออกมาจากภาพบนกำแพงและบอกว่าเหลือเวลาอีกแค่คืนนี้ก่อนสีจะหายไปตลอดกาล โมจิจะเป็นไกด์ให้เธอ แต่ทุกทางแยกเธอต้องเลือกเอง",
    image: "chapter1.png"
  },
  {
    title: "ปัญหาของชาวเมือง",
    text: "โมจิพาเธอออกจากจัตุรัสไปตามถนนทั้งห้าสาย ระหว่างทางมีชาวเมืองที่กำลังเดือดร้อน ทั้งสะพานที่พัง เด็กน้อยที่ทำตัวการ์ตูนหาย และร้านเก่าแก่ที่ใกล้ปิด เธอจะใช้ความถนัดแบบไหนช่วยพวกเขาดีนะ",
    image: "chapter2.png"
  },
  {
    title: "ย่านของเธอ",
    text: "หลังช่วยร้านเก่าแก่ โมจิพาเธอไปยังย่านที่ใกล้ตัวที่สุด อาจเป็นหนึ่งย่านหรือสองย่านถ้าเธอลังเล เลือกบทบาทที่อยากลองทำ แล้วเตรียมผ่านด่านประตูหินก่อนเดินทางต่อ",
    image: "chapter3.png"
  },
  {
    title: "เพื่อนร่วมทาง",
    text: "ประตูหินเปิดออก และเธอก็ไม่ได้เดินทางคนเดียวอีกต่อไป ที่ลานน้ำพุมีเพื่อนนักเดินทางสี่คนรออยู่ ทุกคนมีจุดแข็งต่างกัน แต่เมื่อต้องเลือกเส้นทางต่อไป พวกเขากลับเห็นไม่ตรงกัน",
    image: "chapter2.png"
  },
  {
    title: "คืนเทศกาล",
    text: "ฟ้ามืดลง ไฟทั่วเมืองเริ่มติด และเทศกาล Imagine Design Event กำลังจะเริ่ม เหลือเพียงเวทีใหญ่ที่ยังว่างอยู่ ถ้าเธอและเพื่อน ๆ ทำให้ผู้คนกลับมายิ้มได้ สีสันทั้งหมดก็จะคืนสู่เมือง",
    image: "chapter3.png"
  }
];

let currentChapter = 0;
let travelerDetails = null;


/* =========================
   QUESTIONS
========================= */

const branchAnswers = options => options.map(([text, branch]) => ({ text, branch }));

const questions = [
  {
    scene: "1.1",
    intro: "แมวบอกว่าเมืองเหลือเวลาอีกแค่คืนนี้ สิ่งแรกที่เธอทำคือ...",
    text: "จะช่วย Imagine City เริ่มกลับมามีสีได้อย่างไร?",
    answers: branchAnswers([
      ["หยิบชอล์กขึ้นมาวาดสีบนกำแพง", "DGA"],
      ["จัดป้ายที่ซีดให้อ่านง่ายและเป็นระเบียบ", "DGD"],
      ["ถามแมวถึงกติกาและวิธีผ่านด่านของเมือง", "IGD"],
      ["ลองขยับสิ่งของรอบตัวเพื่อหาว่าเกิดอะไรขึ้น", "AFX"],
      ["เรียกชาวเมืองมารวมตัวกันที่จัตุรัส", "DEN"]
    ])
  },
  {
    scene: "1.2",
    intro: "ดวงไฟนำทางบอกว่าเอาของติดตัวไปได้เพียงชิ้นเดียว...",
    text: "เธอจะเลือกหยิบอะไร?",
    answers: branchAnswers([
      ["สมุดสเก็ตช์ที่วาดได้ไม่รู้จบ", "DGA"],
      ["ชุดสีกับตัวอักษรที่ช่วยจัดทุกอย่างให้เข้าที่", "DGD"],
      ["ตลับเกมเก่าที่ยังไม่มีใครรู้วิธีเล่น", "IGD"],
      ["กล้องฟิล์มที่ทำให้ภาพถ่ายเคลื่อนไหวได้", "AFX"],
      ["ไมโครโฟนที่ส่งเสียงไปได้ทั่วเมือง", "DEN"]
    ])
  },
  {
    scene: "1.3",
    intro: "ปลายจัตุรัสมีถนนห้าสาย แต่ละสายมีเสียงและแสงต่างกัน...",
    text: "เธอจะเดินเข้าถนนสายไหนก่อน?",
    answers: branchAnswers([
      ["ตรอกที่กำแพงเต็มไปด้วยภาพวาด", "DGA"],
      ["ถนนที่เรียงรายด้วยป้ายร้านและโลโก้", "DGD"],
      ["ทางที่มีเสียงเกมกับแสงไฟหลากสี", "IGD"],
      ["ตรอกที่มีเสียงเครื่องฉายและควันเอฟเฟกต์", "AFX"],
      ["ถนนที่มีเสียงเพลงและผู้คนมารวมตัวกัน", "DEN"]
    ])
  },
  {
    scene: "2.1",
    intro: "แมวพาเธอไปถึงสะพานข้ามแม่น้ำที่พังไปครึ่งหนึ่ง มีชาวเมืองรออยู่อีกฝั่ง...",
    text: "เธอจะช่วยให้ทุกคนข้ามไปได้อย่างไร?",
    answers: branchAnswers([
      ["วาดสะพานใหม่ด้วยเส้นและสีในแบบของตัวเอง", "DGA"],
      ["ทำป้ายเตือนและป้ายบอกทางอ้อมให้ชัดเจน", "DGD"],
      ["แก้กลไกของสะพานให้กลับมาทำงาน", "IGD"],
      ["สร้างภาพสะพานที่ค่อย ๆ ประกอบตัวให้ทุกคนเห็น", "AFX"],
      ["ชวนชาวเมืองมาช่วยซ่อมแล้วฉลองด้วยกัน", "DEN"]
    ])
  },
  {
    scene: "2.2",
    intro: "เด็กน้อยร้องไห้อยู่ข้างทาง เพราะตัวการ์ตูนตัวโปรดของเขาหายไปจากเมือง...",
    text: "เธอจะช่วยให้เด็กคนนั้นยิ้มได้อย่างไร?",
    answers: branchAnswers([
      ["วาดตัวการ์ตูนตัวนั้นขึ้นมาใหม่", "DGA"],
      ["ทำสติกเกอร์ โปสเตอร์ และของที่ระลึกให้เก็บไว้", "DGD"],
      ["สร้างเกมเล็ก ๆ ให้เด็กได้เล่นกับตัวการ์ตูน", "IGD"],
      ["ทำให้ตัวการ์ตูนขยับและพูดคุยกับเด็กได้", "AFX"],
      ["ชวนเด็กคนอื่นมาล้อมวงฟังเรื่องของตัวการ์ตูน", "DEN"]
    ])
  },
  {
    scene: "2.3",
    intro: "เจ้าของร้านเก่าแก่บอกว่าไม่มีใครรู้จักร้านของเขาแล้ว...",
    text: "เธอจะตอบเขาว่าอย่างไร?",
    answers: branchAnswers([
      ["จะวาดภาพให้ร้านมีเอกลักษณ์ไม่เหมือนใคร", "DGA"],
      ["จะทำแบรนด์ใหม่ตั้งแต่โลโก้ไปจนถึงป้ายร้าน", "DGD"],
      ["จะทำให้การเข้าร้านเหมือนเริ่มเกมสนุก ๆ", "IGD"],
      ["จะทำคลิปแนะนำร้านให้ทั้งน่าตื่นเต้นและน่าจดจำ", "AFX"],
      ["จะจัดงานและช่วยประชาสัมพันธ์ให้คนกลับมา", "DEN"]
    ])
  },
  {
    scene: "3.1",
    intro: "ก่อนถึงย่านของเธอ มีประตูหินบานใหญ่ขวางอยู่...",
    text: "เธอพร้อมฝึกทักษะอะไรทุกวันเพื่อเปิดประตู?",
    answers: branchAnswers([
      ["วาดรูปและสังเกตโลกรอบตัวให้ละเอียดขึ้น", "DGA"],
      ["จัดองค์ประกอบ สี และตัวอักษรให้ลงตัว", "DGD"],
      ["คิดเป็นระบบและวางขั้นตอนให้ชัดเจน", "IGD"],
      ["ทำภาพเคลื่อนไหวให้ดูมีชีวิตและสมจริง", "AFX"],
      ["เล่าเรื่องและประสานผู้คนให้ไปทางเดียวกัน", "DEN"]
    ])
  },
  {
    scene: "4.1",
    intro: "เมื่อประตูเปิดออก แมวพาเธอไปพบเพื่อนนักเดินทางสี่คนที่ลานน้ำพุ...",
    text: "เธอจะช่วยให้ทุกคนใช้จุดแข็งของตัวเองได้อย่างไร?",
    answers: branchAnswers([
      ["วาดภาพช่วยให้ทุกคนเห็นตรงกัน", "DGA"],
      ["ทำคู่มือให้งานของทุกคนดูลงตัวและเป็นระเบียบ", "DGD"],
      ["คิดวิธีทำงานร่วมกันให้ทุกคนสนุกกับการเดินทาง", "IGD"],
      ["ทำตัวอย่างสั้น ๆ ให้เห็นแผนก่อนลงมือจริง", "AFX"],
      ["เป็นคนกลางที่ทำให้ทุกคนอยากเดินไปด้วยกัน", "DEN"]
    ])
  },
  {
    scene: "4.2",
    intro: "กลางทาง เพื่อนสองกลุ่มเห็นไม่ตรงกันว่าจะไปทางไหน...",
    text: "เธอจะช่วยให้พวกเขาตัดสินใจอย่างไร?",
    answers: branchAnswers([
      ["วาดแผนที่ให้เห็นว่าทางเลือกแต่ละทางไปไหน", "DGA"],
      ["ทำตารางเปรียบเทียบให้เลือกได้ง่ายขึ้น", "DGD"],
      ["ลองเดินทั้งสองทางแล้วดูผลลัพธ์", "IGD"],
      ["ทำภาพจำลองให้เห็นปลายทางของแต่ละทาง", "AFX"],
      ["ฟังทุกคนก่อนแล้วหาจุดที่ยอมรับร่วมกันได้", "DEN"]
    ])
  },
  {
    scene: "5.1",
    intro: "ฟ้ามืดลง ไฟทั่วเมืองเริ่มติด เหลือเพียงเวทีใหญ่ที่ยังว่าง...",
    text: "เธออยากมอบการแสดงแบบไหนให้ทั้งเมือง?",
    answers: branchAnswers([
      ["ภาพวาดขนาดยักษ์ที่ทุกคนเงยหน้ามอง", "DGA"],
      ["ภาพลักษณ์ใหม่ที่ทำให้ทุกมุมของเมืองมีเอกลักษณ์", "DGD"],
      ["เกมที่คนทั้งเมืองเข้ามาเล่นพร้อมกัน", "IGD"],
      ["โชว์ภาพเคลื่อนไหวและเอฟเฟกต์ที่ทำให้ทั้งลานตะลึง", "AFX"],
      ["การแสดงสดที่ทุกคนมีส่วนร่วมได้", "DEN"]
    ])
  },
  {
    scene: "5.2",
    intro: "สีค่อย ๆ กลับมาทั่วเมือง ผู้คนหันมามองเธอ...",
    text: "เธออยากให้พวกเขาจำเธอในฐานะใคร?",
    answers: branchAnswers([
      ["คนที่ให้กำเนิดตัวละครที่ทุกคนรัก", "DGA"],
      ["คนที่ทำให้เมืองมีภาพลักษณ์และเอกลักษณ์", "DGD"],
      ["คนที่สร้างโลกให้ทุกคนได้เข้ามาเล่น", "IGD"],
      ["คนที่ทำให้สิ่งที่ดูเป็นไปไม่ได้กลายเป็นจริง", "AFX"],
      ["คนที่พาทุกคนมารวมกัน", "DEN"]
    ])
  }
];

const choiceEchoes = {
  DGA: "เส้นสีจากย่านศิลป์เริ่มปรากฏบนกำแพง",
  DGD: "ป้ายที่ชัดเจนค่อย ๆ ทำให้เมืองกลับมามีเอกลักษณ์",
  IGD: "กลไกและกติกาใหม่ทำให้เมืองเริ่มขยับ",
  AFX: "ภาพเคลื่อนไหวเติมแสงให้ถนนที่มืดมิด",
  DEN: "เสียงของผู้คนพาแสงสีให้กลับมารวมกัน"
};

const mixedResultTitles = {
  "DGA+DGD": "นักออกแบบที่เล่าเรื่องด้วยภาพวาด",
  "DGA+IGD": "นักวาดโลกของเกม",
  "DGA+AFX": "นักวาดที่ทำให้ภาพมีชีวิต",
  "DGA+DEN": "ครีเอเตอร์สายวาด",
  "DGD+IGD": "นักออกแบบประสบการณ์",
  "DGD+AFX": "นักออกแบบที่ทำให้ภาพขยับ",
  "DGD+DEN": "นักออกแบบที่เล่าเรื่องเก่ง",
  "IGD+AFX": "นักสร้างโลกเสมือนจริง",
  "IGD+DEN": "นักสร้างสนามเล่นให้คนมารวมกัน",
  "AFX+DEN": "นักเล่าเรื่องด้วยภาพยนตร์"
};


/* =========================
   SCORE
========================= */

let score = createScore();

let currentQuestion = 0;
let selectedAnswer = null;
let lastChoiceType = null;
let isCareerSelection = false;
let careerOptions = [];
let careerRoutes = [];
let selectedCareer = null;
let finalChoiceBranch = null;

const worldColors = Object.fromEntries(
  branchOrder.map(branch => [branch, branches[branch].color])
);
const splashPalette = ["#FF4D9D", "#00D9FF", "#FFE14D", "#72F56B", "#A66CFF", "#FF7B45"];

const colorSplashCanvas = document.createElement("canvas");
colorSplashCanvas.id = "color-splash-canvas";
colorSplashCanvas.setAttribute("aria-hidden", "true");
document.body.prepend(colorSplashCanvas);

const colorSplashContext = colorSplashCanvas.getContext("2d");
const colorSplashes = [];
const confettiPieces = [];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let splashAnimationFrame = null;
let lastColoredStep = 0;
let splashCount = 0;
let colorSplashesEnabled = false;

function drawColorSplashes(timestamp) {
  splashAnimationFrame = null;
  const width = window.innerWidth;
  const height = window.innerHeight;
  let hasActiveSplash = false;
  let hasActiveConfetti = false;

  colorSplashContext.clearRect(0, 0, width, height);

  colorSplashes.forEach(splash => {
    const progress = prefersReducedMotion
      ? 1
      : Math.min((timestamp - splash.createdAt) / splash.duration, 1);
    const expansion = 0.28 + 0.72 * (1 - Math.pow(1 - progress, 3));
    const radius = splash.radius * expansion;

    colorSplashContext.globalAlpha = 0.32 + (progress < 1 ? Math.sin(progress * Math.PI) * 0.14 : 0);
    colorSplashContext.fillStyle = splash.color;
    const points = splash.lobes.map((lobe, index) => {
      const angle = (index / splash.lobes.length) * Math.PI * 2;
      return {
        x: splash.x + Math.cos(angle) * radius * lobe,
        y: splash.y + Math.sin(angle) * radius * lobe
      };
    });
    colorSplashContext.beginPath();
    const lastPoint = points[points.length - 1];
    colorSplashContext.moveTo(
      (lastPoint.x + points[0].x) / 2,
      (lastPoint.y + points[0].y) / 2
    );
    points.forEach((point, index) => {
      const nextPoint = points[(index + 1) % points.length];
      colorSplashContext.quadraticCurveTo(
        point.x,
        point.y,
        (point.x + nextPoint.x) / 2,
        (point.y + nextPoint.y) / 2
      );
    });
    colorSplashContext.closePath();
    colorSplashContext.fill();

    splash.droplets.forEach(drop => {
      const distance = drop.distance * expansion;
      colorSplashContext.fillStyle = drop.color;
      colorSplashContext.beginPath();
      colorSplashContext.arc(
        splash.x + Math.cos(drop.angle) * distance,
        splash.y + Math.sin(drop.angle) * distance,
        drop.radius * expansion,
        0,
        Math.PI * 2
      );
      colorSplashContext.fill();
    });

    if (progress < 1) hasActiveSplash = true;
  });

  for (let index = confettiPieces.length - 1; index >= 0; index--) {
    const piece = confettiPieces[index];

    if (!prefersReducedMotion) {
      piece.x += piece.drift + Math.sin(timestamp * 0.002 + piece.phase) * 0.6;
      piece.y += piece.speed;
      piece.rotation += piece.spin;
      if (piece.y > height + piece.height) {
        confettiPieces.splice(index, 1);
        continue;
      }
      hasActiveConfetti = true;
    }

    colorSplashContext.save();
    colorSplashContext.globalAlpha = piece.opacity;
    colorSplashContext.fillStyle = piece.color;
    colorSplashContext.translate(piece.x, piece.y);
    colorSplashContext.rotate(piece.rotation);
    colorSplashContext.fillRect(
      -piece.width / 2,
      -piece.height / 2,
      piece.width,
      piece.height
    );
    colorSplashContext.restore();
  }

  colorSplashContext.globalAlpha = 1;
  if ((hasActiveSplash || hasActiveConfetti) && !prefersReducedMotion) {
    splashAnimationFrame = window.requestAnimationFrame(drawColorSplashes);
  }
}

function addColorSplash(color) {
  const radius = 24 + Math.random() * 26;
  const corner = splashCount % 4;
  const mainColor = splashPalette[splashCount % splashPalette.length];
  splashCount++;
  const x = corner === 0 || corner === 3
    ? 0.08 + Math.random() * 0.14
    : 0.78 + Math.random() * 0.14;
  const y = corner < 2
    ? 0.08 + Math.random() * 0.16
    : 0.76 + Math.random() * 0.16;

  colorSplashes.push({
    x: window.innerWidth * x,
    y: window.innerHeight * y,
    color: mainColor,
    radius,
    createdAt: performance.now(),
    duration: 900,
    lobes: Array.from({ length: 32 }, () => 0.86 + Math.random() * 0.22),
    droplets: Array.from({ length: 8 }, (_, index) => ({
      angle: Math.random() * Math.PI * 2,
      distance: radius * (0.9 + Math.random() * 1.1),
      radius: 1.5 + Math.random() * 3,
      color: index === 0
        ? color
        : splashPalette[(splashCount + index) % splashPalette.length]
    }))
  });
  if (colorSplashes.length > 4) colorSplashes.shift();

  if (splashAnimationFrame === null) {
    drawColorSplashes(performance.now());
  }
}

function resizeColorSplashCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  if (splashAnimationFrame !== null) {
    window.cancelAnimationFrame(splashAnimationFrame);
    splashAnimationFrame = null;
  }
  colorSplashCanvas.width = Math.round(window.innerWidth * pixelRatio);
  colorSplashCanvas.height = Math.round(window.innerHeight * pixelRatio);
  colorSplashContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawColorSplashes(performance.now());
}

function clearColorSplashes() {
  colorSplashes.length = 0;
  confettiPieces.length = 0;
  splashCount = 0;
  if (splashAnimationFrame !== null) {
    window.cancelAnimationFrame(splashAnimationFrame);
    splashAnimationFrame = null;
  }
  colorSplashContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function startConfetti() {
  const pieceCount = prefersReducedMotion ? 28 : 100;

  confettiPieces.length = 0;
  for (let index = 0; index < pieceCount; index++) {
    confettiPieces.push({
      x: Math.random() * window.innerWidth,
      y: prefersReducedMotion
        ? Math.random() * window.innerHeight
        : -12 - Math.random() * window.innerHeight * 0.35,
      width: 4 + Math.random() * 5,
      height: 7 + Math.random() * 8,
      speed: 1.8 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 1.2,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.07,
      opacity: 0.72 + Math.random() * 0.25,
      color: splashPalette[Math.floor(Math.random() * splashPalette.length)]
    });
  }

  if (splashAnimationFrame === null) {
    drawColorSplashes(performance.now());
  }
}

window.addEventListener("resize", resizeColorSplashCanvas);
resizeColorSplashCanvas();

function createScore() {
  return Object.fromEntries(branchOrder.map(branch => [branch, 0]));
}

function hexToRgb(hex) {
  return [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
}

function getTargetWorldColor(completedSteps) {
  const answerCount = Object.values(score).reduce((total, value) => total + value, 0);
  const storyMoodOrder = branchOrder.slice(0, 3);
  return answerCount === 0
    ? hexToRgb(worldColors[storyMoodOrder[Math.min(Math.max(completedSteps - 1, 0), storyMoodOrder.length - 1)]])
    : Object.entries(score).reduce((totals, [type, value]) => {
      hexToRgb(worldColors[type]).forEach((channel, index) => {
        totals[index] += channel * value;
      });
      return totals;
    }, [0, 0, 0]).map(channel => channel / answerCount);
}

function updateWorldColor(completedSteps) {
  const targetColor = getTargetWorldColor(completedSteps);
  const progress = Math.min(Math.max(completedSteps / (storyChapters.length + questions.length), 0), 1);
  const colorStrength = progress * 0.48;
  const color = targetColor.map(channel => Math.round(8 + (channel - 8) * colorStrength));

  if (document.getElementById("ending").classList.contains("active")) {
    document.body.style.backgroundColor = `rgb(${color.join(", ")})`;
  }

  if (colorSplashesEnabled && completedSteps > lastColoredStep) {
    addColorSplash(`rgb(${targetColor.map(Math.round).join(", ")})`);
  }
  lastColoredStep = completedSteps;
}

function resetGame() {
  currentChapter = 0;
  currentQuestion = 0;
  score = createScore();
  selectedAnswer = null;
  lastChoiceType = null;
  isCareerSelection = false;
  careerOptions = [];
  careerRoutes = [];
  selectedCareer = null;
  finalChoiceBranch = null;
  lastColoredStep = 0;
  colorSplashesEnabled = false;
  clearColorSplashes();
  document.body.style.backgroundColor = "#080808";
  questionProgress.style.width = "0%";
  updateWorldColor(0);
}


/* =========================
   PAGE CONTROL
========================= */

function showPage(pageId) {

  pages.forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId)
    .classList.add("active");

}


/* =========================
   START
========================= */

startBtn.addEventListener("click", () => {

  resetGame();
  if (audioEnabled) setAudioEnabled(true);
  travelerForm.reset();
  travelerNameInput.setCustomValidity("");
  travelerProvinceInput.setCustomValidity("");
  travelerDetails = null;
  showPage("traveler");

});

travelerNameInput.addEventListener("input", () => {
  travelerNameInput.setCustomValidity("");
});

travelerProvinceInput.addEventListener("input", () => {
  travelerProvinceInput.setCustomValidity("");
});

travelerForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = travelerNameInput.value.trim();
  const province = travelerProvinceInput.value.trim();
  travelerNameInput.setCustomValidity(name ? "" : "พิมพ์ชื่อที่อยากให้โมจิเรียกก่อนนะ");
  travelerProvinceInput.setCustomValidity(province ? "" : "บอกโมจิด้วยว่ามาจากจังหวัดไหน");

  if (!travelerForm.reportValidity()) return;

  travelerDetails = {
    name,
    grade: travelerGradeSelect.value,
    province,
    interest: travelerInterestSelect.value
  };
  const interestName = travelerDetails.interest === "UNDECIDED"
    ? "ยังไม่แน่ใจ"
    : branches[travelerDetails.interest].major;

  storyGuideName.textContent = "โมจิ · ไกด์นำทาง";
  travelerNameDisplay.textContent = `ผู้เดินทาง: ${travelerDetails.name}`;
  travelerPassGrade.textContent = `ชั้น ${travelerDetails.grade}`;
  travelerPassProvince.textContent = `จังหวัด ${travelerDetails.province}`;
  travelerPassInterest.textContent = `สาขาที่สนใจ: ${interestName}`;

  currentChapter = 0;
  showStory();
  showPage("story");
});


/* =========================
   STORY DISPLAY
========================= */

function showStory() {

  const chapter = storyChapters[currentChapter];
  const welcome = currentChapter === 0
    ? `โมจิยิ้มให้ ${travelerDetails.name} แล้วทักว่า “ยินดีที่ได้รู้จักนะ!” `
    : "";
  storyTitle.textContent = chapter.title;
  storyText.textContent = `${welcome}${chapter.text}`;
  travelerPassCard.hidden = currentChapter !== 0;

  storyImage.src =
    chapter.image;

  resetArtworkPosition(storyImage);

  storyImage.alt =
    `โมจิ แมวนำทางในบทที่ ${currentChapter + 1}`;

  storyCounter.textContent =
    `บทที่ ${currentChapter + 1}`;

  const answerCount = Object.values(score).reduce((total, value) => total + value, 0);
  updateWorldColor(storyChapters.length + answerCount);

}


/* =========================
   STORY NEXT
========================= */

storyNextBtn.addEventListener("click", () => {

  continueChapter();

});


/* =========================
   START QUIZ
========================= */

function startQuiz(questionIndex) {
  currentQuestion = questionIndex;
  isCareerSelection = false;
  const answerCount = Object.values(score).reduce((total, value) => total + value, 0);
  updateWorldColor(storyChapters.length + answerCount);

  showPage("quiz");

  renderQuestion();

}

function continueChapter() {
  if (currentChapter === 2) {
    currentQuestion = 6;
    showPage("quiz");
    renderCareerSelection();
    return;
  }

  const firstQuestionByChapter = [0, 3, null, 7, 9];
  startQuiz(firstQuestionByChapter[currentChapter]);
}

function shuffleAnswers(answers) {
  const shuffled = [...answers];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getChapterLabel(chapterNumber) {
  return `บทที่ ${chapterNumber} · ${storyChapters[chapterNumber - 1].title}`;
}


/* =========================
   RENDER QUESTION
========================= */

function renderQuestion() {

  const question = questions[currentQuestion];

  if (currentQuestion === 1 && !colorSplashesEnabled) {
    colorSplashesEnabled = true;
    const color = getTargetWorldColor(storyChapters.length + 1);
    addColorSplash(`rgb(${color.map(Math.round).join(", ")})`);
  }

  selectedAnswer = null;

  const questionNumber = currentQuestion + 1;

  const chapterNumber = Number(question.scene.split(".")[0]);
  questionCount.textContent =
    getChapterLabel(chapterNumber);

  questionIntro.textContent = lastChoiceType
    ? `${choiceEchoes[lastChoiceType]} ${question.intro}`
    : question.intro;

  questionText.textContent =
    question.text;

  resetArtworkPosition(questionArtwork);

  if (currentQuestion < 6) {
    questionArtwork.src =
      `artboard-${currentQuestion + 1}.png`;
    questionArtwork.parentElement.hidden = false;
  } else {
    questionArtwork.parentElement.hidden = true;
  }

  answerList.innerHTML = "";

  shuffleAnswers(question.answers).forEach(answer => {

    const button = document.createElement("button");

    button.className = "answer-btn";
    button.dataset.mood = answer.branch.toLowerCase();

    button.textContent = answer.text;

    button.addEventListener("click", () => {

      selectAnswer(answer, button);

    });

    answerList.appendChild(button);

  });


  /* Progress */

  const progress =
    (questionNumber / questions.length) * 100;

  questionProgress.style.width =
    `${progress}%`;

}

function getNeighborhoodRoutes() {
  const rankedBranches = branchOrder
    .map(branch => ({ branch, points: score[branch] }))
    .sort((first, second) => second.points - first.points);
  const [leading, second] = rankedBranches;

  return leading.points - second.points <= 1
    ? [leading.branch, second.branch]
    : [leading.branch];
}

function renderCareerSelection() {
  isCareerSelection = true;
  selectedAnswer = null;
  careerRoutes = getNeighborhoodRoutes();
  careerOptions = careerRoutes.flatMap(branch => (
    branches[branch].careers.map(career => ({ branch, career }))
  ));

  questionCount.textContent = getChapterLabel(3);
  questionIntro.textContent = careerRoutes
    .map(branch => `${branches[branch].district}: ${branches[branch].guide}`)
    .join(" ");
  questionText.textContent = careerRoutes
    .map(branch => branches[branch].careerPrompt)
    .join(" หรือ ");

  resetArtworkPosition(questionArtwork);
  questionArtwork.parentElement.hidden = true;
  answerList.innerHTML = "";

  careerOptions.forEach(careerOption => {
    const button = document.createElement("button");

    button.className = "answer-btn";
    button.dataset.mood = careerOption.branch.toLowerCase();
    button.textContent = careerOption.career;
    button.addEventListener("click", () => selectCareer(careerOption, button));

    answerList.appendChild(button);
  });

  questionProgress.style.width =
    `${(6 / questions.length) * 100}%`;
}


/* =========================
   SELECT ANSWER
========================= */

function selectAnswer(answer, selectedButton) {

  if (selectedAnswer !== null) return;

  playAnswerClick();
  selectedAnswer = answer.branch;
  score[answer.branch]++;
  lastChoiceType = answer.branch;
  if (currentQuestion === questions.length - 1) {
    finalChoiceBranch = answer.branch;
  }
  updateWorldColor(storyChapters.length + currentQuestion + 1);

  const buttons =
    answerList.querySelectorAll(".answer-btn");

  buttons.forEach(button => {

    button.disabled = true;

  });

  selectedButton.classList.add("is-selected");


  setTimeout(() => {

    nextQuestion();

  }, 350);

}

function selectCareer(careerOption, selectedButton) {
  if (selectedAnswer !== null) return;

  playAnswerClick();
  selectedAnswer = careerOption.career;
  selectedCareer = careerOption;
  lastChoiceType = careerOption.branch;

  answerList.querySelectorAll(".answer-btn").forEach(button => {
    button.disabled = true;
  });
  selectedButton.classList.add("is-selected");

  setTimeout(() => {
    isCareerSelection = false;
    renderQuestion();
  }, 350);
}


/* =========================
   NEXT QUESTION
========================= */

function nextQuestion() {

  const nextChapterByQuestion = {
    2: 1,
    5: 2,
    6: 3,
    8: 4
  };
  const nextChapter = nextChapterByQuestion[currentQuestion];

  if (nextChapter !== undefined) {
    currentChapter = nextChapter;
    showStory();
    showPage("story");
    return;
  }

  if (currentQuestion === questions.length - 1) {
    showResult();
    return;
  }

  currentQuestion++;
  renderQuestion();

}


/* =========================
   FIND RESULT
========================= */

function getResult() {

  const rankedBranches = branchOrder
    .map(branch => ({ branch, points: score[branch] }))
    .sort((first, second) => second.points - first.points);
  const [leading, second] = rankedBranches;
  let resultBranches;

  if (leading.points === second.points) {
    resultBranches = [finalChoiceBranch || leading.branch];
  } else if (leading.points - second.points <= 1) {
    resultBranches = [leading.branch, second.branch];
  } else {
    resultBranches = [leading.branch];
  }

  const outcome = resultBranches.map(branch => branches[branch]);
  const career = selectedCareer || {
    branch: resultBranches[0],
    career: branches[resultBranches[0]].careers[0]
  };
  const otherCareers = resultBranches
    .flatMap(branch => branches[branch].careers.map(name => ({ name, branch })))
    .filter(option => option.name !== career.career || option.branch !== career.branch);
  const color = outcome
    .map(result => hexToRgb(result.color))
    .reduce((total, rgb) => total.map((channel, index) => channel + rgb[index]), [0, 0, 0])
    .map(channel => Math.round(channel / outcome.length));
  const resultTitle = resultBranches.length === 1
    ? outcome[0].title
    : mixedResultTitles[[...resultBranches]
      .sort((first, second) => branchOrder.indexOf(first) - branchOrder.indexOf(second))
      .join("+")];

  return {
    title: resultTitle,
    subtitle: outcome.map(result => `สาขา ${result.major}`).join(" + "),
    color: `rgb(${color.join(", ")})`,
    description: outcome.map(result => result.ending).join(" "),
    selectedCareer: {
      name: career.career,
      major: branches[career.branch].major
    },
    relatedCareers: otherCareers.map(option => ({
      name: option.name,
      major: branches[option.branch].major
    }))
  };

}

function createCareerCard(career, isSelected, color) {
  const card = document.createElement("article");
  card.className = isSelected
    ? "career-card career-card-selected"
    : "career-card";
  card.style.setProperty("--career-accent", color);

  const name = document.createElement("p");
  name.className = "career-card-name";
  name.textContent = career.name;

  const major = document.createElement("p");
  major.className = "career-card-major";
  major.textContent = `สาขา ${career.major}`;

  card.append(name, major);
  return card;
}

function renderCareerResults(result) {
  resultCareers.replaceChildren();

  const groups = [
    { title: "อาชีพที่เลือก", careers: [result.selectedCareer], isSelected: true },
    { title: "อาชีพที่เกี่ยวข้อง", careers: result.relatedCareers, isSelected: false }
  ];

  groups.forEach(groupData => {
    const group = document.createElement("section");
    group.className = "career-group";

    const heading = document.createElement("h2");
    heading.className = "career-group-title";
    heading.textContent = groupData.title;

    const cards = document.createElement("div");
    cards.className = "career-card-grid";
    groupData.careers.forEach(career => {
      cards.append(createCareerCard(career, groupData.isSelected, result.color));
    });

    group.append(heading, cards);
    resultCareers.append(group);
  });
}


/* =========================
   SHOW RESULT
========================= */

function showResult() {

  const result = getResult();

  resultColor.style.backgroundColor =
    result.color;

  resultTitle.textContent =
    result.title;

  resultSubtitle.textContent =
    result.subtitle;

  resultDescription.textContent =
    result.description;

  renderCareerResults(result);

  showPage("ending");
  updateWorldColor(storyChapters.length + questions.length);
  startConfetti();
  playCelebrationSound();

}


/* =========================
   RESTART
========================= */

restartBtn.addEventListener("click", () => {

  resetGame();

  showPage("intro");

});
