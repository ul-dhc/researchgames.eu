// Store instants as ISO UTC. Present them consistently in Riga, including DST.
export const DASHBOARD_TIME_ZONE='Europe/Riga';
export function formatTimestamp(value,language='lv',dateStyle='short'){
 return new Intl.DateTimeFormat(language==='lv'?'lv-LV':'en-GB',{
  timeZone:DASHBOARD_TIME_ZONE,dateStyle,timeStyle:'short'
 }).format(new Date(value));
}
