export const vocabularyList = [
  {
    id: 1,
    word: "abandon",
    phonetic: "/əˈbændən/",
    meaning: "v. 放弃；抛弃；遗弃",
    example: "The ship was abandoned by its crew.",
    exampleTranslation: "船员们弃船而逃。",
  },
  {
    id: 2,
    word: "absolute",
    phonetic: "/ˈæbsəluːt/",
    meaning: "adj. 绝对的；完全的；毋庸置疑的",
    example: "She demanded absolute silence during the exam.",
    exampleTranslation: "她要求在考试期间绝对安静。",
  },
];

export const examData = [
  {
    id: 1,
    year: "2024年12月",
    title: "CET-6 真题模拟卷（一）",
    listening: {
      audioSrc: "",
      section: "短篇新闻",
      questions: [
        {
          id: 1,
          type: "listening",
          question: "What is the main cause of the delay mentioned in the news?",
          options: ["A. Bad weather", "B. Technical failure", "C. Staff shortage", "D. Traffic congestion"],
          answer: "A",
        },
        {
          id: 2,
          type: "listening",
          question: "How long will the delay approximately last?",
          options: ["A. 30 minutes", "B. 1 hour", "C. 2 hours", "D. Half a day"],
          answer: "C",
        },
      ],
    },
    reading: {
      section: "仔细阅读",
      passage: `Artificial intelligence is transforming the way we learn languages.
Unlike traditional classroom settings, AI-powered apps can adapt to each learner's pace,
identifying weak areas and providing targeted exercises. However, experts warn that
over-reliance on technology may reduce face-to-face communication skills.
The key lies in striking a balance between digital tools and human interaction.

Recent studies have shown that students who combine AI tools with traditional learning
methods outperform those who rely solely on either approach. The most effective strategy
appears to be using AI for repetitive practice and instant feedback, while reserving
classroom time for discussion, debate, and collaborative problem-solving.

Nevertheless, educational institutions face significant challenges in implementing
AI-driven solutions. Budget constraints, lack of teacher training, and concerns about
data privacy have slowed adoption in many schools. Policymakers are now grappling with
how to regulate AI in education without stifling innovation.`,
      questions: [
        {
          id: 3,
          type: "reading",
          question: "According to the passage, what is a potential drawback of AI language learning?",
          options: [
            "A. It is too expensive for most learners",
            "B. It may weaken interpersonal communication skills",
            "C. It cannot identify learners' weak areas",
            "D. It is slower than traditional methods",
          ],
          answer: "B",
        },
        {
          id: 4,
          type: "reading",
          question: "What does the passage suggest is the most effective learning approach?",
          options: [
            "A. Using only AI-powered apps",
            "B. Relying entirely on classroom instruction",
            "C. Combining AI tools with traditional methods",
            "D. Focusing exclusively on collaborative problem-solving",
          ],
          answer: "C",
        },
        {
          id: 5,
          type: "reading",
          question: "Which of the following is NOT mentioned as a challenge for schools adopting AI?",
          options: [
            "A. Budget constraints",
            "B. Lack of teacher training",
            "C. Student resistance to technology",
            "D. Data privacy concerns",
          ],
          answer: "C",
        },
      ],
    },
    writing: {
      topic: "The Impact of Artificial Intelligence on Education",
      requirement:
        "请围绕人工智能对教育的影响，写一篇不少于150词的短文。需包含正面影响和潜在问题，并给出你的观点。",
    },
  },
];
