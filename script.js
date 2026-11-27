
/* =========================
   DOM
========================= */

const pages = document.querySelectorAll(".page");

const startBtn = document.getElementById("startBtn");
const storyNextBtn = document.getElementById("storyNextBtn");
const restartBtn = document.getElementById("restartBtn");

const storyText = document.getElementById("storyText");
const storyCounter = document.getElementById("storyCounter");
const storyImage = document.getElementById("storyImage");

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
const resultMessage = document.getElementById("resultMessage");

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

  image.getAnimations().forEach(animation => animation.cancel());
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
    velocityY: 0
  };

  artworkDragStates.set(image, state);

  image.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    image.getAnimations().forEach(animation => animation.cancel());

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

    animation.onfinish = () => {
      setArtworkTransform(image, state);
      animation.cancel();
    };
  };

  image.addEventListener("pointerup", releaseArtwork);
  image.addEventListener("pointercancel", releaseArtwork);
}

makeArtworkDraggable(storyImage);
makeArtworkDraggable(questionArtwork);


/* =========================
   STORY
========================= */

const storyPages = [
  {
    text: "คืนก่อนวันจัดแสดงผลงานของคณะ ไฟในสตูดิโอดับลงทีละดวง สีบนชิ้นงานและรอบตัวเพื่อน ๆ ค่อย ๆ จางหาย เหลือเพียงแมวลายเส้นสีขาวที่กระโดดลงมาจากโต๊ะ",
    image: "chapter1.png"
  },

  {
    text: "แมวแนะนำตัวว่าเป็นไกด์ของสาขา และบอกว่าสีไม่ได้หายไปไหน มันซ่อนอยู่ในไอเดีย ความทรงจำ และน้ำใจที่เพื่อนมีให้กัน ถ้าช่วยกันก่อนฟ้าสาง สีของคณะก็จะกลับมา",
    image: "chapter2.png"
  },

  {
    text: "แมวพาทุกคนออกจากสตูดิโอไปตามหาสีที่กระจัดกระจาย ทุกการตัดสินใจช่วยให้ผลงานและพื้นที่รอบตัวมีสีขึ้นทีละน้อย แต่สีสุดท้ายจะเป็นแบบไหน ขึ้นอยู่กับสิ่งที่พวกเขาเลือกทำร่วมกัน",
    image: "chapter3.png"
  }
];

let currentStory = 0;


/* =========================
   QUESTIONS
========================= */

