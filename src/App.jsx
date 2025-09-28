import "./App.css";
import { useMemo, useRef, useState } from "react";

/* ============================
   IPA Vowel Quiz – 完成版（音名フォールバック対応）
   ・母音: /audio/vowels/◯◯.mp3（_ と - どちらでもOK）
   ・例単語: /audio/◯◯.mp3（現状どおり）
   ・誤答は赤を蓄積、正解は緑→0.8秒後に次へ
   ============================ */

const VOWELS = [
  {
    key: "long-oo",
    labelEn: "long oo",
    // 実ファイルは long_oo.mp3。念のため両方試すのでどちらでも可
    sound: "long_oo.mp3",
    examples: [
      { word: "too", highlights: ["oo"] },
      { word: "loose", highlights: ["oo"] },
      { word: "through", highlights: ["ough", "oo"] },
    ],
  },
  {
    key: "short-e",
    labelEn: "short e",
    sound: "short_e.mp3",
    examples: [
      { word: "let", highlights: ["e"] },
      { word: "get", highlights: ["e"] },
      { word: "egg", highlights: ["e"] },
    ],
  },
  {
    key: "long-a",
    labelEn: "long a",
    sound: "long_a.mp3",
    examples: [
      { word: "fate", highlights: ["a"] },
      { word: "they", highlights: ["ey"] },
      { word: "great", highlights: ["ea", "a"] },
    ],
  },
  {
    key: "or-sound",
    labelEn: "or sound",
    sound: "or_sound.mp3",
    examples: [
      { word: "for", highlights: ["or"] },
      { word: "sort", highlights: ["or"] },
      { word: "storm", highlights: ["or"] },
    ],
  },
];

const CHOICES = ["or sound", "long a", "short e", "long oo"];

// 単語の最初の一致だけ赤にする
function highlightFirst(word, candidates) {
  const lower = word.toLowerCase();
  for (const h of candidates) {
    const i = lower.indexOf(h.toLowerCase());
    if (i !== -1) {
      return (
        word.slice(0, i) +
        `<span class="vowel-red">${word.slice(i, i + h.length)}</span>` +
        word.slice(i + h.length)
      );
    }
  }
  return word;
}

function ExampleWord({ word, highlights, onPlay }) {
  const html = useMemo(() => highlightFirst(word, highlights), [word, highlights]);
  return (
    <div className="ex-card">
      <div className="ex-word" dangerouslySetInnerHTML={{ __html: html }} />
      <button type="button" className="play-btn" onClick={onPlay}>▶ 再生</button>
    </div>
  );
}

// 404でも固まらず、候補を順番に試す再生
function useSmartAudio() {
  const ref = useRef(null);
  const play = (paths) => {
    const a = ref.current || new Audio();
    const srcs = Array.isArray(paths) ? paths : [paths];
    let i = 0;
    const tryNext = () => {
      if (i >= srcs.length) return;
      a.src = `/audio/${srcs[i++]}`;
      a.oncanplay = () => { a.play().catch(() => {}); a.oncanplay = null; a.onerror = null; };
      a.onerror = tryNext;
      a.load();
    };
    tryNext();
    ref.current = a;
  };
  return play;
}

export default function App() {
  const [qKey, setQKey] = useState(VOWELS[0].key);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [locked, setLocked] = useState(false);        // 正解後だけロック
  const [wrongPicks, setWrongPicks] = useState([]);   // 赤を蓄積
  const [correctPick, setCorrectPick] = useState(""); // 緑は1つ
  const playAudio = useSmartAudio();

  const current = useMemo(
    () => VOWELS.find(v => v.key === qKey) ?? VOWELS[0],
    [qKey]
  );

  const choiceList = useMemo(
    () => CHOICES.map(label => ({ label, value: label, isAnswer: label === current.labelEn })),
    [current]
  );

  const nextQuestion = () => {
    const others = VOWELS.filter(v => v.key !== qKey);
    const n = others[Math.floor(Math.random() * others.length)];
    setQKey(n.key);
    setWrongPicks([]);
    setCorrectPick("");
    setLocked(false);
  };

  const onAnswer = (choice) => {
    if (locked) return;
    const ok = choice === current.labelEn;
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));

    if (ok) {
      setCorrectPick(choice);
      setLocked(true);
      setTimeout(nextQuestion, 800);
    } else {
      setWrongPicks(prev => (prev.includes(choice) ? prev : [...prev, choice]));
    }
  };

  // 再生ユーティリティ
  const playVowel = () => {
    const base = current.sound; // 例: long_oo.mp3
    // フォールバック: _ と - の両方を試す
    const alt1 = base.replaceAll("_", "-");
    const alt2 = base.replaceAll("-", "_");
    playAudio([`vowels/${base}`, `vowels/${alt1}`, `vowels/${alt2}`]);
  };
  const playWord = (w) => playAudio(`${w}.mp3`);

  return (
    <div className="wrap">
      <h1>IPA Vowel Quiz　v3 FIX</h1>

      <div className="mode-row">
        <div>Mode: A（音→名称）</div>
        <div>Score: {score.correct} / {score.total}</div>
      </div>

      <div className="q-row">
        <span>母音の音を聞いて名称を選んでください</span>
        <button type="button" className="sound-btn" onClick={playVowel}>▶ 再生</button>
      </div>

      <div className="choices">
        {choiceList.map(c => {
          let style = {};
          if (correctPick === c.value) style = { outline: "2px solid #2ecc71" }; // 緑
          else if (wrongPicks.includes(c.value)) style = { outline: "2px solid #ff4d4f" }; // 赤（蓄積）
          return (
            <button
              type="button"
              key={c.value}
              className="choice"
              style={style}
              onClick={() => onAnswer(c.value)}
              disabled={locked} // 正解後のみロック
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <h2 className="sec-title">例単語</h2>
      <div className="examples">
        {current.examples.map(ex => (
          <ExampleWord
            key={ex.word}
            word={ex.word}
            highlights={ex.highlights}
            onPlay={() => playWord(ex.word)}
          />
        ))}
      </div>
    </div>
  );
}
