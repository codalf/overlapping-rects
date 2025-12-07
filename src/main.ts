import './style.css'
import { sampleOutline, sampleRectangles, sampleRectangles2 } from './getSampleData.ts'
import { generateSVG } from './generateSvg.ts'
import { chatGpt } from './llms/chatGpt.ts';
import { gemini, gemini2 } from './llms/gemini.ts';
import { claude } from './llms/claude.ts';
import { mistral, mistral2 } from './llms/mistral.ts';
import { perplexity, perplexity2 } from './llms/perplexity.ts';
import { claude2 } from './llms/claude2.ts';
import { solution } from './llms/solution.ts';

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
  const solutionOutline = solution(sampleRectangles2);
  render(sampleRectangles2, solutionOutline, false);
}

function onChatGpt() {
  const chatGptOutline = chatGpt(sampleRectangles);
  render(sampleRectangles, chatGptOutline);
  render(sampleRectangles, [], false);
}

function onGemini() {
  const geminiOutline = gemini(sampleRectangles).map(([x, y]) => ({x, y}));
  render(sampleRectangles, geminiOutline);
  const geminiOutline2 = gemini2(sampleRectangles).map(([x, y]) => ({x, y}));
  render(sampleRectangles, geminiOutline2, false);
}

function onClaude() {
  const claudeOutline = claude(sampleRectangles);
  render(sampleRectangles, claudeOutline);
  const claudeOutline2 = claude2(sampleRectangles);
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

(document.getElementById('sample') as HTMLButtonElement).onclick = onSample;
(document.getElementById('chatgpt') as HTMLButtonElement).onclick = onChatGpt;
(document.getElementById('gemini') as HTMLButtonElement).onclick = onGemini;
(document.getElementById('claude') as HTMLButtonElement).onclick = onClaude;
(document.getElementById('mistral') as HTMLButtonElement).onclick = onMistral;
(document.getElementById('perplexity') as HTMLButtonElement).onclick = onPerplexity;

render(sampleRectangles, sampleOutline);
