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
    const data = await get_idioms();
    res.json(data);
  }
});

async function get_idioms() {
  const response = await fetch('https://dictionary.goo.ne.jp/idiom/');
  const body = await response.text();
  const root = parse(body);
  const idioms =  root.querySelectorAll('.in-side-ttl-b').map(el => {
    const result = /([^_（）]+)（(.+)）/.exec(el.text);
    return {
      kanji: result[1],
      kana: result[2]
    };
  });
  const descs = await Promise.all(idioms.map(v => get_description(v.kanji)));
  return idioms.map((v,i) => Object.assign(v, { desc: descs[i]}));

}
async function get_description(idiom) {
  const uri = `https://dictionary.goo.ne.jp/word/${idiom}/`;
  const response = await fetch(encodeURI(uri));
  const body = await response.text();
  const root = parse(body);
  const desc = root.querySelector('.meaning_area').text;
  const result =  /([^▽]+)▽.*/.exec(desc);
  return result ? result[1]: desc;
}