const questions = [

  {
    intro: "แมว : แผ่นสีแผ่นแรกหายไปจากงานของเพื่อน...",
    text: "พวกเราควรเริ่มช่วยกันจากตรงไหน?",

    answers: [
      { text: "ลองวิธีใหม่ แม้ยังไม่มีใครเคยทำ", type: "FREE" },
      { text: "ชวนเจ้าของงานเล่าว่าตั้งใจสื่ออะไร", type: "MEMORY" },
      { text: "เปิดเพลงที่ทุกคนชอบแล้วเริ่มลงมือด้วยกัน", type: "HAPPY" },
      { text: "ค่อย ๆ ตรวจงานและหาจุดที่สีเริ่มหาย", type: "CALM" }
    ]
  },

  {
    intro: "แมว : ที่โต๊ะมุมห้อง มีเพื่อนคนหนึ่งยังทำงานอยู่ลำพัง...",
    text: "เราจะชวนเขามาร่วมตามหาสีได้อย่างไร?",

    answers: [
      { text: "ชวนเขาทดลองทำชิ้นงานในแบบของตัวเอง", type: "FREE" },
      { text: "เข้าไปนั่งข้าง ๆ และฟังว่าเขากังวลอะไร", type: "MEMORY" },
      { text: "ชวนพักเบรกสั้น ๆ ให้หายเหนื่อยก่อน", type: "HAPPY" },
      { text: "ช่วยแบ่งงานให้พอดีและวางแผนไปด้วยกัน", type: "CALM" }
    ]
  },

  {
    intro: "แมว : บนบอร์ดมีภาพร่างจากหลายวิชา แต่บางส่วนซีดหาย...",
    text: "อะไรจะช่วยให้ทุกคนต่อไอเดียเข้าด้วยกัน?",

    answers: [
      { text: "เปิดพื้นที่ให้แต่ละคนลองเสนอไอเดียที่ต่างกัน", type: "FREE" },
      { text: "หยิบเรื่องราวและแรงบันดาลใจของเพื่อนมาเชื่อมกัน", type: "MEMORY" },
      { text: "เปลี่ยนเป็นกิจกรรมวาดต่อภาพที่ทุกคนเล่นได้", type: "HAPPY" },
      { text: "จัดหมวดภาพร่างแล้วเรียงลำดับให้เห็นภาพรวม", type: "CALM" }
    ]
  },

  {
    intro: "แมว : พอเดินถึงโถงคณะ ความเห็นของทีมก็เริ่มไม่ตรงกัน...",
    text: "เราจะตัดสินใจอย่างไรโดยไม่ทิ้งใครไว้ข้างหลัง?",

    answers: [
      { text: "ลองทำต้นแบบสองแนวแล้วดูว่าแนวไหนพาไปต่อได้", type: "FREE" },
      { text: "ให้ทุกคนเล่าเหตุผล แล้วหาจุดที่เห็นตรงกัน", type: "MEMORY" },
      { text: "พักหายใจ หามุกขำ ๆ แล้วกลับมาคุยกันใหม่", type: "HAPPY" },
      { text: "เขียนข้อดีข้อเสียและเลือกแผนที่ทำได้จริง", type: "CALM" }
    ]
  },

  {
    intro: "แมวพาไปถึงทางเชื่อมระหว่างห้องเรียนกับสตูดิโอ...",
    text: "ป้ายบอกทางหายไป เราจะพาเพื่อน ๆ ไปต่ออย่างไร?",

    answers: [
      { text: "สำรวจทางเดินใหม่แล้ววาดแผนที่ขึ้นมาเอง", type: "FREE" },
      { text: "ถามรุ่นพี่ที่จำเรื่องราวของตึกนี้ได้", type: "MEMORY" },
      { text: "ทำป้ายสีสด ๆ ให้ทุกคนช่วยกันติด", type: "HAPPY" },
      { text: "เช็กแผนผังอาคารและเลือกทางที่ปลอดภัยที่สุด", type: "CALM" }
    ]
  },

  {
    intro: "แมว : มีเพื่อนปีหนึ่งยืนถือผลงานอยู่หน้าห้อง ไม่กล้าเอาไปวาง...",
    text: "พวกเราจะช่วยให้เขากล้าร่วมงานได้อย่างไร?",

    answers: [
      { text: "ชวนเขาลองจัดวางผลงานในแบบที่อยากนำเสนอ", type: "FREE" },
      { text: "บอกว่าเราจะอยู่ข้าง ๆ และช่วยแนะนำให้", type: "MEMORY" },
      { text: "ชวนเพื่อน ๆ มาชมและให้กำลังใจพร้อมกัน", type: "HAPPY" },
      { text: "ช่วยหามุมจัดแสดงที่เขารู้สึกสบายใจ", type: "CALM" }
    ]
  },

  {
    intro: "แมวเปิดโปรเจกเตอร์เก่าของสาขา ภาพผลงานเริ่มมีสีขึ้นมานิดหนึ่ง...",
    text: "เราควรใช้แสงที่เหลืออยู่ทำอะไรต่อ?",

    answers: [
      { text: "ฉายภาพทดลองหลายแบบเพื่อหาแนวทางที่ไม่เคยลอง", type: "FREE" },
      { text: "ฉายภาพเบื้องหลังที่เพื่อน ๆ ทำงานด้วยกัน", type: "MEMORY" },
      { text: "ฉายภาพสนุก ๆ ให้ทั้งคณะมาช่วยเติมสี", type: "HAPPY" },
      { text: "ปรับแสงทีละจุดเพื่อให้ทุกชิ้นงานมองเห็นชัด", type: "CALM" }
    ]
  },

  {
    intro: "ใกล้ถึงเวลาเปิดนิทรรศการ แต่ทีมยังต้องเตรียมอีกหลายอย่าง...",
    text: "เราควรจัดการช่วงเวลาสุดท้ายอย่างไร?",

    answers: [
      { text: "แบ่งทีมลองทำรายละเอียดใหม่ที่ยังขาดอยู่", type: "FREE" },
      { text: "เช็กให้แน่ใจว่าทุกคนได้มีส่วนในผลงาน", type: "MEMORY" },
      { text: "ชวนกันทำงานพร้อมเสียงเพลงและกำลังใจ", type: "HAPPY" },
      { text: "เรียงลำดับงานสำคัญแล้วค่อย ๆ ทำทีละอย่าง", type: "CALM" }
    ]
  },

  {
    intro: "ผลงานส่วนใหญ่กลับมามีสีแล้ว แต่ยังมีมุมหนึ่งที่เงียบและว่างเปล่า...",
    text: "เราจะเติมพื้นที่นั้นด้วยอะไร?",

    answers: [
      { text: "งานทดลองที่เปิดโอกาสให้คนดูคิดต่อเอง", type: "FREE" },
      { text: "เรื่องเล่าจากเพื่อน ๆ ในคณะและสาขา", type: "MEMORY" },
      { text: "กิจกรรมสั้น ๆ ที่ชวนทุกคนมาสนุกด้วยกัน", type: "HAPPY" },
      { text: "มุมพักที่เรียบง่ายและให้ทุกคนได้หยุดมองงาน", type: "CALM" }
    ]
  },

  {
    intro: "แมวถามก่อนแสงเช้าจะมาถึง...",
    text: "ถ้าจะมอบสีสุดท้ายให้คณะของเรา อยากให้สีนั้นแทนอะไร?",

    answers: [
      { text: "อิสระที่จะคิดและเริ่มต้นสิ่งใหม่", type: "FREE" },
      { text: "มิตรภาพและความทรงจำที่สร้างด้วยกัน", type: "MEMORY" },
      { text: "ความสุขที่แบ่งปันกันได้ทั้งสาขา", type: "HAPPY" },
      { text: "ความสงบและพื้นที่ให้ทุกคนเป็นตัวเอง", type: "CALM" }
    ]
  }

];

