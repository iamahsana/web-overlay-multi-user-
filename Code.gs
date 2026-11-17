/** Web Overlay Multi-User — Google Apps Script backend
 * Deploy as Web App: execute as Me, access Anyone.
 * Configure Script Property GOOGLE_CLIENT_ID before deployment.
 */
const APP_TITLE = 'Web Overlay Multi-User';
const SHEETS = { users:'Users', notes:'Catatan', overlays:'Overlays' };
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) || 'app';
  const file = page === 'overlay' ? 'Overlay' : 'Index';
  const t = HtmlService.createTemplateFromFile(file);
  t.overlayId = (e && e.parameter && e.parameter.id) || '';
  t.overlayType = (e && e.parameter && e.parameter.type) || 'wl';
  return t.evaluate().setTitle(APP_TITLE).addMetaTag('viewport','width=device-width, initial-scale=1');
}
function include(name){ return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function setup(){
  const p=PropertiesService.getScriptProperties();
  let id=p.getProperty('SPREADSHEET_ID');
  let ss=id?SpreadsheetApp.openById(id):SpreadsheetApp.create('Web Overlay Multi-User Database');
  p.setProperty('SPREADSHEET_ID',ss.getId());
  ensureSheet_(ss,SHEETS.users,['userId','email','displayName','createdAt']);
  ensureSheet_(ss,SHEETS.notes,['id','userId','date','customer','game','account','task','progress','status','price','details','updatedAt']);
  ensureSheet_(ss,SHEETS.overlays,['id','userId','type','data','updatedAt']);
  return {ok:true,spreadsheetUrl:ss.getUrl(),spreadsheetId:ss.getId()};
}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name)||ss.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(headers);return sh;}
function db_(){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw new Error('Database belum disiapkan. Jalankan setup() sekali.');return SpreadsheetApp.openById(id);}
function verify_(token){
  if(!token)throw new Error('Silakan login dengan Google.');
  const clientId=PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if(!clientId)throw new Error('Admin belum mengatur GOOGLE_CLIENT_ID di Script Properties.');
  const res=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(token),{muteHttpExceptions:true});
  if(res.getResponseCode()!==200)throw new Error('Sesi Google tidak valid. Login ulang.');
  const u=JSON.parse(res.getContentText());
  if(u.aud!==clientId||u.email_verified!=='true')throw new Error('Token atau akun Google tidak valid.');
  return {id:u.sub,email:u.email,name:u.name||u.email};
}
function api(token,action,payload){
  try{
    const user=verify_(token), p=payload||{}, ss=db_();
    register_(ss,user);
    let result;
    switch(action){
      case 'init': result=init_(ss,user);break;
      case 'saveNote': result=saveNote_(ss,user,p);break;
      case 'deleteNote': result=deleteNote_(ss,user,p.id);break;
      case 'saveOverlay': result=saveOverlay_(ss,user,p);break;
      case 'getOverlay': result=getOverlay_(ss,p.id,p.type);break;
      default: throw new Error('Aksi tidak dikenal.');
    }
    return {ok:true,data:result};
  }catch(err){return {ok:false,error:String(err.message||err)};}
}
function register_(ss,u){const sh=ss.getSheetByName(SHEETS.users), rows=sh.getDataRange().getValues();if(!rows.some((r,i)=>i&&String(r[0])===u.id))sh.appendRow([u.id,u.email,u.name,new Date().toISOString()]);}
function init_(ss,u){
  const notes=ss.getSheetByName(SHEETS.notes).getDataRange().getValues().slice(1).filter(r=>String(r[1])===u.id).map(noteObj_);
  const overlays=ss.getSheetByName(SHEETS.overlays).getDataRange().getValues().slice(1).filter(r=>String(r[1])===u.id).map(r=>({id:r[0],type:r[2],data:JSON.parse(r[3]||'{}'),updatedAt:r[4]}));
  return {user:{email:u.email,name:u.name},notes,overlays};
}
function noteObj_(r){return {id:r[0],date:r[2],customer:r[3],game:r[4],account:r[5],task:r[6],progress:r[7],status:r[8],price:r[9],details:r[10],updatedAt:r[11]};}
function saveNote_(ss,u,p){
  const sh=ss.getSheetByName(SHEETS.notes), rows=sh.getDataRange().getValues(), id=p.id||Utilities.getUuid(), now=new Date().toISOString();
  const row=[id,u.id,p.date||'',p.customer||'',p.game||'',p.account||'',p.task||'',p.progress||'',p.status||'Dalam proses',p.price||'',p.details||'',now];
  const idx=rows.findIndex((r,i)=>i>0&&String(r[0])===String(id)&&String(r[1])===u.id);
  if(idx>0)sh.getRange(idx+1,1,1,row.length).setValues([row]);else sh.appendRow(row);
  return noteObj_(row);
}
function deleteNote_(ss,u,id){const sh=ss.getSheetByName(SHEETS.notes),r=sh.getDataRange().getValues();for(let i=1;i<r.length;i++)if(String(r[i][0])===String(id)&&String(r[i][1])===u.id){sh.deleteRow(i+1);return true;}throw new Error('Catatan tidak ditemukan.');}
function saveOverlay_(ss,u,p){
  if(!['wl','text'].includes(p.type))throw new Error('Jenis overlay tidak valid.');
  const sh=ss.getSheetByName(SHEETS.overlays),rows=sh.getDataRange().getValues(),id=p.id||Utilities.getUuid(),now=new Date().toISOString(),data=JSON.stringify(p.data||{});
  const idx=rows.findIndex((r,i)=>i>0&&String(r[0])===String(id)&&String(r[1])===u.id);
  if(idx>0)sh.getRange(idx+1,1,1,5).setValues([[id,u.id,p.type,data,now]]);else sh.appendRow([id,u.id,p.type,data,now]);
  return {id,type:p.type,data:JSON.parse(data),updatedAt:now};
}
function getOverlay_(ss,id,type){
  const rows=ss.getSheetByName(SHEETS.overlays).getDataRange().getValues();
  const r=rows.find((x,i)=>i>0&&String(x[0])===String(id)&&String(x[2])===String(type));
  if(!r)throw new Error('Overlay tidak ditemukan.');
  return {id:r[0],type:r[2],data:JSON.parse(r[3]||'{}'),updatedAt:r[4]};
}
