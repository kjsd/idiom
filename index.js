import functions from '@google-cloud/functions-framework';
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

functions.http('entry', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
  } else {
    const data = await get_idioms(req.query.n || 10);
    res.json(data);
  }
});

const firsts_ = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆ'
      + 'よらりるれろわがぎぐげござじずぜぞだでどばびぶべぼ';

async function get_idioms(num) {
  let n = 0;
  const idioms = [];
  while(n < num) {
    const next = (num - n > 10) ? 10: num - n;
    const i = random(0, firsts_.length);
    const uri = `https://dictionary.goo.ne.jp/idiom/index/${firsts_.charAt(i)}`;
    const response = await fetch(encodeURI(uri));
    const body = await response.text();
    const root = parse(body);
    const els = random_sort(root.querySelectorAll('.title')).slice(0, next);
    
    els.forEach(el => {
      const result = /^([^【]+)【(.+)】/.exec(el.text);
      const desc = /^([^▽]+)▽.*/.exec(el.nextElementSibling.text);
      idioms.push({
        kanji: result[2],
        kana: result[1],
        desc: desc ? desc[1]: el.nextElementSibling.text
      });
    });
    
    n += next;
  }
  return idioms;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function random_sort(org) {
  const ary = org.concat();
  let a = ary.length;
  while (a) {
    const j = Math.floor( Math.random() * a);
    const t = ary[--a];
    ary[a] = ary[j];
    ary[j] = t;
  }
  return ary;
}
