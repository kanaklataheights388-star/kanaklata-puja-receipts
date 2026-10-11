const KEY = 'kanaklata-puja-receipts-v1';
const SETTINGS_KEY = 'kanaklata-puja-settings-v1';
let receipts = JSON.parse(localStorage.getItem(KEY) || '[]');
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"year":"2026","collector":"Puja Committee","secretary":"Secretary, Kanaklata Heights Residents Durga Puja Committee"}');
let currentReceipt = null;
let editingId = null;
let showingAllReceipts = false;
const $ = id => document.getElementById(id);
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const dateText = iso => new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(iso));
function save(){ localStorage.setItem(KEY, JSON.stringify(receipts)); }
function renderList(){
  const total = receipts.reduce((sum,r)=>sum+Number(r.amount),0);
  $('totalCollected').textContent=money(total); $('receiptCount').textContent=receipts.length;
  $('latestNumber').textContent=receipts.length ? receipts[0].number : '—';
  const visibleReceipts=showingAllReceipts ? receipts : receipts.slice(0,5);
  $('recordsHeading').textContent=showingAllReceipts ? 'All receipts' : 'Recent receipts';
  $('viewAllButton').hidden=receipts.length<=5;
  $('viewAllButton').textContent=showingAllReceipts ? 'Show recent' : `View all (${receipts.length})`;
  $('viewAllButton').setAttribute('aria-expanded',String(showingAllReceipts));
  $('recentReceipts').innerHTML=receipts.length ? visibleReceipts.map(r=>`<button class="list-item" data-id="${r.id}"><span class="initial">${r.name.trim()[0].toUpperCase()}</span><span><b>${esc(r.name)}</b><small>${r.number} · ${dateText(r.date)} · ${esc(r.paymentMode)}</small></span><strong>${money(r.amount)}</strong></button>`).join('') : '<div class="empty">No receipts yet. Your generated receipts will be securely saved on this device.</div>';
  document.querySelectorAll('.list-item').forEach(el=>el.onclick=()=>showReceipt(receipts.find(r=>r.id===el.dataset.id)));
}

