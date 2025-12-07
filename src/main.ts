import './style.css'
import { sampleOutline, sampleRectangles } from './getSampleData.ts'
import { generateSVG } from './generateSvg.ts'
import { gpt_5_1 } from './llms/gpt/gpt_5_1.ts';
import { gpt_5_1_2nd } from './llms/gpt/gpt_5_1_2nd';
import { gemini_3_1st } from './llms/gemini/gemini_3_1st.ts';
import { claude } from './llms/claude/claude.ts';
import { mistral, mistral2 } from './llms/mistral/mistral.ts';
import { perplexity, perplexity2 } from './llms/perplexity/perplexity.ts';
import { claude2 } from './llms/claude/claude2.ts';
import { sonnet_4_5_1st } from './llms/claude/sonnet_4_5_1st.ts';
import { sonnet_4_5_2nd } from './llms/claude/sonnet_4_5_2nd.ts';
import { deepseek_3_2_a_1st, deepseek_3_2_b_1st } from './llms/deepseek/deepseek_3_2_1st.ts';
import { deepseek_3_2_b_2nd } from './llms/deepseek/deepseek_3_2_2nd.ts';
import { kimi_k2_1st } from './llms/kimi/kimi_k2_1st.ts';
// import { solution } from './llms/solution.ts';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

function render(rectangles: Rectangle[], outline: Point[], first = true): void {
  const svg = generateSVG(rectangles, outline);
  document.getElementById(first? 'first' : 'second')!.innerHTML = svg;
}

function onSample() {
  render(sampleRectangles, sampleOutline);
  // const solutionOutline = solution(sampleRectangles2);
  render(sampleRectangles, [], false);
}

function onGpt() {
  const gptOutline = gpt_5_1(sampleRectangles);
  render(sampleRectangles, gptOutline);
  const gptOutline2 = gpt_5_1_2nd(sampleRectangles);
  render(sampleRectangles, gptOutline2, false);
}

function onGemini() {
  const geminiOutline = gemini_3_1st(sampleRectangles);
  console.log(geminiOutline);
  render(sampleRectangles, geminiOutline[0]);
  // const geminiOutline2 = gemini2(sampleRectangles).map(([x, y]) => ({x, y}));
  render(sampleRectangles, [], false);
}

function onClaude() {
  const claudeOutline = sonnet_4_5_1st(sampleRectangles);
  render(sampleRectangles, claudeOutline);
  const claudeOutline2 = sonnet_4_5_2nd(sampleRectangles);
  render(sampleRectangles, claudeOutline2, false);
}

function onMistral() {
  const mistralOutline = mistral(sampleRectangles);
  render(sampleRectangles, mistralOutline);
  const mistralOutline2 = mistral2(sampleRectangles);
  render(sampleRectangles, mistralOutline2, false);
}

function onPerplexity() {
  const perplexityOutline = perplexity(sampleRectangles);
  render(sampleRectangles, perplexityOutline);
  const perplexityOutline2 = perplexity2(sampleRectangles);
  render(sampleRectangles, perplexityOutline2, false);
}

function onDeepseek() {
  const deepseekOutline = deepseek_3_2_b_1st(sampleRectangles);
  render(sampleRectangles, deepseekOutline);
  const deepseekOutline2 = deepseek_3_2_b_2nd(sampleRectangles);
  render(sampleRectangles, deepseekOutline2, false);
}

function onKimi() {
  const kimiOutline = kimi_k2_1st(sampleRectangles);
  render(sampleRectangles, kimiOutline);
  // const deepseekOutline2 = deepseek_3_2_b_2nd(sampleRectangles);
  render(sampleRectangles, [], false);
}

(document.getElementById('sample') as HTMLButtonElement).onclick = onSample;
(document.getElementById('gpt') as HTMLButtonElement).onclick = onGpt;
(document.getElementById('gemini') as HTMLButtonElement).onclick = onGemini;
(document.getElementById('claude') as HTMLButtonElement).onclick = onClaude;
(document.getElementById('mistral') as HTMLButtonElement).onclick = onMistral;
(document.getElementById('kimi') as HTMLButtonElement).onclick = onKimi;
(document.getElementById('deepseek') as HTMLButtonElement).onclick = onDeepseek;

render(sampleRectangles, sampleOutline);