const choiceEchoes = {
  FREE: "แมวพาเพื่อน ๆ ลองเส้นทางใหม่ และประกายสีฟ้าก็วาบขึ้น",
  MEMORY: "แมวรอให้ทุกคนเดินไปด้วยกัน สีม่วงอ่อนจึงค่อย ๆ ปรากฏ",
  HAPPY: "เสียงหัวเราะของเพื่อน ๆ เติมประกายสีเหลืองให้เมือง",
  CALM: "ทุกคนช่วยกันอย่างใจเย็น แสงสีเขียวจึงค่อย ๆ สว่างขึ้น"
};


/* =========================
   RESULT DATA
========================= */

const results = {

  FREE: {
    title: "THE FREE SOUL",
    subtitle: "สีของอิสระ — ฟ้า",
    color: "#69B9FF",

    description:
      "นายเป็นคนที่ต้องการพื้นที่ในการเป็นตัวเอง ไม่ชอบถูกจำกัดด้วยสิ่งที่คนอื่นกำหนด และยังอยากออกไปค้นพบโลกในแบบของตัวเอง",

    message:
      "อย่าลืมว่าอิสระไม่ได้หมายถึงการต้องเดินไปคนเดียวเสมอไป บางครั้งการยอมให้ใครเดินข้าง ๆ ก็ไม่ได้ทำให้นายสูญเสียตัวเอง"
  },

  MEMORY: {
    title: "THE KEEPER",
    subtitle: "สีของความทรงจำ — ม่วง",

    color: "#B89AFF",

    description:
      "นายเป็นคนที่ให้คุณค่ากับความสัมพันธ์และสิ่งที่ผ่านเข้ามาในชีวิต บางสิ่งอาจไม่ได้อยู่ตรงหน้าแล้ว แต่ยังมีความหมายกับนายเสมอ",

    message:
      "ความทรงจำไม่ได้มีไว้เพื่อทำให้เราติดอยู่กับอดีต แต่มันอาจเป็นหลักฐานว่าครั้งหนึ่งเราเคยมีช่วงเวลาที่ดี"
  },

  HAPPY: {
    title: "THE SUNSHINE",
    subtitle: "สีของความสุข — เหลือง",

    color: "#FFE16B",

    description:
      "นายอาจเป็นคนที่มองเห็นความสุขจากสิ่งเล็ก ๆ รอบตัว ไม่ว่าจะเป็นช่วงเวลาธรรมดา เสียงหัวเราะ หรือสิ่งที่คนอื่นอาจมองข้าม",

    message:
      "ไม่จำเป็นต้องมีความสุขตลอดเวลาเพื่อเป็นคนที่สดใส วันที่เหนื่อยก็เป็นส่วนหนึ่งของชีวิตเช่นกัน"
  },

  CALM: {
    title: "THE QUIET SOUL",
    subtitle: "สีของความสงบ — เขียว",

    color: "#91D8A5",

    description:
      "นายให้ความสำคัญกับความสงบ ความมั่นคง และการได้ใช้ชีวิตโดยไม่ต้องฝืนตัวเอง บางครั้งการไม่พูดอะไรอาจเป็นวิธีที่นายใช้ทำความเข้าใจโลก",

    message:
      "ความเงียบไม่ได้หมายความว่านายไม่มีอะไรอยู่ข้างใน บางครั้งมันเต็มไปด้วยสิ่งที่นายกำลังเรียนรู้ที่จะยอมรับ"
  }

};


/* =========================
   SCORE
========================= */

let score = {
  FREE: 0,
  MEMORY: 0,
  HAPPY: 0,
  CALM: 0
};

let currentQuestion = 0;
let selectedAnswer = null;
let lastChoiceType = null;

const worldColors = {
  FREE: "#69B9FF",
  MEMORY: "#B89AFF",
  HAPPY: "#FFE16B",
  CALM: "#91D8A5"
};