function renderReport(){
  const ordered=[...receipts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total=ordered.reduce((sum,r)=>sum+Number(r.amount||0),0);
  const contributors=new Set(ordered.map(r=>(r.name||'').trim().toLowerCase()).filter(Boolean)).size;
  $('reportYear').textContent=settings.year;
  $('reportSummary').innerHTML=`<article><span>Total collected</span><strong>${money(total)}</strong></article><article><span>Receipts</span><strong>${ordered.length}</strong></article><article><span>Contributors</span><strong>${contributors}</strong></article>`;
  $('reportRows').innerHTML=ordered.length ? ordered.map(r=>`<tr><td>${esc(r.number)}</td><td>${dateText(r.date)}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.purpose)}<small>${esc(r.paymentMode)}${r.notes ? ` · ${esc(r.notes)}` : ''}</small></td><td>${money(r.amount)}</td></tr>`).join('') : '<tr><td colspan="5" class="report-empty">No receipt records have been saved yet.</td></tr>';
}

function reportCsvCell(value){
  return `"${String(value??'').replace(/"/g,'""')}"`;
}

function downloadReport(){
  const ordered=[...receipts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const rows=[
    ['Receipt number','Payment date','Contributor name','Amount','Payment mode','Purpose','Notes','Collector'],
    ...ordered.map(r=>[r.number,dateText(r.date),r.name,r.amount,r.paymentMode,r.purpose,r.notes||'',r.collector||settings.collector||''])
  ];
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(reportCsvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=`kanaklata-puja-contribution-report-${settings.year}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function pdfText(value,limit=0){
  const text=String(value??'').replace(/[^\x20-\x7E]/g,'?');
  const shortened=limit ? text.slice(0,limit) : text;
  return shortened.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
}

function downloadReportPdf(){
  const ordered=[...receipts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total=ordered.reduce((sum,r)=>sum+Number(r.amount||0),0);
  const pages=[];
  for(let index=0;index<ordered.length||(!ordered.length&&index===0);index+=14) pages.push(ordered.slice(index,index+14));
  const pageObjects=pages.map((_,index)=>4+(index*2));
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageObjects.map(number=>`${number} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  const generated=dateText(new Date().toISOString());
  pages.forEach((page,pageIndex)=>{
    const line=(text,x,y,size=10,color='0.22 0.16 0.12')=>`BT /F1 ${size} Tf ${color} rg ${x} ${y} Td (${pdfText(text)}) Tj ET`;
    const content=[
      '0.99 0.96 0.89 rg 0 0 842 595 re f',
      '0.55 0.09 0.14 rg 28 552 786 3 re f',
      line('KANAKLATA HEIGHTS',32,520,22,'0.55 0.09 0.14'),
      line(`Sharodotsav ${settings.year} contribution report`,34,496,12,'0.08 0.39 0.27'),
      line(`Generated: ${generated}     |     Total collected: Rs. ${Number(total).toLocaleString('en-IN')}     |     Receipts: ${ordered.length}`,34,476,9),
      '0.55 0.09 0.14 rg 32 450 778 18 re f',
      line('RECEIPT / DATE',38,456,8,'1 1 1'),
      line('CONTRIBUTOR AND CONTRIBUTION DETAILS',230,456,8,'1 1 1'),
      line('AMOUNT',716,456,8,'1 1 1')
    ];
    if(!page.length) content.push(line('No receipt records have been saved yet.',38,420,11));
    page.forEach((receipt,rowIndex)=>{
      const y=426-(rowIndex*27);
      if(rowIndex%2===0) content.push(`0.96 0.92 0.84 rg 32 ${y-17} 778 25 re f`);
      content.push(line(`${receipt.number}  |  ${dateText(receipt.date)}`,38,y,9));
      content.push(line(`${receipt.name||''}`,230,y,10,'0.08 0.39 0.27'));
      content.push(line(`Rs. ${Number(receipt.amount||0).toLocaleString('en-IN')}`,716,y,9,'0.08 0.39 0.27'));
      content.push(line(`Payment: ${receipt.paymentMode||''}  |  ${receipt.purpose||''}${receipt.notes ? `  |  ${receipt.notes}` : ''}`,230,y-12,8));
    });
    content.push(line(`Page ${pageIndex+1} of ${pages.length}`,724,26,8,'0.45 0.35 0.27'));
    const stream=content.join('\n');
    const pageObject=4+(pageIndex*2);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageObject+1} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf='%PDF-1.4\n%----\n';
  const offsets=[0];
  objects.forEach((object,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
  const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset=>{pdf+=`${String(offset).padStart(10,'0')} 00000 n \n`;});
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const blob=new Blob([pdf],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=`kanaklata-puja-contribution-report-${settings.year}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function words(n){
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']; const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const two=x=>x<20?ones[x]:tens[Math.floor(x/10)]+(x%10?' '+ones[x%10]:''); const three=x=>x>=100?ones[Math.floor(x/100)]+' Hundred'+(x%100?' '+two(x%100):''):two(x);
  if(n===0)return 'Zero'; if(n>99999999)return String(n); let out=''; if(Math.floor(n/100000)>0){out+=three(Math.floor(n/100000))+' Lakh ';n%=100000}if(Math.floor(n/1000)>0){out+=two(Math.floor(n/1000))+' Thousand ';n%=1000}return (out+three(n)).trim();
}
function showReceipt(r){
  currentReceipt=r; const isShared=!r.id; $('detailTitle').textContent=r.number;
  $('receiptCard').innerHTML=`<div class="receipt-top"><div><p class="eyebrow">SHARODOTSAV ${esc(r.year)}</p><h3>Kanaklata Heights</h3><small>Residents · Narendrapur, Kolkata – 700103</small></div><div class="receipt-no">${esc(r.number)}</div></div><div class="receipt-body"><p>Received with gratitude from <b>${esc(r.name)}</b></p><p>towards <b>${esc(r.purpose)}</b></p><p>Payment date: <b>${dateText(r.date)}</b></p><p>Payment mode: ${esc(r.paymentMode)}${r.notes ? ' · '+esc(r.notes):''}</p><p class="amount-words">Rupees ${words(Number(r.amount))} only</p><b>${money(r.amount)}</b></div><div class="receipt-footer"><span>Collector<br><b>${esc(r.collector)}</b></span><span style="text-align:right">Secretary<br><b>${esc(r.secretary)}</b></span></div>`;
  $('toggleActions').hidden=true; document.querySelector('.share-actions').hidden=isShared; $('recordActions').hidden=isShared; $('receiptLinkNote').hidden=true; $('detailDialog').showModal();
}
function encodeReceipt(r){const copy={number:r.number,date:r.date,year:r.year,collector:r.collector,secretary:r.secretary,name:r.name,amount:r.amount,paymentMode:r.paymentMode,purpose:r.purpose,notes:r.notes};return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(copy)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
function decodeReceipt(value){try{const base=value.replaceAll('-','+').replaceAll('_','/'),padded=base+'='.repeat((4-base.length%4)%4);return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded),c=>c.charCodeAt(0))))}catch{return null}}
function detailedReceiptUrl(r){return location.origin+location.pathname+'?receipt='+encodeURIComponent(encodeReceipt(r))}
function loadArtwork(source){return new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=source})}
function drawFadedArtwork(c,image,x,y,w,h,alpha,direction){const layer=document.createElement('canvas');layer.width=c.canvas.width;layer.height=c.canvas.height;const l=layer.getContext('2d');l.globalAlpha=alpha;l.drawImage(image,x,y,w,h);l.globalCompositeOperation='destination-in';l.globalAlpha=1;const fade=direction==='vertical'?l.createLinearGradient(0,y,0,y+h):l.createLinearGradient(x,0,x+w,0);if(direction==='vertical'){fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(.42,'rgba(0,0,0,.7)');fade.addColorStop(.78,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,.75)')}else{fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(.45,'rgba(0,0,0,.7)');fade.addColorStop(.8,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,.9)')}l.fillStyle=fade;l.fillRect(x,y,w,h);c.drawImage(layer,0,0)}
async function receiptImage(r){const width=1200,height=840,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.fillStyle='#fff6df';c.fillRect(0,0,width,height);const [durga,community]=await Promise.all([loadArtwork('durga-receipt-background.png'),loadArtwork('community-puja-moment.jpg')]);if(community)drawFadedArtwork(c,community,0,288,1200,552,.43,'vertical');if(durga)drawFadedArtwork(c,durga,570,-35,600,900,.36,'horizontal');c.strokeStyle='#d69d2f';c.lineWidth=7;c.roundRect(14,14,width-28,height-28,25);c.stroke();c.strokeStyle='#fff0cb';c.lineWidth=6;c.roundRect(27,27,width-54,height-54,18);c.stroke();c.fillStyle='#c98a19';c.font='21px Georgia';c.fillText('✦   ✦   ✦',58,70);c.fillStyle='#9c291e';c.font='bold 22px Georgia';c.fillText('SHARODOTSAV '+r.year,58,112);c.font='italic bold 51px Georgia';c.fillText('Kanaklata Heights',58,170);c.fillStyle='#57483c';c.font='23px sans-serif';c.fillText('Residents · Narendrapur, Kolkata – 700103',58,208);c.fillStyle='#9a211c';c.textAlign='right';c.font='bold 25px Georgia';c.fillText(r.number,1140,118);c.textAlign='left';const divider=c.createLinearGradient(58,0,805,0);divider.addColorStop(0,'#bd8729');divider.addColorStop(.78,'#bd8729');divider.addColorStop(1,'rgba(189,135,41,0)');c.strokeStyle=divider;c.lineWidth=2;c.setLineDash([8,8]);c.beginPath();c.moveTo(58,240);c.lineTo(805,240);c.stroke();c.setLineDash([]);let y=300;c.fillStyle='#9c291e';c.font='45px Georgia';c.fillText('R',58,y);c.fillStyle='#57483c';c.font='25px sans-serif';c.fillText('eceived with gratitude from',88,y);c.fillStyle='#216343';c.font='bold 31px sans-serif';c.fillText(r.name,390,y);y+=66;c.fillStyle='#57483c';c.font='25px sans-serif';c.fillText('towards',58,y);c.fillStyle='#216343';c.font='bold 31px sans-serif';c.fillText(r.purpose,165,y);y+=55;c.fillStyle='#57483c';c.font='25px sans-serif';c.fillText('Payment date:',58,y);c.fillStyle='#216343';c.font='bold 31px sans-serif';c.fillText(dateText(r.date),238,y);y+=48;c.fillStyle='#57483c';c.font='25px sans-serif';c.fillText('Payment mode: '+r.paymentMode,58,y);y+=61;c.fillStyle='#8b1620';c.font='italic 27px Georgia';c.fillText('Rupees '+words(Number(r.amount))+' only',58,y);y+=64;c.fillStyle='#216343';c.roundRect(58,y-45,220,60,30);c.fill();c.fillStyle='#fff8e8';c.font='bold 42px Georgia';c.fillText(money(r.amount),82,y);c.strokeStyle='#bd8729';c.lineWidth=2;c.setLineDash([8,8]);c.beginPath();c.moveTo(58,695);c.lineTo(1140,695);c.stroke();c.setLineDash([]);c.fillStyle='#68584a';c.font='20px Georgia';c.fillText('Collector',58,744);c.font='bold 21px Georgia';c.fillText(r.collector,58,772);c.textAlign='right';c.font='20px Georgia';c.fillText('Secretary',1140,744);c.font='bold 20px Georgia';c.fillText(r.secretary,1140,772);c.textAlign='left';const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));return new File([blob],`${r.number}.png`,{type:'image/png'})}
function wrap(c,text,max){const words=text.split(' '),rows=[];let row='';for(const word of words){const next=row?row+' '+word:word;if(c.measureText(next).width>max&&row){rows.push(row);row=word}else row=next}if(row)rows.push(row);return rows}
function openNew(){ editingId=null; $('receiptForm').reset(); $('receiptDialog').showModal(); }
$('newReceiptButton').onclick=openNew; document.querySelector('[data-view="new"]').onclick=openNew;
$('receiptForm').onsubmit=e=>{e.preventDefault(); const data=new FormData(e.target); const existing=editingId&&receipts.find(r=>r.id===editingId); const r={...(existing||{}),id:existing?.id||crypto.randomUUID(),number:existing?.number||'KH-'+settings.year+'-'+String(receipts.length+1).padStart(4,'0'),date:existing?.date||new Date().toISOString(),year:existing?.year||settings.year,collector:settings.collector,secretary:settings.secretary,name:data.get('name').trim(),amount:data.get('amount'),paymentMode:data.get('paymentMode'),purpose:data.get('purpose'),notes:data.get('notes').trim()}; if(existing)receipts=receipts.map(x=>x.id===r.id?r:x);else receipts.unshift(r); editingId=null;save();renderList();$('receiptDialog').close();showReceipt(r)};
$('closeDetail').onclick=()=>$('detailDialog').close();
$('editButton').onclick=()=>{const r=currentReceipt;if(!r?.id)return;editingId=r.id;$('donorName').value=r.name;$('donationAmount').value=r.amount;$('paymentMode').value=r.paymentMode;$('purpose').value=r.purpose;$('notes').value=r.notes||'';$('detailDialog').close();$('receiptDialog').showModal();};
$('deleteButton').onclick=()=>{const r=currentReceipt;if(!r?.id)return;if(!confirm(`Delete receipt ${r.number}? This cannot be undone unless you restore a backup.`))return;receipts=receipts.filter(x=>x.id!==r.id);save();renderList();$('detailDialog').close();};
$('toggleActions').onclick=()=>{$('recordActions').hidden=!$('recordActions').hidden;};
$('nativeShareButton').onclick=async()=>{const r=currentReceipt,link=detailedReceiptUrl(r);if(navigator.share){try{await navigator.share({text:link});return}catch(err){if(err.name==='AbortError')return}}await navigator.clipboard.writeText(link);alert('Receipt link copied. Paste it anywhere to open this receipt.');};
$('imageShareButton').onclick=async()=>{const r=currentReceipt,file=await receiptImage(r),link=detailedReceiptUrl(r);if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:`Puja receipt ${r.number}`,text:link,files:[file]});return}catch(err){if(err.name==='AbortError')return}}const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);alert('Receipt image downloaded. Attach it in WhatsApp if the share panel did not open.');};
$('settingsButton').onclick=()=>{$('settingYear').value=settings.year;$('settingCollector').value=settings.collector;$('settingSecretary').value=settings.secretary;$('settingsDialog').showModal()};
$('closeSettings').onclick=()=>$('settingsDialog').close();$('saveSettings').onclick=()=>{settings={year:$('settingYear').value||'2026',collector:$('settingCollector').value||'Puja Committee',secretary:$('settingSecretary').value||'Secretary'};localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));$('settingsDialog').close();};
$('exportButton').onclick=()=>{const data=JSON.stringify({exportedAt:new Date().toISOString(),settings,receipts},null,2),file=new Blob([data],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=`kanaklata-puja-backup-${settings.year}.json`;a.click();URL.revokeObjectURL(a.href)};
$('importButton').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.receipts))throw new Error();if(!confirm(`Restore ${data.receipts.length} receipts from this backup? This replaces current records.`))return;receipts=data.receipts;settings=data.settings||settings;save();localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));renderList();$('settingsDialog').close();alert('Backup restored successfully.')}catch{alert('That backup file is not valid.')}finally{e.target.value=''}};
$('viewAllButton').onclick=()=>{showingAllReceipts=!showingAllReceipts;renderList();document.querySelector('.records-section').scrollIntoView({behavior:'smooth'});};document.querySelector('[data-view="records"]').onclick=()=>{showingAllReceipts=true;renderList();document.querySelector('.records-section').scrollIntoView({behavior:'smooth'});};document.querySelector('[data-view="home"]').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
const sharedPayload=new URLSearchParams(location.search).get('receipt')||new URLSearchParams(location.hash.slice(1)).get('receipt');if(sharedPayload){const shared=decodeReceipt(sharedPayload);if(shared)setTimeout(()=>showReceipt(shared),150)}
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw-v2.js'); renderList();

$('reportButton').onclick=()=>{renderReport();$('reportDialog').showModal();};
$('closeReport').onclick=()=>$('reportDialog').close();
$('reportDialog').addEventListener('click',event=>{if(event.target===$('reportDialog'))$('reportDialog').close();});
$('downloadReportButton').onclick=downloadReport;
$('downloadReportPdfButton').onclick=downloadReportPdf;
