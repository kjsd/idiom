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
    const data = await (req.query.easy ? get_popular_idioms(req.query.n || 10)
                        : get_idioms(req.query.n || 10));
    res.json(data);
  }
});

const firsts_ = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆ'
      + 'よらりるれろわがぎぐげござじずぜぞだでどばびぶべぼ';

async function get_popular_idioms(num) {
  const response = await fetch('https://dictionary.goo.ne.jp/idiom/');
  const body = await response.text();
  const root = parse(body);
  const els = root.querySelectorAll('.title,.in-side-ttl-b');
  const idioms = random_sort(els).slice(0, num).map(el => {
    const result = /^([^（]+)（(.+)）/.exec(el.text);
    return {
      kanji: result[1],
      kana: result[2]
    };
  });
  const descs = await Promise.all(idioms.map(v => get_description(v.kanji)));
  return idioms.map((v,i) => Object.assign(v, { desc: descs[i]}));
}

async function get_idioms(num) {
  let n = 0;
  const idioms = [];
  while(n < num) {
    const next = (num - n > 3) ? 3: num - n;
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

async function get_description(idiom) {
  const uri = `https://dictionary.goo.ne.jp/word/${idiom}/`;
  const response = await fetch(encodeURI(uri));
  const body = await response.text();
  const root = parse(body);
  const el = root.querySelector('.meaning_area');
  const desc = root.querySelector('.meaning_area').text;
  const result =  /([^▽]+)▽.*/.exec(desc);
  return result ? result[1]: desc;
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