function hexToRgb(hex) {
  return [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
}

function updateWorldColor(completedSteps) {
  const answerCount = Object.values(score).reduce((total, value) => total + value, 0);
  const storyMoodOrder = ["FREE", "MEMORY", "HAPPY"];
  const targetColor = answerCount === 0
    ? hexToRgb(worldColors[storyMoodOrder[Math.min(Math.max(completedSteps - 1, 0), storyMoodOrder.length - 1)]])
    : Object.entries(score).reduce((totals, [type, value]) => {
      hexToRgb(worldColors[type]).forEach((channel, index) => {
        totals[index] += channel * value;
      });
      return totals;
    }, [0, 0, 0]).map(channel => channel / answerCount);
  const progress = Math.min(Math.max(completedSteps / (storyPages.length + questions.length), 0), 1);
  const colorStrength = progress * 0.42;
  const color = targetColor.map(channel => Math.round(8 + (channel - 8) * colorStrength));

  document.body.style.backgroundColor = `rgb(${color.join(", ")})`;
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

  currentStory = 0;
  lastChoiceType = null;
  updateWorldColor(0);

  showStory();

  showPage("story");

});


/* =========================
   STORY DISPLAY
========================= */

function showStory() {

  storyText.textContent =
    storyPages[currentStory].text;

  storyImage.src =
    storyPages[currentStory].image;

  resetArtworkPosition(storyImage);

  storyImage.alt =
    `แมวนำทางในฉากที่ ${currentStory + 1}`;

  storyCounter.textContent =
    `STORY ${currentStory + 1} / ${storyPages.length}`;

  updateWorldColor(currentStory + 1);

}


/* =========================
   STORY NEXT
========================= */

storyNextBtn.addEventListener("click", () => {

  currentStory++;

  if (currentStory < storyPages.length) {

    showStory();

  } else {

    startQuiz();

  }

});


/* =========================
   START QUIZ
========================= */

function startQuiz() {

  currentQuestion = 0;

  score = {
    FREE: 0,
    MEMORY: 0,
    HAPPY: 0,
    CALM: 0
  };
  lastChoiceType = null;
  updateWorldColor(storyPages.length);

  showPage("quiz");

  renderQuestion();

}


/* =========================
   RENDER QUESTION
========================= */

function renderQuestion() {

  const question = questions[currentQuestion];

  selectedAnswer = null;

  questionCount.textContent =
    `QUESTION ${currentQuestion + 1} / ${questions.length}`;

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

  question.answers.forEach((answer, index) => {

    const button = document.createElement("button");

    button.className = "answer-btn";
    button.dataset.mood = answer.type.toLowerCase();

    button.textContent = answer.text;

    button.addEventListener("click", () => {

      selectAnswer(index);

    });

    answerList.appendChild(button);

  });


  /* Progress */

  const progress =
    ((currentQuestion + 1) / questions.length) * 100;

  questionProgress.style.width =
    `${progress}%`;

}


/* =========================
   SELECT ANSWER
========================= */

function selectAnswer(index) {

  if (selectedAnswer !== null) return;

  selectedAnswer = index;

  const question = questions[currentQuestion];

  const answer = question.answers[index];

  score[answer.type]++;
  lastChoiceType = answer.type;
  updateWorldColor(storyPages.length + currentQuestion + 1);

  const buttons =
    answerList.querySelectorAll(".answer-btn");

  buttons.forEach(button => {

    button.disabled = true;

  });

  buttons[index].classList.add("is-selected");


  setTimeout(() => {

    nextQuestion();

  }, 350);

}


/* =========================
   NEXT QUESTION
========================= */

function nextQuestion() {

  currentQuestion++;

  if (currentQuestion < questions.length) {

    renderQuestion();

  } else {

    showResult();

  }

}


/* =========================
   FIND RESULT
========================= */

function getResult() {

  const types = Object.keys(score);

  let maxScore = -1;

  let winner = types[0];

  types.forEach(type => {

    if (score[type] > maxScore) {

      maxScore = score[type];

      winner = type;

    }

  });

  return results[winner];

}


/* =========================
   SHOW RESULT
========================= */

function showResult() {

  const result = getResult();
  updateWorldColor(storyPages.length + questions.length);

  resultColor.style.backgroundColor =
    result.color;

  resultTitle.textContent =
    result.title;

  resultSubtitle.textContent =
    result.subtitle;

  resultDescription.textContent =
    result.description;

  resultMessage.textContent =
    result.message;

  showPage("ending");

}


/* =========================
   RESTART
========================= */

restartBtn.addEventListener("click", () => {

  currentStory = 0;

  currentQuestion = 0;

  score = {
    FREE: 0,
    MEMORY: 0,
    HAPPY: 0,
    CALM: 0
  };
  lastChoiceType = null;

  questionProgress.style.width = "0%";
  updateWorldColor(0);

  showPage("intro");

});
