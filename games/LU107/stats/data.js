export function newestStats(previous, incoming) {
 return previous && Date.parse(previous.generatedAt)>Date.parse(incoming.generatedAt) ? previous : incoming;
}
export async function fetchStats(url, period, signal, fetcher=fetch) {
 for (let attempt=0;attempt<2;attempt++) {
  try {
   const target=new URL(url);
   target.searchParams.set('resource','stats');
   target.searchParams.set('period',period);
   if (attempt) target.searchParams.set('t',String(Date.now()));
   const response=await fetcher(target,{signal,cache:'no-store'});
   if (!response.ok) throw new Error(`HTTP ${response.status}`);
   const data=await response.json();
   if (!data.ok || !data.overview || !Number.isFinite(Date.parse(data.generatedAt)) ||
       !['timeline','funnel','rounds','languages','mechanics','questions'].every(key=>Array.isArray(data[key]))) throw new Error('Invalid analytics response');
   return data;
  } catch (error) {
   if (signal.aborted || attempt===1) throw error;
  }
 }
}
