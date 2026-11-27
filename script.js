
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
    text: "ในเมืองที่ทุกอย่างเป็นสีดำและสีขาว เด็กคนหนึ่งใช้ชีวิตเหมือนเดิมทุกวัน ตื่นขึ้นมา เดินไปที่เดิม และกลับบ้านโดยไม่รู้ว่าตัวเองกำลังรออะไรอยู่",
    image: "chapter1.png"
  },

  {
    text: "คืนหนึ่ง ขณะที่กำลังเดินหลงอยู่ในถนนที่ไม่คุ้นเคย แมวตัวหนึ่งก็ปรากฏขึ้น มันมองเด็กคนนั้นแล้วพูดว่า... สีสุดท้ายกำลังจะหายไป ถ้าอยากรู้ว่ามันคือสีอะไร ก็เดินตามฉันมา",
    image: "chapter2.png"
  },

  {
    text: "แมวพาเด็กเดินผ่านสถานที่ที่ไม่เคยเห็นมาก่อน พร้อมถามคำถามแปลก ๆ ราวกับกำลังพยายามค้นหาบางสิ่งที่ซ่อนอยู่ในใจของเด็กคนนั้น",
    image: "chapter3.png"
  }
];

let currentStory = 0;


/* =========================
   QUESTIONS
========================= */

const questions = [

  {
    intro: "แมว : ถ้าไม่มีใครมองเห็นนายเลย...",
    text: "นายอยากใช้เวลาที่เหลือไปกับอะไร?",

    answers: [
      { text: "ออกไปลองอะไรที่ไม่เคยทำ", type: "FREE" },
      { text: "ไปหาคนที่คิดถึง", type: "MEMORY" },
      { text: "ทำอะไรเล็ก ๆ ที่ทำให้ยิ้มได้", type: "HAPPY" },
      { text: "นั่งเงียบ ๆ ปล่อยให้เวลาผ่านไป", type: "CALM" }
    ]
  },

  {
    intro: "แมว : แล้วถ้าพรุ่งนี้ไม่มีอะไรเหมือนเดิม...",
    text: "อะไรที่นายกลัวว่าจะหายไปมากที่สุด?",

    answers: [
      { text: "อิสระที่จะเลือกชีวิตตัวเอง", type: "FREE" },
      { text: "คนที่ทำให้รู้สึกว่าไม่ได้อยู่คนเดียว", type: "MEMORY" },
      { text: "ช่วงเวลาที่มีความสุข", type: "HAPPY" },
      { text: "ความรู้สึกปลอดภัย", type: "CALM" }
    ]
  },

  {
    intro: "แมว : มนุษย์นี่แปลกนะ...",
    text: "ถ้าเลือกเก็บหนึ่งช่วงเวลาไว้ตลอดไป นายจะเลือก?",

    answers: [
      { text: "วันที่ได้ทำตามใจตัวเอง", type: "FREE" },
      { text: "วันที่อยู่กับคนสำคัญ", type: "MEMORY" },
      { text: "วันที่หัวเราะจนหยุดไม่ได้", type: "HAPPY" },
      { text: "วันที่ไม่มีเรื่องให้กังวล", type: "CALM" }
    ]
  },

  {
    intro: "แมว : บางครั้งการเดินทางก็ไม่ได้สนุกเสมอไป...",
    text: "เมื่อเจอวันที่แย่ นายมักจะทำอย่างไร?",

    answers: [
      { text: "หนีไปที่ไหนสักแห่ง", type: "FREE" },
      { text: "คุยกับใครสักคนที่ไว้ใจ", type: "MEMORY" },
      { text: "หาอะไรที่ทำให้ตัวเองอารมณ์ดี", type: "HAPPY" },
      { text: "อยู่คนเดียวจนกว่าจะดีขึ้น", type: "CALM" }
    ]
  },

  {
    intro: "แมว : ถ้ามีประตูสี่บานอยู่ตรงหน้า...",
    text: "นายจะเปิดประตูที่พาไปไหน?",

    answers: [
      { text: "โลกที่ไม่มีข้อจำกัด", type: "FREE" },
      { text: "โลกที่ได้พบคนที่หายไป", type: "MEMORY" },
      { text: "โลกที่เต็มไปด้วยเรื่องสนุก", type: "HAPPY" },
      { text: "โลกที่ไม่มีเสียงรบกวน", type: "CALM" }
    ]
  },

  {
    intro: "แมว : นายเคยคิดถึงตัวเองในอดีตไหม...",
    text: "ถ้าได้ย้อนกลับไป นายอยากบอกอะไรกับตัวเอง?",

    answers: [
      { text: "อย่าหยุดลองสิ่งที่อยากทำ", type: "FREE" },
      { text: "อย่าลืมคนที่รักนาย", type: "MEMORY" },
      { text: "อย่าลืมหัวเราะให้มากกว่านี้", type: "HAPPY" },
      { text: "ไม่เป็นไรนะ ทุกอย่างจะค่อย ๆ ดีขึ้น", type: "CALM" }
    ]
  },

  {
    intro: "แมว : แล้วสิ่งเล็ก ๆ ที่ทำให้โลกยังน่าอยู่ล่ะ...",
    text: "สิ่งไหนทำให้นายรู้สึกว่าชีวิตมีความหมาย?",

    answers: [
      { text: "การได้ใช้ชีวิตในแบบของตัวเอง", type: "FREE" },
      { text: "การได้มีใครสักคนอยู่ข้าง ๆ", type: "MEMORY" },
      { text: "เสียงหัวเราะและความสนุก", type: "HAPPY" },
      { text: "ความสงบที่ไม่ต้องฝืนอะไร", type: "CALM" }
    ]
  },

  {
    intro: "แมว : ถ้านายต้องเลือกสิ่งหนึ่งเพื่อเดินต่อ...",
    text: "นายจะเลือกพกอะไรติดตัวไป?",

    answers: [
      { text: "ความกล้าที่จะเริ่มต้นใหม่", type: "FREE" },
      { text: "ความทรงจำที่มีค่า", type: "MEMORY" },
      { text: "ความหวังว่าจะมีเรื่องดี ๆ", type: "HAPPY" },
      { text: "ความรู้สึกว่าฉันยังเป็นฉัน", type: "CALM" }
    ]
  },

  {
    intro: "แมว : บางอย่างอาจไม่กลับมาอีกแล้ว...",
    text: "ถ้าต้องปล่อยบางสิ่งไป นายคิดว่าอะไรยากที่สุด?",

    answers: [
      { text: "การยอมรับว่าตัวเองไม่ได้เป็นอิสระเสมอไป", type: "FREE" },
      { text: "การบอกลาใครบางคน", type: "MEMORY" },
      { text: "การยอมรับว่าช่วงเวลาที่ดีจบลงแล้ว", type: "HAPPY" },
      { text: "การยอมรับการเปลี่ยนแปลง", type: "CALM" }
    ]
  },

  {
    intro: "แมว : คำถามสุดท้ายแล้ว...",
    text: "ถ้าสีสุดท้ายของโลกเป็นสิ่งที่นายต้องเลือกเอง นายอยากให้มันเป็นสีอะไรในความรู้สึก?",

    answers: [
      { text: "สีของการเริ่มต้นและอิสระ", type: "FREE" },
      { text: "สีของความทรงจำและความรัก", type: "MEMORY" },
      { text: "สีของความสุขและชีวิต", type: "HAPPY" },
      { text: "สีของความสงบและการยอมรับ", type: "CALM" }
    ]
  }

];


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

  questionIntro.textContent =
    question.intro;

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

  questionProgress.style.width = "0%";

  showPage("intro");

});
