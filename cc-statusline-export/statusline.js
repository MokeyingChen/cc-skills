#!/usr/bin/env node
const { stdin } = process;

const R = '\x1b[0m';
const c = {
  bold:   '\x1b[1m',
  cyan:   '\x1b[96m',
  green:  '\x1b[92m',
  yellow: '\x1b[93m',
  red:    '\x1b[91m',
  magenta:'\x1b[95m',
  blue:   '\x1b[94m',
  white:  '\x1b[97m',
  sblue:  '\x1b[34m',
};

let data = '';
stdin.setEncoding('utf8');
stdin.on('data', (chunk) => { data += chunk; });
stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    const model = input.model?.display_name ?? 'N/A';
    const effort = input.effort?.level ?? 'N/A';
    const thinking = input.thinking?.enabled;
    const dir = input.workspace?.current_dir ?? 'N/A';

    const ctx = input.context_window ?? {};
    const usedPct = ctx.used_percentage ?? 0;
    const ctxSize = ctx.context_window_size ?? 0;
    const totalIn = ctx.total_input_tokens ?? 0;
    const totalOut = ctx.total_output_tokens ?? 0;

    const cur = ctx.current_usage ?? {};
    const curIn = cur.input_tokens ?? 0;
    const curOut = cur.output_tokens ?? 0;

    const fmt = (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
    };

    const bar = (pct) => {
      const n = 20;
      const filled = Math.round(pct / (100 / n));
      const cBar = pct > 80 ? c.red : pct > 50 ? c.yellow : c.green;
      return '[' + cBar + '█'.repeat(filled) + R + '\x1b[2m' + '░'.repeat(n - filled) + R + ']';
    };

    const W = c.white;
    const tColor = thinking ? c.blue : W;

    const line1 = `${c.bold}${c.cyan}${model}${R} ${W}|${R} ${c.magenta}Effort:${effort}${R} ${W}|${R} ${tColor}Thinking:${thinking ? 'on' : 'off'}${R}`;
    const line2 = [
      `${W}Context:${R} ${bar(usedPct)} ${c.green}${Math.round(usedPct)}%${R} ${W}/${R} \x1b[36m${fmt(ctxSize)}${R}`,
      `${c.yellow}In:${fmt(totalIn)}${R} ${c.yellow}Out:${fmt(totalOut)}${R}`,
      `${W}Usage:${R} ${c.yellow}In:${fmt(curIn)}${R} ${c.yellow}Out:${fmt(curOut)}${R}`,
    ].join(` ${W}|${R} `);

    const line3 = `${dir}`;

    console.log(line1);
    console.log(line2);
    console.log(line3);
  } catch (e) {
    console.error('statusline parse error:', e.message);
  }
});
